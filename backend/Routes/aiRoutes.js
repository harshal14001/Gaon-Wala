import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Product from '../Models/Products.js';

const router = express.Router();

if (!process.env.GEMINI_API_KEY) {
  console.error("⚠️  GEMINI_API_KEY not configured - AI features will fail");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Only the embedding model — no chat model, zero chat API tokens spent
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

// ── Retry helper for embedding (only Gemini call we make) ─────────────────
const embedWithRetry = async (text, retries = 3, delayMs = 800) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const result = await embeddingModel.embedContent(text);
            return result.embedding.values;
        } catch (err) {
            const is503 = err?.status === 503 || err?.message?.includes("503");
            if (is503 && attempt < retries) {
                console.warn(`⚠️  Embedding 503 — attempt ${attempt}/${retries}, retrying in ${delayMs}ms...`);
                await new Promise(res => setTimeout(res, delayMs));
                delayMs *= 2;
            } else {
                throw err;
            }
        }
    }
};

// ── Step 1: Check if query mentions a specific product by name ─────────────
// Matches "mangoes" → "Mango", "onion" → "Onion", etc.
// Returns the DB title string if found, null otherwise.
// Zero Gemini calls — pure string matching.
const findMentionedProduct = (query, allProducts) => {
    const q = query.toLowerCase();
    for (const product of allProducts) {
        const t = product.title.toLowerCase();
        if (
            q.includes(t) ||                          // exact: "mango"
            q.includes(t + 's') ||                    // plural: "mangos"
            q.includes(t + 'es') ||                   // plural: "mangoes"
            (t.endsWith('s')  && q.includes(t.slice(0, -1))) ||   // "onions" → "onion"
            (t.endsWith('es') && q.includes(t.slice(0, -2)))       // "tomatoes" → "tomato"
        ) {
            return product; // return full product object
        }
    }
    return null;
};

// ── Step 2: Detect broad inventory queries ─────────────────────────────────
const isBroadQuery = (query) => {
    const broadPatterns = [
        /what.*(have|got|stock|sell|available)/i,
        /show.*(all|everything|products|items)/i,
        /list.*(all|products|items)/i,
        /all (products|items|stock)/i,
        /what('s| is).*(in stock|available)/i,
        /do you have everything/i,
        /full (menu|list|inventory)/i,
    ];
    return broadPatterns.some(p => p.test(query.trim()));
};

// ── Step 3: Build the response — no Gemini, pure JS ───────────────────────
const buildResponse = (query, matchedProducts, specificProduct = null) => {
    const q = query.toLowerCase();
    const isPriceQuery = /price|cost|kitna|rate|how much|₹|rupee/i.test(q);

    // ── Specific product was identified in query ───────────────────────────
    if (specificProduct) {
        const outOfStock = (specificProduct.stock ?? 0) === 0;
        if (outOfStock) {
            return {
                thought: `Sorry ji, ${specificProduct.title} is currently out of stock. 😔`,
                recommended_product_names: []
            };
        }
        if (isPriceQuery) {
            return {
                thought: `${specificProduct.title} is priced at ₹${specificProduct.price}.`,
                recommended_product_names: [specificProduct.title]
            };
        }
        return {
            thought: `Yes! We have fresh ${specificProduct.title} in stock for ₹${specificProduct.price}. 🌿`,
            recommended_product_names: [specificProduct.title]
        };
    }

    // ── No specific product — work with matched list ───────────────────────
    const inStock = matchedProducts.filter(p => (p.stock ?? 0) > 0);

    if (inStock.length === 0) {
        return {
            thought: "Sorry ji, nothing matching that is available right now. Please check back soon!",
            recommended_product_names: []
        };
    }

    const names = inStock.map(p => p.title).join(", ");

    // Broad / category queries
    if (isBroadQuery(query)) {
        return {
            thought: `Here's what we have in stock: ${names}. What would you like to order? 🛒`,
            recommended_product_names: inStock.map(p => p.title)
        };
    }
    if (/fruit/i.test(q))                      return { thought: `Here are our fruits: ${names}. 🍎`, recommended_product_names: inStock.map(p => p.title) };
    if (/vegetable|veggie|sabzi/i.test(q))     return { thought: `Here are our vegetables: ${names}. 🥦`, recommended_product_names: inStock.map(p => p.title) };
    if (/plant/i.test(q))                      return { thought: `Here are our plants: ${names}. 🌱`, recommended_product_names: inStock.map(p => p.title) };
    if (/seed/i.test(q))                       return { thought: `Here are our seeds: ${names}. 🌾`, recommended_product_names: inStock.map(p => p.title) };
    if (/milk|dairy|ghee|paneer/i.test(q))     return { thought: `Here are our dairy products: ${names}. 🥛`, recommended_product_names: inStock.map(p => p.title) };

    // Semantic match result — show what vector search found
    return {
        thought: `Here's what I found for you: ${names}. 🌿`,
        recommended_product_names: inStock.map(p => p.title)
    };
};

// ── Main route ─────────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ success: false, error: "Query required" });

        // ── Greeting — instant, no DB needed ──────────────────────────────
        const isGreeting = /^(hi|hello|namaste|hey|good\s*(morning|evening|afternoon))[\s!?.]*$/i.test(query.trim());
        if (isGreeting) {
            return res.json({
                success: true,
                responseMessage: "Namaste! 🙏 Welcome to GaonWala. What would you like to buy today?",
                productsToDisplay: []
            });
        }

        // ── Fetch all product titles cheaply (no embeddings, no Gemini) ───
        // Used for name-matching — tiny payload, just title + stock + price
        const allProducts = await Product.find({}).select('title price stock image category').lean();

        if (allProducts.length === 0) {
            return res.json({
                success: true,
                responseMessage: "Sorry ji, our shop is currently empty!",
                productsToDisplay: []
            });
        }

        // ── PRIORITY 1: Does query mention a specific product by name? ─────
        // e.g. "do you have mangoes?" → finds Mango → direct answer, no vector search
        const specificProduct = findMentionedProduct(query, allProducts);

        if (specificProduct) {
            console.log(`✅ Direct name match: "${specificProduct.title}"`);
            const aiData = buildResponse(query, [], specificProduct);
            const cards = aiData.recommended_product_names.length > 0
                ? [specificProduct]
                : [];
            return res.json({
                success: true,
                responseMessage: aiData.thought,
                productsToDisplay: cards
            });
        }

        // ── PRIORITY 2: Broad query → fetch all, skip vector search ───────
        if (isBroadQuery(query)) {
            console.log(`📋 Broad query — returning all products`);
            const aiData = buildResponse(query, allProducts);
            const cards = allProducts.filter(p =>
                aiData.recommended_product_names.includes(p.title)
            );
            return res.json({
                success: true,
                responseMessage: aiData.thought,
                productsToDisplay: cards
            });
        }

        // ── PRIORITY 3: Semantic query → vector search ─────────────────────
        // Only reaches here for queries like "something sweet", "gift for farmer"
        console.log(`🔍 Semantic query — vector search`);
        let matchedProducts = [];

        try {
            const queryVector   = await embedWithRetry(query);
            const totalProducts = allProducts.length;
            const limit         = Math.min(10, totalProducts);
            const numCandidates = Math.max(totalProducts, limit + 10);

            matchedProducts = await Product.aggregate([
                {
                    $vectorSearch: {
                        index:        "vector_index",
                        path:         "embedding",
                        queryVector,
                        numCandidates,
                        limit,
                    }
                },
                { $project: { embedding: 0, __v: 0 } }
            ]);
        } catch (err) {
            console.warn("⚠️  Vector search failed, falling back to full fetch:", err.message);
            matchedProducts = allProducts;
        }

        // If vector search returned nothing, fall back to all products
        if (matchedProducts.length === 0) {
            console.warn("⚠️  Vector search returned 0 results — using full product list");
            matchedProducts = allProducts;
        }

        const aiData = buildResponse(query, matchedProducts);
        const finalCards = matchedProducts.filter(p =>
            aiData.recommended_product_names.includes(p.title)
        );

        res.json({
            success: true,
            responseMessage: aiData.thought,
            productsToDisplay: finalCards
        });

    } catch (error) {
        console.error("AI Route Error:", error);
        res.status(500).json({ success: false, error: "AI request failed" });
    }
});

export default router;

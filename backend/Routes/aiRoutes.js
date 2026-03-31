import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateSalesPrompt } from '../utils/promptTemplates.js';
import Product from '../Models/Products.js';

const router = express.Router();

const genAI     = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ── Gemini call with exponential backoff on 503 / 429 ─────────────────────
const askGemini = async (prompt, retries = 3, delayMs = 1500) => {
    for (let i = 1; i <= retries; i++) {
        try {
            const result = await chatModel.generateContent(prompt);
            return result.response.text();
        } catch (err) {
            const code     = err?.status;
            const retryable = code === 503 || code === 429;
            console.warn(`⚠️  Gemini attempt ${i}/${retries} — status ${code}`);
            if (retryable && i < retries) {
                await new Promise(r => setTimeout(r, delayMs));
                delayMs *= 2;   // 1.5s → 3s → 6s
            } else {
                throw err;
            }
        }
    }
};

// ── PATH 1: Greeting — zero DB, zero tokens ───────────────────────────────
const isGreeting = (q) =>
    /^(hi+|hello|namaste|hey|good\s*(morning|evening|afternoon|night))[\s!?.]*$/i.test(q.trim());

// ── PATH 2: Exact product name in query — zero tokens ─────────────────────
// Sorted longest-title-first so "Mango Plant" matches before "Mango"
const findMentionedProduct = (query, products) => {
    const q      = query.toLowerCase();
    const sorted = [...products].sort((a, b) => b.title.length - a.title.length);

    for (const p of sorted) {
        const t        = p.title.toLowerCase();
        const variants = new Set([t, t + 's', t + 'es']);
        if (t.endsWith('es')) variants.add(t.slice(0, -2));
        if (t.endsWith('s'))  variants.add(t.slice(0, -1));

        for (const v of variants) {
            if (new RegExp(`\\b${v}\\b`, 'i').test(q)) return p;
        }
    }
    return null;
};

// ── PATH 2 response — pure JS, no LLM ────────────────────────────────────
const directAnswer = (query, product) => {
    const q = query.toLowerCase();
    if ((product.stock ?? 0) === 0) {
        return {
            responseMessage: `Sorry ji, ${product.title} is currently out of stock. 😔`,
            productsToDisplay: []
        };
    }
    if (/price|cost|kitna|rate|how much|₹|rupee/i.test(q)) {
        return {
            responseMessage: `${product.title} is priced at ₹${product.price}.`,
            productsToDisplay: [product]
        };
    }
    return {
        responseMessage: `Yes! We have fresh ${product.title} in stock for ₹${product.price}. 🌿`,
        productsToDisplay: [product]
    };
};

// ── PATH 3: Broad inventory query — zero tokens ───────────────────────────
const isBroadInventoryQuery = (q) => [
    /what.*(have|got|stock|sell|available)/i,
    /show.*(all|everything|products|items)/i,
    /list.*(all|products|items)/i,
    /^all (products|items|stock)/i,
    /what('s| is).*(in stock|available)/i,
    /full (menu|list|inventory)/i,
].some(p => p.test(q.trim()));

// ── Main route ────────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query?.trim())
            return res.status(400).json({ success: false, error: "Query required" });

        // ── PATH 1: Greeting ──────────────────────────────────────────────
        if (isGreeting(query)) {
            return res.json({
                success: true,
                responseMessage: "Namaste! 🙏 Welcome to GaonWala. What would you like to buy today?",
                productsToDisplay: []
            });
        }

        // ── Fetch all products (no embeddings — lightweight) ──────────────
        const allProducts = await Product.find({})
            .select('title price stock image category')
            .lean();

        if (allProducts.length === 0) {
            return res.json({
                success: true,
                responseMessage: "Sorry ji, our shop is currently empty!",
                productsToDisplay: []
            });
        }

        // ── PATH 2: Query contains exact product name ─────────────────────
        // "do you have mango?", "price of ghee?", "is onion in stock?"
        const hit = findMentionedProduct(query, allProducts);
        if (hit) {
            console.log(`✅ PATH 2 — direct match: "${hit.title}"`);
            return res.json({ success: true, ...directAnswer(query, hit) });
        }

        // ── PATH 3: Broad inventory query ─────────────────────────────────
        if (isBroadInventoryQuery(query)) {
            console.log(`📋 PATH 3 — broad query`);
            const inStock = allProducts.filter(p => (p.stock ?? 0) > 0);
            return res.json({
                success: true,
                responseMessage: `Here's what we have in stock: ${inStock.map(p => p.title).join(", ")}. 🛒`,
                productsToDisplay: inStock
            });
        }

        // ── PATH 4: All other queries → Gemini with FULL inventory ────────
        //
        // This is the intelligence layer. Gemini uses its real food knowledge to:
        //   "do you have orange?"      → sees no orange in list → "sorry, we don't have it"
        //   "something spicy?"         → knows onion/ginger are spicy, not aloe vera
        //   "something tangy?"         → knows tamarind/lemon are tangy
        //   "list what you don't have" → handles trick/nonsense queries
        //   "gift under ₹200"          → filters by price intelligently
        //
        // Sending all ~20 products is tiny context — no vector search needed at this scale.
        // Vector search LOST the reasoning because embeddings don't encode taste/flavour.
        console.log(`🤖 PATH 4 — Gemini: "${query}"`);

        const prompt = generateSalesPrompt(query, allProducts);
        let rawText;

        try {
            rawText = await askGemini(prompt);
        } catch (err) {
            console.error(`❌ Gemini unavailable after retries: ${err.message}`);
            return res.json({
                success: true,
                responseMessage: "⏳ Our AI is a little busy right now. Please try again in a moment!",
                productsToDisplay: []
            });
        }

        // Strip markdown fences Gemini occasionally wraps around JSON
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        let aiData;
        try {
            aiData = JSON.parse(cleaned);
        } catch {
            console.error("JSON parse failed. Raw output:", cleaned);
            return res.json({
                success: true,
                responseMessage: cleaned.slice(0, 250),
                productsToDisplay: []
            });
        }

        const recommended = aiData.recommended_product_names || [];
        const finalCards  = allProducts.filter(p => recommended.includes(p.title));

        return res.json({
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

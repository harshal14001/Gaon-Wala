import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Product from '../Models/Products.js';
import { generateSalesPrompt } from '../utils/promptTemplates.js';

const router = express.Router();

if (!process.env.GEMINI_API_KEY) {
    console.error("⚠️  GEMINI_API_KEY not configured - AI features will fail");
}

const genAI          = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
const chatModel      = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

// ── Embed query with retry ─────────────────────────────────────────────────
const embedWithRetry = async (text, retries = 3, delayMs = 800) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const result = await embeddingModel.embedContent(text);
            return result.embedding.values;
        } catch (err) {
            const is503 = err?.status === 503 || err?.message?.includes("503");
            if (is503 && attempt < retries) {
                console.warn(`⚠️  Embedding 503 — retrying in ${delayMs}ms...`);
                await new Promise(res => setTimeout(res, delayMs));
                delayMs *= 2;
            } else throw err;
        }
    }
};

// ── Parse Gemini JSON — handles markdown fences ────────────────────────────
const parseGeminiJSON = (raw) => {
    const clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response: " + raw.slice(0, 200));
    return JSON.parse(match[0]);
};

// ── Main route ─────────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query?.trim()) {
            return res.status(400).json({ success: false, error: "Query required" });
        }

        console.log(`\n========================================`);
        console.log(`📨 Query: "${query}"`);

        // ── STEP 1: Embed the user query ───────────────────────────────────
        console.log(`🔢 Embedding query...`);
        const queryVector = await embedWithRetry(query);
        console.log(`✅ Query embedded (${queryVector.length} dims)`);

        // ── STEP 2: Vector search — retrieve top semantically close products ─
        // Because embeddings are now RICH (LLM-described), "spicy" will match
        // Ginger, "sweet" will match Mango, "something for soup" will match
        // Onion/Tomato/Ginger etc.
        const totalProducts = await Product.countDocuments();
        const limit         = Math.min(8, totalProducts);
        const numCandidates = Math.max(totalProducts, limit + 10);

        console.log(`🔍 Vector search (limit: ${limit}, candidates: ${numCandidates})...`);
        let retrievedProducts = [];

        try {
            retrievedProducts = await Product.aggregate([
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
            console.log(`✅ Vector search returned ${retrievedProducts.length} products`);
            console.log(`   Top matches: ${retrievedProducts.map(p => p.title).join(", ")}`);
        } catch (err) {
            // Vector search failed — fall back to full product list
            console.warn(`⚠️  Vector search failed: ${err.message}`);
            console.log(`   Falling back to full product list...`);
            retrievedProducts = await Product.find({})
                .select('title price stock image category')
                .lean();
        }

        if (retrievedProducts.length === 0) {
            console.warn(`⚠️  No results — falling back to full product list`);
            retrievedProducts = await Product.find({})
                .select('title price stock image category')
                .lean();
        }

        // ── STEP 3: Gemini understands intent + picks the right products ───
        // Vector search gives Gemini a SHORT, RELEVANT list (not all 500 products)
        // Gemini then reasons: "user wants spicy → Ginger qualifies → recommend it"
        console.log(`🤖 Calling Gemini with ${retrievedProducts.length} candidate products...`);
        const prompt = generateSalesPrompt(query, retrievedProducts);
        const result = await chatModel.generateContent(prompt);
        const raw    = result.response.text().trim();
        console.log(`🤖 Gemini raw: ${raw}`);

        // ── STEP 4: Parse response and map to DB objects ───────────────────
        let geminiData;
        try {
            geminiData = parseGeminiJSON(raw);
        } catch (parseErr) {
            console.error(`❌ JSON parse failed: ${parseErr.message}`);
            return res.json({
                success: true,
                responseMessage: "Sorry ji, I had trouble understanding that. Please try again! 🙏",
                productsToDisplay: []
            });
        }

        const responseMessage   = geminiData.thought                  || "Here's what I found! 🌿";
        const recommendedTitles = geminiData.recommended_product_names || [];

        console.log(`✅ Response: "${responseMessage}"`);
        console.log(`✅ Recommended: ${recommendedTitles.join(", ")}`);

        // Map titles back to full product objects (case-insensitive)
        const allProducts      = await Product.find({}).select('title price stock image category').lean();
        const productsToDisplay = recommendedTitles
            .map(title => allProducts.find(p => p.title.toLowerCase() === title.toLowerCase()))
            .filter(Boolean)
            .filter(p => (p.stock ?? 0) > 0);

        console.log(`🛒 Showing ${productsToDisplay.length} cards`);
        console.log(`========================================\n`);

        return res.json({
            success: true,
            responseMessage,
            productsToDisplay
        });

    } catch (error) {
        console.error("❌ AI Route Error:", error.message);
        res.status(500).json({ success: false, error: "AI request failed" });
    }
});

export default router;

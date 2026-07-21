import express from 'express';
import Groq from 'groq-sdk';
import Product from '../Models/Products.js';
import { generateSalesPrompt } from '../utils/promptTemplates.js';

const router = express.Router();

if (!process.env.GROQ_API_KEY) console.error("⚠️  GROQ_API_KEY not configured");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Generate embeddings using Groq (or fallback to simple hash-based approach) ─
const generateSimpleEmbedding = (text) => {
    // For now, use a simple hash-based embedding as placeholder
    // In production, consider using a dedicated embedding service
    const chars = text.toLowerCase().split('');
    const embedding = new Array(1536).fill(0);
    
    for (let i = 0; i < chars.length; i++) {
        const charCode = chars[i].charCodeAt(0);
        embedding[i % 1536] += charCode / 255;
    }
    
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => norm > 0 ? val / norm : 0);
};

// ── Parse Groq JSON — handles markdown fences ────────────────────────────
const parseGroqJSON = (raw) => {
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

        // ── STEP 1: Generate embedding for query ──────────────────────────
        console.log(`🔢 Generating query embedding...`);
        const queryVector = generateSimpleEmbedding(query);
        console.log(`✅ Query embedded (${queryVector.length} dims)`);

        // ── STEP 2: Vector search — retrieve top semantically close products ─
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

        // ── STEP 3: Groq understands intent + picks the right products ───
        console.log(`🤖 Calling Groq LLM with ${retrievedProducts.length} candidate products...`);
        const prompt = generateSalesPrompt(query, retrievedProducts);
        
        const message = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            max_tokens: 1024,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        const raw = message.choices[0].message.content.trim();
        console.log(`🤖 Groq response: ${raw.substring(0, 200)}...`);

        // ── STEP 4: Parse response and map to DB objects ───────────────────
        let groqData;
        try {
            groqData = parseGroqJSON(raw);
        } catch (parseErr) {
            console.error(`❌ JSON parse failed: ${parseErr.message}`);
            return res.json({
                success: true,
                responseMessage: "Sorry ji, I had trouble understanding that. Please try again! 🙏",
                productsToDisplay: []
            });
        }

        const responseMessage   = groqData.thought                  || "Here's what I found! 🌿";
        const recommendedTitles = groqData.recommended_product_names || [];

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

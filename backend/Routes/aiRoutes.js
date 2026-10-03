import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import Product from '../Models/Products.js';
import { generateSalesPrompt } from '../utils/promptTemplates.js';

const router = express.Router();

if (!process.env.GEMINI_API_KEY) console.error("⚠️  GEMINI_API_KEY not configured — retrieval will fall back to the full product list");
if (!process.env.GROQ_API_KEY)   console.error("⚠️  GROQ_API_KEY not configured — AI replies will be unavailable");

// Query embeddings MUST come from the same model vectorize.js used for the
// product embeddings (gemini-embedding-001, 3072 dims). Vectors from any other
// model (or a different dimension count) live in a different space, so the
// similarity scores would be meaningless — and Atlas rejects the mismatch.
const genAI          = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

// Built only when a key exists: `new Groq()` throws without one, which would
// crash the whole backend (orders, payments, admin) over a missing AI key.
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// ── Embed the user query (retries transient 503s) ────────────────────────────
const embedWithRetry = async (text, retries = 3, delayMs = 800) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const result = await embeddingModel.embedContent(text);
            return result.embedding.values;
        } catch (err) {
            const is503 = err?.status === 503 || err?.message?.includes("503");
            if (is503 && attempt < retries) {
                console.warn(`⚠️  Embedding 503 — retry ${attempt}/${retries} in ${delayMs}ms`);
                await new Promise((res) => setTimeout(res, delayMs));
                delayMs *= 2;
            } else {
                throw err;
            }
        }
    }
};

// ── Parse the LLM's JSON — tolerates markdown fences / stray text ─────────────
const parseJSON = (raw) => {
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

        if (!groq) {
            return res.status(503).json({ success: false, error: "AI assistant is not configured" });
        }

        console.log(`\n========================================`);
        console.log(`📨 Query: "${query}"`);

        // One fetch, reused for retrieval fallback AND mapping the LLM's picks back
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

        // ── STEP 1+2: Retrieval — embed the query, vector-search the closest products ──
        let candidates = [];
        try {
            const queryVector   = await embedWithRetry(query);
            const limit         = Math.min(8, allProducts.length);
            const numCandidates = Math.max(allProducts.length, limit + 10);

            candidates = await Product.aggregate([
                {
                    $vectorSearch: {
                        index: "vector_index",
                        path:  "embedding",
                        queryVector,
                        numCandidates,
                        limit,
                    }
                },
                { $project: { embedding: 0, __v: 0 } }
            ]);
            console.log(`🔍 Vector search → ${candidates.length} candidates: ${candidates.map((p) => p.title).join(", ")}`);
        } catch (err) {
            console.warn(`⚠️  Retrieval failed (${err.message}) — using the full product list`);
        }

        if (candidates.length === 0) candidates = allProducts;

        // ── STEP 3: LLM understands the intent and picks from the candidates ──
        // gpt-oss is a reasoning model: reasoning tokens come out of the same
        // budget as the answer, so keep effort low and the limit generous —
        // otherwise it can burn the whole budget thinking and return nothing.
        const prompt     = generateSalesPrompt(query, candidates);
        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            reasoning_effort: "low",
            max_completion_tokens: 2048,
            messages: [{ role: "user", content: prompt }],
        });

        const raw = completion.choices?.[0]?.message?.content?.trim() || "";
        console.log(`🤖 LLM: ${raw.slice(0, 200)}${raw.length > 200 ? "…" : ""}`);

        // ── STEP 4: Parse + map the LLM's titles back to full product objects ──
        let data;
        try {
            data = parseJSON(raw);
        } catch (parseErr) {
            console.error(`❌ JSON parse failed: ${parseErr.message}`);
            return res.json({
                success: true,
                responseMessage: "Sorry ji, I had trouble understanding that. Please try again! 🙏",
                productsToDisplay: []
            });
        }

        const responseMessage   = data.thought || "Here's what I found! 🌿";
        const recommendedTitles = Array.isArray(data.recommended_product_names)
            ? data.recommended_product_names
            : [];

        const productsToDisplay = recommendedTitles
            .map((title) => allProducts.find((p) => p.title.toLowerCase() === String(title).toLowerCase()))
            .filter(Boolean)
            .filter((p) => (p.stock ?? 0) > 0);

        console.log(`🛒 "${responseMessage}" → ${productsToDisplay.length} card(s)`);
        console.log(`========================================\n`);

        return res.json({ success: true, responseMessage, productsToDisplay });

    } catch (error) {
        console.error("❌ AI Route Error:", error.message);
        res.status(500).json({ success: false, error: "AI request failed" });
    }
});

export default router;

import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateSalesPrompt } from '../utils/promptTemplates.js'; // Import the new template
import Product from '../models/Products.js'; // Import your Product Model

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// Route: Customer Chat / Recommendation
router.post('/chat', async (req, res) => {
    try {
        const { query } = req.body; // User's question, e.g., "I need Vitamin C"

        if (!query) {
            return res.status(400).json({ success: false, error: "Query is required" });
        }

        // 1. FETCH REAL PRODUCTS FROM DB
        // We only pick specific fields (name, price, description) to save tokens
        const products = await Product.find({}).select('title price description');

        if (products.length === 0) {
            return res.json({ success: true, answer: "Sorry ji, our shop is currently empty!" });
        }

        // 2. Build the prompt with your Inventory
        const finalPrompt = generateSalesPrompt(query, products);

        // 3. Ask AI
        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();

        // 4. Send answer
        res.json({ success: true, answer: text });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ success: false, error: "Failed to generate answer" });
    }
});

export default router;
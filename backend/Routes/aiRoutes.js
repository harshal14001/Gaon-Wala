import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

router.post('/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "Prompt is required" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ success: true, answer: text });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ success: false, error: "AI Failed to respond" });
    }
});

export default router;
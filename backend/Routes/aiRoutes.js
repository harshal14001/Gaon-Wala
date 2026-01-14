import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateDescriptionPrompt } from '../utils/promptTemplates.js'; // Import the template

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// Route 1: Smart Description Generator
router.post('/generate-description', async (req, res) => {
    try {
        const { productName, details } = req.body;

        if (!productName || !details) {
            return res.status(400).json({ success: false, error: "Product name and details are required" });
        }

        // 1. Create the specific prompt using our template
        const finalPrompt = generateDescriptionPrompt(productName, details);

        // 2. Ask Gemini
        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();

        // 3. Send back the smart description
        res.json({ success: true, description: text });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ success: false, error: "Failed to generate description" });
    }
});

export default router;
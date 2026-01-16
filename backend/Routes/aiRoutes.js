import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateSalesPrompt } from '../utils/promptTemplates.js'; 
import Product from '../models/Products.js';

const router = express.Router();


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
router.post('/chat', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ success: false, error: "Query required" });

        // FIX 1: Select 'title' instead of 'name'
        const allProductsDB = await Product.find({}).select('title price description image _id');

        if (allProductsDB.length === 0) {
            return res.json({ 
                success: true, 
                responseMessage: "Sorry ji, shop is empty!", 
                productsToDisplay: [] 
            });
        }

        // 2. Ask AI
        const finalPrompt = generateSalesPrompt(query, allProductsDB);
        const result = await model.generateContent(finalPrompt);
        let aiRawText = await result.response.text();

        // Cleanup
        aiRawText = aiRawText.replace(/```json/g, '').replace(/```/g, '').trim();

        // 3. Parse JSON
        let aiData;
        try {
             aiData = JSON.parse(aiRawText);
        } catch (e) {
            console.error("AI JSON Parse Error:", aiRawText);
            aiData = { thought: "Sorry, I'm having trouble processing that right now.", recommended_product_names: [] };
        }

        const finalProductCards = allProductsDB.filter(product => 
            aiData.recommended_product_names.includes(product.title)
        );

        res.json({
            success: true,
            responseMessage: aiData.thought,
            productsToDisplay: finalProductCards
        });

    } catch (error) {
        console.error("AI Route Error:", error);
        res.status(500).json({ success: false, error: "AI request failed" });
    }
});

export default router;
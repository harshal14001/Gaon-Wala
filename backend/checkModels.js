import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("Checking available models...");
    
    try {
        // Ask Google for the list
        const modelList = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).getGenerativeModelResponse; 
        // Wait, the standard way to list is via the API directly, let's use the correct method:
        
        // RE-WRITE TO USE FETCH DIRECTLY TO BE SAFE
        const key = process.env.GEMINI_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.models) {
            console.log("\n✅ AVAILABLE MODELS:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name.replace("models/", "")}`);
                }
            });
        } else {
            console.log("❌ Error:", data);
        }

    } catch (error) {
        console.error("Failed:", error);
    }
}

listModels();
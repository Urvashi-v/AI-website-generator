const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // 1. Check for API Errors first
        if (data.error) {
            console.error("❌ Google API Error:", data.error.message);
            console.log("Status:", data.error.status);
            return;
        }

        // 2. Check if 'models' actually exists in the response
        if (data.models && Array.isArray(data.models)) {
            console.log("--- YOUR ACCESSIBLE MODELS ---");
            data.models.forEach(m => {
                console.log(`> ${m.name.replace('models/', '')}`);
            });
        } else {
            console.log("⚠️ No models found. Full Response:", JSON.stringify(data));
        }
    } catch (e) {
        console.error("❌ System Error:", e.message);
    }
}

checkModels();
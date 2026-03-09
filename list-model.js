const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    // 1. Initialize the client
    const genAI = new GoogleGenerativeAI("AIzaSyBC4Bol7-zmyJFtmK9J_MKzhn5DSE3n0RE");

    try {
        // In the newest SDKs, listModels might be part of the main export 
        // or require a direct REST call if the SDK method is deprecated.
        // Let's try the direct REST method which is 100% foolproof:
        const apiKey = "AIzaSyBC4Bol7-zmyJFtmK9J_MKzhn5DSE3n0RE";
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();

        console.log("--- YOUR ACCESSIBLE MODELS ---");
        data.models.forEach(model => {
            console.log(`> ${model.name.replace('models/', '')}`);
        });

    } catch (error) {
        console.error("Still having trouble listing models:", error.message);
    }
}

listModels();
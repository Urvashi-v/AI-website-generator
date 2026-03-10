require('dotenv').config();
const fs = require('fs');
const prompt = require('prompt-sync')();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelNames = ["gemini-2.5-flash", "gemini-1.5-pro", "gemini-pro"];

async function getAIResponse(userPrompt) {
  for (let name of modelNames) {
    try {
      console.log(`Checking model: ${name}...`);
      const model = genAI.getGenerativeModel({ model: name });
      const result = await model.generateContent(userPrompt);
      return result.response.text();
    } 
    catch (err) {
      if (err.status === 503 || err.message.includes("503")) {
      console.warn(`\n !! ${name} is busy. Trying next...!!`);
      continue; 
      }
      throw err;
    }
  }
  throw new Error("All AI models are busy. Try again in a minute.");
}

async function buildApp() {
  console.log("WELCOME TO THE AUTO-WEBSITE GENERATOR");
  const userRequest = prompt("How can I help ypu? ");

  const aiPrompt = `
    User wants: ${userRequest}
    Return ONLY a JSON object with this structure:
    {
      "files": [
      { "name": "index.html", "content": "..." },
      { "name": "style.css", "content": "..." }
      ]
    }
    Do not include markdown backticks or explanations.
    CRITICAL: You are a headless API. You must output ONLY the JSON object. Any text before or after the JSON will break my system. Do not use markdown backticks.
  `;

  try {
    console.log("Architecting your files...");
    const rawText = await getAIResponse(aiPrompt);

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("The AI didn't return a valid JSON object. Try rephrasing your prompt.");
    }
        
    const cleanJSON = jsonMatch[0];
    const project = JSON.parse(cleanJSON);

    project.files.forEach(file => {
    fs.writeFileSync(file.name, file.content);
    console.log(`🛠️ Generated: ${file.name}`);
    });

    console.log("\n PROJECT READY! Check your folder for the new files.");
  } 
  catch (error) {
    console.error("Build failed:", error.message);
  }
}

buildApp();
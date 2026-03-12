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

  const filesToRead = ['index.html', 'style.css', 'script.js', 'server.js'];
  let existingCode = "";
  
  filesToRead.forEach(file => {
      if (fs.existsSync(file)) {
          existingCode += `\n--- FILE: ${file} ---\n${fs.readFileSync(file, 'utf8')}\n`;
      }
  });


 const aiPrompt = `
    Build a professional, interactive web project for: ${userRequest}.
    You are an Iterative Web Editor.
    EXISTING CODE: 
    ${existingCode || "None (starting fresh)"}
    
    USER'S REQUEST: 
    ${userRequest}
    
    INSTRUCTIONS:
    - If there is existing code, modify it based on the user's request.
    - If no code exists, build it from scratch.
    - Maintain the same file structure.
    - Return ONLY the updated JSON object with the 'files' array.

    rules for generating a new project is mentioned below. If there is existing code, use it as a base and modify  it according to the user's request while following the same rules.
    
    RULES:
    1. You MUST provide exactly four files: 'index.html', 'style.css', 'script.js' and 'server.js'
    2. 'index.html' must link to 'style.css' and 'script.js'.
    3. 'script.js' must contain the interactive logic (e.g., button clicks, form handling, or animations).
    4. 'server.js': A Node.js/Express server using Mongoose to save data.
    DATABASE LOGIC:
    - In 'server.js', use 'process.env.MONGO_URI' for the connection string.
    - Create a Schema that matches the data (e.g., Reactor calculations).
    - Provide an API endpoint '/api/save' (POST) and '/api/history' (GET).
    4. Return ONLY a JSON object:
    {
      "files": [
        { "name": "index.html", "content": "..." },
        { "name": "style.css", "content": "..." },
        { "name": "script.js", "content": "..." },
        { "name": "server.js", "content": "..." }
      ]
    }
    No explanations or markdown.
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

async function run() {
  while (true) {
    await buildApp();
    const cont = prompt("\nApply another change? (y/n): ");
    if (cont.toLowerCase() !== 'y') {
      console.log("Goodbye! Happy Coding.");
      process.exit();
    }
  }
}

run();
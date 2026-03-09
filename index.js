require('dotenv').config();
const fs = require('fs');
const userPrompt = require('prompt-sync')();
const { GoogleGenerativeAI } = require("@google/generative-ai"); 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// The rest of your code...
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function buildApp() {
  console.log("WELCOME TO THE AI APP OR WEBSITE GENERATOR!! PLEASE LET US KNOW YOUR NEEDS...");
  const userRequest = userPrompt("Please describe the kid of website you want to genereate...");

  console.log("Thinking and generating a beautiful website for you !!");

  const aiPrompt = `
    You are an expert web developer. 
    The user wants: ${userRequest}
    Generate ONLY the code for a single-file 'index.html' including CSS. 
    Do not include any explanations, just the code starting with <!DOCTYPE html>.
  `;

  try {
    const result = await model.generateContent(aiPrompt);
    const code = result.response.text();
    fs.writeFileSync('index.html', code);
      console.log("--------------------------------------------");
      console.log("DONE! Your AI has built the website.");
      console.log("Open 'index.html' in your browser to see it!");
    } 
    
    catch (error) {
      console.error("Error talking to the AI:", error);
  }

}

buildApp();
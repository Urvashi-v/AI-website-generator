const fs = require('fs');
const userPrompt = "A dark themed landing page for a coffee shop";
const generateHTML = (description) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>AI Generated Site</title>
        <style>
            body { background: #1a1a1a; color: #f5f5f5; font-family: sans-serif; text-align: center; padding-top: 50px; }
            .card { border: 2px solid #6f4e37; display: inline-block; padding: 20px; border-radius: 10px; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Welcome to the Coffee Shop</h1>
            <p>Generated based on: ${description}</p>
        </div>
    </body>
    </html>
  `;
};

const content = generateHTML(userPrompt);

fs.writeFile('generated_site.html', content, (err) => {
  if (err) throw err;
  console.log('Success! Your AI-built website file has been created.');
});

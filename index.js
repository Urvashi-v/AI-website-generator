const fs = require('fs');
const userPrompt = require('prompt-sync')();
console.log("HEY WELCOME TO THIS WEBSITE AND APP GENERATOR");
const choice = userPrompt("What kind of website you wanna make?");

let themeColor = "#ffffff"; 
let title = "My New Website";

if (choice.toLowerCase() === 'coffee') {
    themeColor = "#6f4e37"; 
    title = "The Morning Brew";
} else if (choice.toLowerCase() === 'gym') {
    themeColor = "#225f13"; 
    title = "Iron Paradise Gym";
}

const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { background: ${themeColor}; color: white; font-family: sans-serif; text-align: center; }
        .container { margin-top: 100px; padding: 50px; border: 5px solid white; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <p>This site was built by your AI Script because you typed: ${choice}</p>
    </div>
</body>
</html>
`;

fs.writeFileSync('generated_site.html', htmlTemplate);
console.log("--------------------------------------------");
console.log("DONE! Open 'generated_site.html' to see the result.");
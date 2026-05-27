const fs = require('fs');
const code = fs.readFileSync('src/store/useSchoolStore.ts', 'utf8');

function stripStringsAndComments(str) {
  return str.replace(/\\"|\\'/g, '') // remove escaped quotes
            .replace(/"[^"]*"/g, '') // remove double quoted strings
            .replace(/'[^']*'/g, '') // remove single quoted strings
            .replace(/`[^`]*`/g, '') // remove backtick strings
            .replace(/\/\/.*$/gm, '') // remove line comments
            .replace(/\/\*[\s\S]*?\*\//g, ''); // remove block comments
}

const stripped = stripStringsAndComments(code);
const lines = stripped.split('\n');

let b = 0, p = 0;
let lastB = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (ch === '{') b++;
    if (ch === '}') b--;
    if (ch === '(') p++;
    if (ch === ')') p--;
  }
  
  if (i % 50 === 0) {
     console.log(`Line ${i}: braces=${b}, parens=${p}`);
  }
}
console.log(`Final counts - braces: ${b}, parens: ${p}`);

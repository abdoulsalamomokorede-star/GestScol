const fs = require('fs');
let content = fs.readFileSync('src/data/mockData.ts', 'utf8');
content = content.replace(/justifiee: false \},/g, "justifiee: false, anneeScolaire: '2024-2025' },");
fs.writeFileSync('src/data/mockData.ts', content);

const fs = require('fs');
let content = fs.readFileSync('src/data/mockData.ts', 'utf8');
content = content.replace(/trimestre: (1|2|3), anneeScolaire: '2024-2025',\s+anneeScolaire: '2024-2025',/g, "trimestre: $1, anneeScolaire: '2024-2025',");
fs.writeFileSync('src/data/mockData.ts', content);

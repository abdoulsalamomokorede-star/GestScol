const fs = require('fs');
let content = fs.readFileSync('src/data/mockData.ts', 'utf8');

// Replace notes without anneeScolaire
content = content.replace(/trimestre: (1|2|3), date:/g, "trimestre: $1, anneeScolaire: '2024-2025', date:");

// Absences
content = content.replace(/justifiee: (true|false),/g, "justifiee: $1, anneeScolaire: '2024-2025',");

// Paiements (fix the type: 'scolarite' fallback issue)
content = content.replace(/type: 'scolarite', anneeScolaire: '2024-2025'/g, (match, offset, str) => {
    const prevContext = str.substring(offset - 40, offset);
    if (prevContext.includes('inscriptionId:')) {
        return "type: 'inscription', anneeScolaire: '2024-2025'";
    }
    return match;
});

fs.writeFileSync('src/data/mockData.ts', content);

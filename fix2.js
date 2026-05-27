const fs = require('fs');
let content = fs.readFileSync('src/data/mockData.ts', 'utf8');

content = content.replace(/\{([^}]+)\}/g, (match) => {
    if (match.includes('inscriptionId:')) {
        return match.replace(/type: 'scolarite'/g, "type: 'inscription'");
    }
    return match;
});

fs.writeFileSync('src/data/mockData.ts', content);

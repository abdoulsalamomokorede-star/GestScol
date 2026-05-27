
const fs = require('fs');

// Read mockData.ts
const code = fs.readFileSync('src/data/mockData.ts', 'utf-8');

// We don't have an AST parser, so let's just do something simple.
// We have export const inscriptionsMock: Inscription[] = [...]
// We have export const paiementsMock: Paiement[] = [...]

console.log('Script written');


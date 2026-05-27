const fs = require('fs');
const file = 'src/store/useSchoolStore.ts';
let code = fs.readFileSync(file, 'utf8');
const lines = code.split('\n');

// We want to remove lines 540 to 613 inclusive (0-indexed 539 to 612).
// Double check the content first to be safe.
if (lines[539].includes('addInscription: async (inscription) => {') && lines[612].includes('anneeScolaire: p.annee_scolaire,')) {
    lines.splice(539, 74);
    fs.writeFileSync(file, lines.join('\n'));
    console.log('Successfully removed lines 540 to 613');
} else {
    console.log('Error: Lines did not match expected content');
    console.log('Line 540:', lines[539]);
    console.log('Line 613:', lines[612]);
}

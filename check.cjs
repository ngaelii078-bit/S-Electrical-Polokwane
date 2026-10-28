const fs = require('fs');
const html = fs.readFileSync('dist/index.html', 'utf8');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw Error('Duplicate IDs');
for (const match of html.matchAll(/href="#([^"]+)"/g)) {
  if (!ids.includes(match[1])) throw Error('Missing section: ' + match[1]);
}
for (const file of ['styles.css', 'script.js']) {
  if (!fs.existsSync('dist/' + file)) throw Error('Missing asset: ' + file);
}
console.log('Local assets, section links and unique IDs verified.');

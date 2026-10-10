// Copies static site files into ./dist for GitHub Pages deployment.
const fs = require('fs');
const path = require('path');
const out = 'dist';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const name of fs.readdirSync('.')) {
  if (['.git', '.github', 'node_modules', out, 'package.json', 'package-lock.json', 'build.js', 'SECURITY.md'].includes(name)) continue;
  fs.cpSync(name, path.join(out, name), { recursive: true });
}
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('Built to', out);

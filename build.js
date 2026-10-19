const fs = require('node:fs');
const path = require('node:path');

const outputDirectory = path.join(__dirname, 'dist');
fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(
  path.join(outputDirectory, 'index.html'),
  '<h1>Hello CI</h1>\n',
  'utf8',
);

console.log('Build complete: dist/index.html');

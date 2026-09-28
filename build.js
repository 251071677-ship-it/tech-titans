const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');

// Clean and recreate dist directory
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true, force: true });
}
fs.mkdirSync(DIST, { recursive: true });

// Files to copy into dist
const FILES = [
  'index.html',
  'style.css',
  'app.js',
  'three.min.js'
];

for (const file of FILES) {
  const src = path.join(__dirname, file);
  const dest = path.join(DIST, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  Copied: ${file}`);
  } else {
    console.warn(`  Warning: ${file} not found, skipping`);
  }
}

console.log('\nBuild complete! Output in dist/');

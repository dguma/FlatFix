// Cross-platform copy of CRA build output into root /build for Vercel static-build
// Ensures old build is removed first
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const srcDir = path.join(root, 'client', 'build');
const destDir = path.join(root, 'build');

function rimraf(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (!fs.existsSync(srcDir)) {
  console.error('Build output not found at', srcDir);
  process.exit(1);
}

rimraf(destDir);
copyRecursive(srcDir, destDir);
console.log('Copied client build to /build for deployment.');

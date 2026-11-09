import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

function copyRecursive(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function buildZip() {
  const distDir = path.resolve('./dist');
  const extDir = path.resolve('./extension');

  // 1. If web app dist exists, inject the full index code into extension/dashboard.html
  if (fs.existsSync(distDir)) {
    const distHtmlPath = path.join(distDir, 'index.html');
    if (fs.existsSync(distHtmlPath)) {
      let html = fs.readFileSync(distHtmlPath, 'utf8');
      // Convert absolute root paths to relative paths for Chrome extension environment
      html = html.replace(/(src|href)="\/assets\//g, '$1="./assets/');
      html = html.replace(/(src|href)="\/icons\//g, '$1="./icons/');
      html = html.replace(/(src|href)="\/assets\/aistudio\//g, '$1="./assets/aistudio/');
      
      fs.writeFileSync(path.join(extDir, 'dashboard.html'), html, 'utf8');
      console.log('✓ Successfully embedded full web index app into extension/dashboard.html');
    }

    // Copy dist/assets to extension/assets recursively
    const distAssetsDir = path.join(distDir, 'assets');
    const extAssetsDir = path.join(extDir, 'assets');
    if (fs.existsSync(distAssetsDir)) {
      copyRecursive(distAssetsDir, extAssetsDir);
      console.log('✓ Copied bundled assets recursively to extension/assets/');
    }

    // Copy dist/icons to extension/icons recursively
    const distIconsDir = path.join(distDir, 'icons');
    const extIconsDir = path.join(extDir, 'icons');
    if (fs.existsSync(distIconsDir)) {
      copyRecursive(distIconsDir, extIconsDir);
      console.log('✓ Copied icons recursively to extension/icons/');
    }
  }

  // 2. Package everything in extension/ into the ZIP
  const zip = new JSZip();

  function addDir(dirPath, zipFolder) {
    const files = fs.readdirSync(dirPath);
    for (const f of files) {
      const fullPath = path.join(dirPath, f);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        addDir(fullPath, zipFolder.folder(f));
      } else {
        const content = fs.readFileSync(fullPath);
        zipFolder.file(f, content);
      }
    }
  }

  addDir(extDir, zip);

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  if (!fs.existsSync('./public')) fs.mkdirSync('./public', { recursive: true });

  // v2.2.23-Fixed
  fs.writeFileSync('./public/Prayer-Focus-v2.2.23-Fixed.zip', buffer);
  fs.writeFileSync('./Prayer-Focus-v2.2.23-Fixed.zip', buffer);

  // Backward compatibility aliases
  fs.writeFileSync('./public/Prayer-Focus-v2.2.22-Fixed.zip', buffer);
  fs.writeFileSync('./Prayer-Focus-v2.2.22-Fixed.zip', buffer);
  fs.writeFileSync('./public/Prayer-Focus-v2.2.21-Fixed.zip', buffer);
  fs.writeFileSync('./Prayer-Focus-v2.2.21-Fixed.zip', buffer);

  console.log(`✓ Successfully created Prayer-Focus-v2.2.23-Fixed.zip (size: ${buffer.length} bytes)`);
}

buildZip().catch(console.error);

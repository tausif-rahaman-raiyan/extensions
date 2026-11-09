import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function buildZip() {
  const zip = new JSZip();
  const extDir = path.resolve('./extension');

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

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  if (!fs.existsSync('./public')) fs.mkdirSync('./public');
  fs.writeFileSync('./public/Prayer-Focus-v2.2.21-Fixed.zip', buffer);
  fs.writeFileSync('./Prayer-Focus-v2.2.21-Fixed.zip', buffer);
  console.log('Successfully created Prayer-Focus-v2.2.21-Fixed.zip (size:', buffer.length, 'bytes)');
}

buildZip().catch(console.error);

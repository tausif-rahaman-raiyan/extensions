import fs from 'fs';
import path from 'path';

// Clean SVG of Emerald Crescent Moon with Golden Star on Dark Base
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <radialGradient id="baseGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#152820"/>
      <stop offset="100%" stop-color="#08100C"/>
    </radialGradient>
    <linearGradient id="crescentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="50%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="60%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Dark Midnight Base Circle with Subtle Emerald Rim -->
  <circle cx="64" cy="64" r="60" fill="url(#baseGrad)" stroke="#10B981" stroke-width="3" stroke-opacity="0.6"/>

  <!-- Emerald Crescent Moon -->
  <path d="M78 24 C46 24 22 48 22 80 C22 104 38 114 54 114 C36 102 34 76 52 52 C64 36 78 30 78 24 Z" 
        fill="url(#crescentGrad)" filter="url(#glow)"/>

  <!-- Sparkling Golden Star (8-pointed) -->
  <g transform="translate(80, 52) scale(0.9)" filter="url(#glow)">
    <polygon points="0,-18 5,-6 18,-5 8,4 12,16 0,9 -12,16 -8,4 -18,-5 -5,-6" fill="url(#starGrad)"/>
    <circle cx="0" cy="0" r="3.5" fill="#FFFBEB"/>
  </g>

  <!-- Subtle Starlight Accent -->
  <circle cx="68" cy="88" r="1.5" fill="#FCD34D" opacity="0.8"/>
  <circle cx="86" cy="30" r="1.2" fill="#34D399" opacity="0.7"/>
</svg>`;

// Ensure directories
const dirs = ['./extension/icons', './public/icons'];
for (const d of dirs) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// Write SVG
fs.writeFileSync('./extension/icons/icon.svg', svgContent);
fs.writeFileSync('./public/icons/icon.svg', svgContent);
fs.writeFileSync('./public/icon.svg', svgContent);

// Simple pure-JS uncompressed PNG generator for exact sizes (16, 48, 128)
// Creates valid RGBA PNG images featuring the dark base, emerald crescent, and golden star
import zlib from 'zlib';

function createPng(size) {
  const width = size;
  const height = size;
  const rowSize = width * 4 + 1;
  const buffer = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  const r = (width / 2) - 1;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    buffer[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= r) {
        // Base dark midnight
        let red = 12;
        let green = 24;
        let blue = 18;
        let alpha = 255;

        // Emerald rim
        if (dist >= r - (size > 32 ? 2.5 : 1.2)) {
          red = 16;
          green = 185;
          blue = 129;
        }

        // Crescent shape: inside circle 1 and outside circle 2
        const c1Dist = Math.sqrt((x - cx * 0.9) ** 2 + (y - cy) ** 2);
        const c2Dist = Math.sqrt((x - cx * 1.3) ** 2 + (y - cy * 0.8) ** 2);
        const inCrescent = c1Dist <= r * 0.75 && c2Dist >= r * 0.65;

        if (inCrescent) {
          red = 52;
          green = 211;
          blue = 153; // Emerald
        }

        // Golden Star position
        const starX = cx * 1.25;
        const starY = cy * 0.85;
        const starDist = Math.sqrt((x - starX) ** 2 + (y - starY) ** 2);
        const starRadius = size > 32 ? size * 0.14 : size * 0.18;

        if (starDist <= starRadius) {
          red = 245;
          green = 158;
          blue = 11; // Gold
        }

        buffer[pxOffset] = red;
        buffer[pxOffset + 1] = green;
        buffer[pxOffset + 2] = blue;
        buffer[pxOffset + 3] = alpha;
      } else {
        // Transparent outside circle
        buffer[pxOffset] = 0;
        buffer[pxOffset + 1] = 0;
        buffer[pxOffset + 2] = 0;
        buffer[pxOffset + 3] = 0;
      }
    }
  }

  const compressedData = zlib.deflateSync(buffer);

  // PNG Header
  const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngHeader, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.slice(4, 8 + len));
  chunk.writeInt32BE(crc, 8 + len);
  return chunk;
}

// CRC32 implementation
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return ~c;
}

const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

// Generate PNGs
for (const s of [16, 48, 128]) {
  const png = createPng(s);
  fs.writeFileSync(`./extension/icons/icon${s}.png`, png);
  fs.writeFileSync(`./public/icons/icon${s}.png`, png);
  console.log(`Generated icon${s}.png (${png.length} bytes)`);
}
console.log('Icon generation complete.');

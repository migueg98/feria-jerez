/*
 * Optimiza el plano de la feria para web.
 * Entrada:  public/mapa-feria.png (u otros que pase el usuario)
 * Salida:   public/plano-feria.jpg (~1-2 MB, ~3000 px ancho, JPG calidad 90)
 *
 * Uso:
 *   npm run optimize-plano
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const INPUT_CANDIDATES = [
  'public/mapa-feria.png',
  'public/plano-feria-original.png',
  'public/plano-feria-original.jpg',
  'public/plano-feria.png',
];
const OUTPUT = 'public/plano-feria.jpg';
const TARGET_WIDTH = 3000;
const QUALITY = 90;

const input = INPUT_CANDIDATES.find((p) => fs.existsSync(p));
if (!input) {
  console.error('✗ No se encontró la imagen original. Pon el plano en:');
  INPUT_CANDIDATES.forEach((p) => console.error('   -', p));
  process.exit(1);
}

const statsIn = fs.statSync(input);
console.log(`→ Entrada:  ${input} (${(statsIn.size / 1024 / 1024).toFixed(2)} MB)`);

const meta = await sharp(input).metadata();
console.log(`  Dimensiones originales: ${meta.width} x ${meta.height}`);

const outputBuffer = await sharp(input, { limitInputPixels: false })
  .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
  .jpeg({ quality: QUALITY, progressive: true, mozjpeg: true })
  .toBuffer();

fs.writeFileSync(OUTPUT, outputBuffer);

const statsOut = fs.statSync(OUTPUT);
const metaOut = await sharp(OUTPUT).metadata();
console.log(`✓ Salida:    ${OUTPUT} (${(statsOut.size / 1024 / 1024).toFixed(2)} MB)`);
console.log(`  Dimensiones finales: ${metaOut.width} x ${metaOut.height}`);
console.log(
  `  Reducción: ${((1 - statsOut.size / statsIn.size) * 100).toFixed(1)}% más pequeño`,
);

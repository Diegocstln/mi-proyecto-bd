import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const expectedPhotos = [
  'WhatsApp Image 2026-03-27 at 12.41.10.jpeg',
  'WhatsApp Image 2026-04-08 at 11.01.42.jpeg',
  'WhatsApp Image 2026-04-08 at 15.08.41.jpeg',
  'WhatsApp Image 2026-04-20 at 17.59.25.jpeg',
  'WhatsApp Image 2026-04-27 at 15.39.18.jpeg',
  'WhatsApp Image 2026-05-18 at 20.51.41.jpeg',
  'WhatsApp Image 2026-05-18 at 20.52.33.jpeg',
  'WhatsApp Image 2026-05-18 at 20.53.17.jpeg',
  'WhatsApp Image 2026-05-18 at 20.57.38.jpeg',
];

const root = process.cwd();
const html = readFileSync(join(root, 'index.html'), 'utf8');

const failures = [];

if (!html.includes('data-view-target="fotos"')) {
  failures.push('Missing Fotos navigation tab.');
}

if (!html.includes('id="view-fotos"') || !html.includes('data-view="fotos"')) {
  failures.push('Missing Fotos view section.');
}

for (const photo of expectedPhotos) {
  const relativePath = `fotos/${photo}`;

  if (!existsSync(join(root, relativePath))) {
    failures.push(`Missing copied photo: ${relativePath}`);
  }

  if (!html.includes(relativePath.replaceAll('&', '&amp;'))) {
    failures.push(`Missing photo reference in index.html: ${relativePath}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Gallery check passed for ${expectedPhotos.length} photos.`);

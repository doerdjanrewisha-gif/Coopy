// Downloads meal photos at build time (Unsplash, free licence) so the app
// serves them from its own domain. Never fails the build: the app shows
// an illustrated placeholder for any photo that is missing.
import { mkdir, writeFile, access } from 'node:fs/promises';

const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`;
const PHOTOS = {
  header: ['1542838132-92c53300491e', '1604719312566-8912e9227c6a', '1534723452862-4c874018d66d'],
  'chickpea-curry': ['1565557623262-b51c2513a641', '1631292784640-2b24be784d5d', '1585937421612-70a008356fbe'],
  'tomato-mozzarella-pasta': ['1621996346565-e3dbc646d9a9', '1473093295043-cdd812d0e601', '1551183053-bf91a1d81141'],
  shakshuka: ['1590412200988-a436970781fa', '1608039829572-78524f79c4c7', '1525351484163-7529414344d8'],
  'noodle-stir-fry': ['1569718212165-3a8278d5f624', '1585032226651-759b368d7246', '1512058564366-18510be2db19'],
  'salmon-potatoes': ['1467003909585-2f8a72700288', '1519708227418-c8fd9a32b7a2', '1485921325833-c519f76c4927'],
  'taco-friday': ['1565299585323-38d6b0865b47', '1551504734-5ee1c4a1479b', '1599974579688-8dbdd335c77f'],
  'bean-chili': ['1455619452474-d2be8b1e70cd', '1547592180-85f173990554', '1604908176997-125f25cc6f3d'],
  'fish-cakes': ['1580476262798-bddd9f4b7369', '1559847844-5315695dadae', '1534939561126-855b8675edd7'],
};

await mkdir('public/img', { recursive: true });
let ok = 0;
for (const [name, ids] of Object.entries(PHOTOS)) {
  const out = `public/img/${name}.jpg`;
  try {
    await access(out);
    ok++;
    console.log(`[images] ${name}: already present`);
    continue;
  } catch {}
  let saved = false;
  for (const id of ids) {
    try {
      const res = await fetch(U(id), { signal: AbortSignal.timeout(15000) });
      const type = res.headers.get('content-type') || '';
      if (!res.ok || !type.startsWith('image/')) {
        console.log(`[images] ${name}: ${id} -> HTTP ${res.status} ${type}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 8000) continue;
      await writeFile(out, buf);
      console.log(`[images] ${name}: saved ${id} (${Math.round(buf.length / 1024)} kB)`);
      saved = true;
      ok++;
      break;
    } catch (e) {
      console.log(`[images] ${name}: ${id} -> ${e.message}`);
    }
  }
  if (!saved) console.log(`[images] ${name}: no photo, placeholder will be used`);
}
console.log(`[images] ${ok}/${Object.keys(PHOTOS).length} meal photos ready`);

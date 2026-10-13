import {readFileSync,existsSync,statSync} from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import sharp from 'sharp';
const code=ts.transpileModule(readFileSync('lib/catalog.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {catalog,photoAssets,localizeImage}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
assert.equal(Object.keys(photoAssets).length,20);let total=0;
for(const [source,url] of Object.entries(photoAssets)){const file='public'+url;assert(existsSync(file),url);const m=await sharp(file).metadata();assert.equal(m.format,'webp');assert(m.width>=600&&m.height>=600,url);assert(Math.max(m.width,m.height)<=1600,url);total+=statSync(file).size;assert.equal(localizeImage('https://images.unsplash.com/'+source+'?w=800'),url)}
assert(catalog.every(p=>p.image.startsWith('/images/ai/')));
const ui=readFileSync('app/store.tsx','utf8');const used=[...ui.matchAll(/photo\('(photo-[^']+)'/g)].map(m=>m[1]);assert(used.every(id=>photoAssets[id]));assert(!readFileSync('app/globals.css','utf8').includes('images.unsplash.com'));
console.log(`PASS: 20 optimized WebP assets, all catalogue and editorial references, legacy URL resolution, and login background. Total ${(total/1024/1024).toFixed(2)} MB.`);

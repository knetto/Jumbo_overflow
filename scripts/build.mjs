import { readFile,writeFile,mkdir,readdir } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const assets={};
async function collect(dir,prefix=''){for(const item of await readdir(dir,{withFileTypes:true})){const rel=prefix+'/'+item.name;const full=path.join(dir,item.name);if(item.isDirectory())await collect(full,rel);else assets[rel]=[(await readFile(full)).toString('base64'),types[path.extname(item.name)]||'application/octet-stream'];}}
await collect(path.join(root,'public'));
const seed=(await readFile('public/data.js','utf8')).replace(/^export /gm,'');
const api=(await readFile('worker/api.js','utf8')).replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'');
const worker=(await readFile('worker/index.js','utf8')).replace(/^import .*;\r?\n/gm,'');
const output=`const ASSETS=${JSON.stringify(assets)};\n${seed}\n${api}\n${worker}`;
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/server/index.js',output);
await writeFile('dist/.openai/hosting.json',await readFile('.openai/hosting.json'));
console.log(`Built self-contained Worker: ${Object.keys(assets).length} assets, ${Buffer.byteLength(output)} bytes.`);

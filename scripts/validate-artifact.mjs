import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createLocalDb} from './local-db.mjs';
const source=await readFile('dist/server/index.js','utf8');
const built=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
assert.equal(typeof built.default.fetch,'function');
const db=createLocalDb();
try{
  const env={DB:db};
  for(const url of ['/','/app.js','/data.js','/ui.js','/styles.css','/assets/jumbo-logo.svg','/assets/JumboTheSans.woff2']){
    const response=await built.default.fetch(new Request('https://test.local'+url),env);
    assert.equal(response.status,200,url);
    assert.ok((await response.arrayBuffer()).byteLength>100,url);
  }
  const response=await built.default.fetch(new Request('https://test.local/api/state',{headers:{'oai-authenticated-user-id':'artifact-check'}}),env);
  assert.equal(response.status,200);
  assert.equal((await response.json()).state.posts.length,24);
  const manifest=JSON.parse(await readFile('dist/.openai/hosting.json','utf8'));
  assert.equal(manifest.d1,'DB');assert.equal(manifest.static,undefined);
  console.log('Artifact verified: embedded assets, shared API, D1 schema and valid ESM.');
}finally{db.close();}

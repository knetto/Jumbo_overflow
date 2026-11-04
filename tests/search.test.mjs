import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchKnowledge, normalize } from '../public/search-engine.js';
import { searchResults } from '../public/search-view.js';
import { createSeed, branches, categories } from '../public/data.js';

const metadata={branches,categories};
const search=(query,state=createSeed())=>searchKnowledge(state,query,metadata).results;

test('Shop-floor sentences rank relevant advice above incidental words',()=>{
  const cases=[
    ['Mijn nieuwe collega weet niet waar te beginnen',['p4','t2']],
    ['Hoe kan ik nieuwe medewerkers sneller inwerken',['p4','t2']],
    ['Er zijn te weinig mensen voor de avondploeg',['p3']],
    ['Producten gaan over datum',['p2','t4']],
    ['Mijn ploeg blijft kletsen en de vracht komt niet af',['p1']],
    ['Hoe begeleid ik een stille nieuwe medewerker',['p13']],
    ['Hoe werkt de zelfscankassa?',['p21']],
    ['Welke scanners hebben een storing',['t9','p14']],
    ['Ik zoek een template voor de overdracht',['t1']],
  ];
  for(const [query,expected] of cases){const results=search(query);assert.ok(expected.includes(results[0]?.item.id),`${query}: ${results.map(r=>r.item.id).slice(0,4)}`);}
});

test('Handles swapped letters, misspellings, accents, case and inflections',()=>{
  assert.ok(['p8','t1'].includes(search('OVERDARCHT')[0]?.item.id));
  assert.ok(['p8','t1'].includes(search('overdragt')[0]?.item.id));
  assert.equal(search('ziekmeldng')[0]?.item.id,'p3');
  assert.ok(search('inwerkken').some(r=>r.item.id==='p4'));
  assert.equal(normalize('  ÉÉN—A4! '),'een a4');
  assert.ok(search('scanners').some(r=>r.item.id==='p14'));
});

test('Finds advice in answers and full template contents, including fresh edits',()=>{
  const state=createSeed();
  state.posts[0].answers.push({id:'test-answer',author:'Test Collega',body:'Gebruik het retourenkompas voor alle emballagevragen.',accepted:true});
  let result=search('retourenkompas',state)[0];
  assert.equal(result.item.id,'p1');assert.equal(result.source,'Antwoord van Test Collega');
  assert.match(result.snippet,/retourenkompas/);
  state.templates[0].content+='\nDe koelingssensor registreert iedere controle.';
  result=search('koelingssensor',state)[0];
  assert.equal(result.item.id,'t1');assert.equal(result.source,'In het template');
  state.templates[0].content='Een geheel gewijzigde inhoud.';
  assert.equal(search('koelingssensor',state).length,0);
});

test('Branch names and colleagues are searchable; votes cannot swamp relevance',()=>{
  assert.ok(search('Den Bosch').every(r=>r.item.branch==='denbosch'));
  assert.ok(search('Dordrecht').some(r=>r.item.id==='p1'));
  assert.ok(search('Noor Peters').some(r=>r.item.author==='Noor Peters'));
  const state=createSeed();state.posts.find(p=>p.id==='p11').votes=1e12;
  assert.equal(search('ziekmelding',state)[0].item.id,'p3');
});

test('Content type words find the matching collection',()=>{
  assert.equal(search('templates').filter(r=>r.kind==='template').length,12);
  assert.equal(search('praktijkhacks').filter(r=>r.kind==='hack').length,12);
  assert.ok(search('template inwerken').slice(0,3).some(r=>r.kind==='template'));
});

test('Empty, stopword-only and unrelated queries do not invent matches',()=>{
  for(const q of ['','   ','hoe kan ik dit doen','xyzqv nonexisting','aardbeientaart bakken','Wat zijn de openingstijden?'])assert.equal(search(q).length,0,q);
  assert.ok(search('Producten gaan over datum').every(r=>['p2','t4'].includes(r.item.id)));
});

test('Search rendering escapes query, titles, answers and template content',()=>{
  const state=createSeed();
  state.posts[0].title='<img src=x onerror=alert(1)> retourenkompas';
  state.posts[0].body='<script>alert(1)</script> retourenkompas';
  const html=searchResults(state,'retourenkompas <img src=x>',{type:'all',category:'all',branch:'all'},metadata);
  assert.doesNotMatch(html,/<img|<script|onerror="/);
  assert.match(html,/&lt;img/);assert.match(html,/<mark>retourenkompas<\/mark>/);
});

test('Anonymous attribution is excluded from colleague search, branch filters and answer labels',()=>{
  const state=createSeed();
  const item={...state.posts[0],id:'private-search',anonymous:true,author:'Verborgennaam',branch:'breda',title:'Uniekwerkidee voor de werkvloer',body:'Een andere werkwijze voor ons team.',tags:[],answers:[{id:'private-answer',anonymous:true,author:'Geheimenaam',body:'De tussenstap testwerkmethode helpt bij deze werkwijze.',votes:0}]};
  state.posts=[item];state.templates=[];
  assert.equal(search('Verborgennaam',state).length,0);
  assert.equal(search('Breda',state).length,0);
  const found=search('Uniekwerkidee',state)[0];
  assert.equal(found.item.author,'Anonieme collega');assert.equal(found.item.branch,null);
  assert.equal(search('testwerkmethode tussenstap',state)[0].source,'Antwoord van Anonieme collega');
  const filters={type:'all',category:'all',branch:'all'};
  const html=searchResults(state,'testwerkmethode tussenstap',filters,metadata);
  assert.match(html,/Anonieme collega/);assert.doesNotMatch(html,/Verborgennaam|Geheimenaam|Jumbo null/);
  assert.doesNotMatch(html.slice(html.indexOf('<ol class="knowledge-results">')),/Jumbo Breda/);
  const filtered=searchResults(state,'Uniekwerkidee',{...filters,branch:'breda'},metadata);
  assert.doesNotMatch(filtered,/data-result="private-search"/);
});

import { searchKnowledge, normalize } from './search-engine.js';
import { icon, esc } from './ui.js';

export const searchExamples = [
  ['users','Mijn nieuwe collega weet niet waar te beginnen'],
  ['calendar','Er zijn te weinig mensen voor de avondploeg'],
  ['box','Producten gaan over datum'],
  ['messages','Ik zoek een korte overdracht'],
];

function highlight(text, terms) {
  const matches=new Set(terms);
  return String(text).split(/([\p{L}\p{N}]+)/gu).map(part=>matches.has(normalize(part))?`<mark>${esc(part)}</mark>`:esc(part)).join('');
}

export function searchForm(query) {
  return `<section class="search-intro ${query.trim()?'has-query':''}" aria-labelledby="search-title"><div class="container search-intro-inner">
    <div class="search-intro-copy">
      <p class="script hero-hello">Hallo!</p>
      <h1 id="search-title">Waar loop jij <strong class="mark">tegenaan</strong>?</h1>
      <p class="hero-lead">Een paar woorden of je hele verhaal. Vind de aanpak die je verder helpt.</p>
    </div>
    <form id="page-search-form" role="search">
      <label for="page-search">Beschrijf je vraag of probleem</label>
      <div class="knowledge-search-field">
        <input id="page-search" type="search" maxlength="400" autocomplete="off" placeholder="Bijvoorbeeld: mijn vulploeg is steeds afgeleid" value="${esc(query)}" aria-describedby="search-help">
        <button class="button primary" type="submit">${icon('search','sm')}Zoeken</button>
      </div>
      <p id="search-help">Doorzoekt vragen, praktijkhacks, antwoorden én de inhoud van templates.</p>
    </form>
    <div class="search-examples"><span>Probeer eens:</span>${searchExamples.map(([ico,q])=>`<button class="filter-chip" data-action="search-example" data-query="${esc(q)}">${icon(ico,'sm')}${esc(q)}</button>`).join('')}</div>
  </div></section>`;
}

export function searchResults(state, query, filters, metadata) {
  const {categories,branches}=metadata;
  const {results,concepts,tokens}=searchKnowledge(state,query,metadata);
  const matches=results.filter(r=>(filters.type==='all'||r.kind===filters.type)&&(filters.category==='all'||r.item.category===filters.category)&&(filters.branch==='all'||r.item.branch===filters.branch));
  const hasQuery=Boolean(query.trim());
  const filtered=filters.type!=='all'||filters.category!=='all'||filters.branch!=='all';
  const types=[['all','Alles'],['question','Vragen'],['hack','Praktijkhacks'],['template','Templates']];
  return `<div class="search-results-heading"><div><h2>${hasQuery?'Dit vonden we voor jou':'Alle kennis begint met een vraag.'}</h2><p class="search-status" role="status" aria-live="polite" aria-atomic="true">${hasQuery?`${matches.length} ${matches.length===1?'resultaat':'resultaten'} voor “${esc(query.trim())}”`:'Zoek op een onderwerp, collega of filiaal. Je kunt ook gewoon je situatie beschrijven.'}</p></div>${hasQuery&&matches.length?'<span class="search-order">Op relevantie</span>':''}</div>
    ${hasQuery?`<div class="search-controls"><div class="filter-row" role="group" aria-label="Filter zoekresultaten op type">${types.map(([value,label])=>`<button class="filter-chip ${filters.type===value?'active':''}" data-action="search-type" data-id="${value}" aria-pressed="${filters.type===value}">${label}<span class="chip-count">${results.filter(r=>(value==='all'||r.kind===value)&&(filters.category==='all'||r.item.category===filters.category)&&(filters.branch==='all'||r.item.branch===filters.branch)).length}</span></button>`).join('')}</div>
      <div class="search-refine"><div><label for="search-category">Onderwerp</label><select id="search-category"><option value="all">Alle onderwerpen</option>${categories.map(c=>`<option value="${c.id}" ${filters.category===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><div><label for="search-branch">Filiaal</label><select id="search-branch"><option value="all">Alle filialen</option>${branches.map(b=>`<option value="${b.id}" ${filters.branch===b.id?'selected':''}>Jumbo ${esc(b.city)}</option>`).join('')}</select></div>${filtered?'<button class="button text" data-action="search-reset">Filters wissen</button>':''}</div>
    </div>
    ${concepts.length?`<p class="search-understood">${icon('lightbulb','sm')}Ook gezocht op ${concepts.map(c=>`<span>${esc(c)}</span>`).join('')}</p>`:''}
    ${matches.length?`<ol class="knowledge-results">${matches.map((r,index)=>resultCard(r,index,metadata)).join('')}</ol>`:`<div class="search-empty"><span class="sticker" aria-hidden="true">${results.length?'Hmm…':'Oh oh!'}</span><h3>${results.length?'Geen resultaten met deze filters.':tokens.length||concepts.length?'Nog geen passende kennis gevonden.':'Geef je zoekopdracht iets meer inhoud.'}</h3><p>${results.length?'Kies een ander onderwerp of filiaal, of wis je filters.':tokens.length||concepts.length?'Probeer de belangrijkste woorden, zoals ‘inwerken’, ‘ziekmelding’ of ‘overdracht’. Of leg je vraag voor aan collega’s.':'Noem bijvoorbeeld de taak, het probleem of de situatie waar je mee zit.'}</p><button class="button ${results.length?'secondary':'primary'}" data-action="${results.length?'search-reset':'new'}">${results.length?'Wis alle filters':'Stel je vraag aan collega’s'} ${icon('chevron','sm')}</button></div>`}`:
    `<div class="search-start-topics" aria-label="Zoek op onderwerp">${categories.map(c=>`<button data-action="search-example" data-query="${esc(c.name)}"><span class="topic-symbol tint-${esc(c.color)}">${icon(c.icon)}</span><strong>${esc(c.name)}</strong>${icon('chevron','sm')}</button>`).join('')}</div>`}`;
}

function resultCard(result,index,{branches,categories}) {
  const {item,kind,terms,snippet,source}=result;
  const b=branches.find(b=>b.id===item.branch);
  const c=categories.find(c=>c.id===item.category);
  const template=kind==='template';
  const label=template?'Template':kind==='hack'?'Praktijkhack':'Vraag';
  const ico=template?'files':kind==='hack'?'lightbulb':'messages';
  const title=highlight(item.title,terms);
  return `<li class="knowledge-result ${index===0?'first-result':''}" data-result="${esc(item.id)}">
    <article class="${template?'template-card':'post-card'} search-result-card">
      <div class="search-result-icon ${template?'is-template':''}" aria-hidden="true">${icon(ico)}</div>
      <div class="search-result-body"><div class="search-result-meta"><span>${label}${template?` · ${esc(item.format)}`:''}</span><span class="tag ${esc(c?.color||'')}">${esc(c?.name||'Kennisplein')}</span>${index===0?'<span class="search-best">Beste match</span>':''}</div>
      <h3>${template?`<button data-action="template" data-id="${esc(item.id)}">${title}</button>`:`<a class="post-title" href="#vraag/${encodeURIComponent(item.id)}">${title}</a>`}</h3>
      ${source.startsWith('Antwoord')||source==='In het template'?`<div class="search-source">${icon(source.startsWith('Antwoord')?'messages':'files','sm')}${esc(source)}</div>`:''}
      <p class="search-snippet">${highlight(snippet,terms)}</p>
      <div class="search-result-footer"><span>Jumbo ${esc(b?.city||item.branch)} <span aria-hidden="true">·</span> ${esc(item.author)}</span><span>${template?`${item.downloads} downloads`:`${item.answers?.length||0} reacties`}</span>${template?`<button data-action="template" data-id="${esc(item.id)}">Bekijk template ${icon('chevron','sm')}</button>`:`<a href="#vraag/${encodeURIComponent(item.id)}">Bekijk aanpak ${icon('chevron','sm')}</a>`}</div></div>
    </article></li>`;
}

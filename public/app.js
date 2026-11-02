import { createViews } from './views.js';
import { initInteractions, enhanceSelects, closeDropdown, animateDialog, animateVote } from './interactions.js';
import { categories, branches, createSeed } from './data.js';
import { icon, esc, avatar } from './ui.js';
import { searchForm, searchResults } from './search-view.js';

const STORAGE_KEY = 'jumbooverflow.v1';
let storageAvailable = true;
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.version === 1 && Array.isArray(saved.posts) && Array.isArray(saved.templates) && saved.profile && ['votes', 'saved', 'savedTemplates', 'followedBranches', 'followedCategories', 'templateDownloads'].every(k => Array.isArray(saved[k]))) return saved;
  } catch { /* A fresh demo is available when storage is unavailable or damaged. */ }
  return createSeed();
}
let state = loadState();
let backendMode = 'local';
let syncQueue = Promise.resolve();
let pendingWrites = 0;
const ui = { type: 'all', category: 'all', sort: 'popular', limit: 6, query: '', branch: 'all', templateCategory: 'all', mobileOpen: false };
const searchFilters = { type: 'all', category: 'all', branch: 'all' };
const answerDrafts = new Map();
function captureAnswerDraft() { const field = $('#answer-body'); const form = $('#answer-form'); if (field && form) answerDrafts.set(form.dataset.id, field.value); }
let modalReturnFocus = null;
let activeTemplate = null;
let lastVotedKey = null;
let lastVotedAt = 0;
let toastTimer;
let searchTimer;
let answerSort = 'votes';
const $ = (sel, root = document) => root.querySelector(sel);
const branch = id => branches.find(b => b.id === id) || branches[0];
const category = id => categories.find(c => c.id === id) || categories[0];
const route = () => { try { return decodeURIComponent(location.hash.slice(1) || 'kennisplein'); } catch { return 'zoeken'; } };
const page = () => route().split('/')[0];
const id = prefix => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const countText = (n, s, p) => `${n} ${n === 1 ? s : p}`;
const typeLabel = type => ({ question: 'Vraag', hack: 'Praktijkhack', template: 'Template' }[type] || 'Vraag');
const timeAgo = timestamp => { const h = Math.max(0, Math.floor((Date.now() - timestamp) / 3600000)); return h < 1 ? 'zojuist' : h < 24 ? `${h} uur geleden` : Math.floor(h / 24) === 1 ? 'gisteren' : `${Math.floor(h / 24)} dagen geleden`; };
const categoryTag = key => { const c = category(key); return `<span class="tag ${c.color}">${esc(c.name)}</span>`; };
const typeTag = type => `<span class="tag type">${icon(type === 'hack' ? 'lightbulb' : type === 'template' ? 'files' : 'messages', 'sm')}${typeLabel(type)}</span>`;
function persist(action = null, payload = null) {
  if (backendMode === 'shared') {
    if (action) queueSync(action, payload);
    return true;
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; }
  catch { storageAvailable = false; toast('Je browser kan dit niet opslaan. Download je template om het te bewaren.'); return false; }
}
function preferences() { return { profile: state.profile, saved: [...state.saved], savedTemplates: [...state.savedTemplates], followedBranches: [...state.followedBranches], followedCategories: [...state.followedCategories] }; }
function queueSync(action, payload) {
  pendingWrites++;
  const body = JSON.stringify({ action, payload });
  syncQueue = syncQueue.then(async () => {
    const response = await fetch('/api/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal: AbortSignal.timeout(15000) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Opslaan is niet gelukt.');
    state = data.state;
    renderMain();
    if (lastVotedKey && performance.now() - lastVotedAt < 450) animateVote(lastVotedKey, false);
    const savedCount = $('a[href="#bewaard"] .nav-count'); if (savedCount) savedCount.textContent = state.saved.length + state.savedTemplates.length;
    const templateCount = $('a[href="#templates"] .nav-count'); if (templateCount) templateCount.textContent = state.templates.length;
    if (activeTemplate && $('.template-preview')) openTemplate(activeTemplate);
  }).catch(async error => {
    try { const response = await fetch('/api/state'); if (response.ok) { state = (await response.json()).state; renderMain(); } } catch { }
    toast(`Niet opgeslagen: ${error.message}`);
  }).finally(() => pendingWrites--);
}
async function initialize() {
  try {
    const response = await fetch('/api/state', { signal: AbortSignal.timeout(5000) });
    if (response.ok) { const data = await response.json(); if (data.state?.storage === 'shared') { state = data.state; backendMode = 'shared'; return; } }
  } catch { }
  if (state.storage === 'shared') state = createSeed();
  persist();
}
function toast(message) {
  const el = $('#toast'); el.innerHTML = `${icon('checkCircle', 'sm')}<span>${esc(message)}</span>`; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3600);
}
function navigate(target) { if (route() === target) { render(); window.scrollTo({ top: 0 }); } else location.hash = target; }
function resetFilters() { ui.type = 'all'; ui.category = 'all'; ui.branch = 'all'; ui.limit = 6; }
function navLink(target, label, ico, count = '') {
  const active = page() === target || (target === 'kennisplein' && ['vraag', 'zoeken'].includes(page()));
  return `<a class="nav-link ${active ? 'active' : ''}" href="#${target}" ${active ? 'aria-current="page"' : ''}>${icon(ico)}<span>${label}</span>${count !== '' ? `<span class="nav-count">${count}</span>` : ''}</a>`;
}
const views = createViews({ get state() { return state; }, get backendMode() { return backendMode; }, ui, icon, esc, avatar, branch, category, categories, branches, navLink, categoryTag, typeTag, voteButton, timeAgo, countText, breadcrumb, branchScore });
function shell() { $('#app').innerHTML = views.shell(); updateHeaderShadow(); }
function updateHeaderShadow() { $('.topbar')?.classList.toggle('is-stuck', window.scrollY > 8); }
function breadcrumb(label, trail = []) { return `<nav class="breadcrumb" aria-label="Kruimelpad"><a href="#kennisplein">Jumboverflow</a>${trail.map(([href, text]) => `${icon('chevron', 'sm')}<a href="${href}">${esc(text)}</a>`).join('')}${icon('chevron', 'sm')}<span aria-current="page">${esc(label)}</span></nav>`; }
function hero(...args) { return views.hero(...args); }
function voteButton(key, votes) { const voted = state.votes.includes(key); return `<div class="vote-column"><button class="vote-button ${voted ? 'voted' : ''}" data-action="vote" data-id="${esc(key)}" aria-label="Handig, ${votes} ${votes === 1 ? 'collega vindt' : 'collega\'s vinden'} dit handig${voted ? ' (jij ook)' : ''}" aria-pressed="${voted}">${icon('thumbsUp', 'sm')}<span class="vote-label">Handig</span><strong>${votes}</strong></button></div>`; }
function postCard(...args) { return views.postCard(...args); }
function feedPosts() {
  let posts = [...state.posts];
  if (page() === 'bewaard') posts = posts.filter(p => state.saved.includes(p.id));
  if (page() === 'mijn-bijdragen') posts = posts.filter(p => p.own);
  if (page() === 'volgend') posts = posts.filter(p => state.followedBranches.includes(p.branch) || state.followedCategories.includes(p.category));
  if (ui.type !== 'all') posts = posts.filter(p => p.type === ui.type);
  if (ui.category !== 'all') posts = posts.filter(p => p.category === ui.category);
  if (ui.branch !== 'all') posts = posts.filter(p => p.branch === ui.branch);
  if (ui.sort === 'unanswered') posts = posts.filter(p => p.type === 'question' && !p.answers.length);
  return posts.sort(ui.sort === 'new' ? (a, b) => b.createdAt - a.createdAt : (a, b) => b.votes - a.votes);
}
function filterChips() { return `<div class="filter-row" role="group" aria-label="Filter op type">${[['all', 'Alles', 'grid'], ['question', 'Vragen', 'messages'], ['hack', 'Praktijkhacks', 'lightbulb'], ['template', 'Templates', 'files']].map(([value, label, ico]) => `<button class="filter-chip ${ui.type === value ? 'active' : ''}" data-action="type" data-id="${value}" aria-pressed="${ui.type === value}">${icon(ico, 'sm')}${label}</button>`).join('')}</div>`; }
function sortRow() { return `<div class="sort-row"><div class="feed-sort-label"><span aria-hidden="true">Sorteer op</span><select class="sort-select" id="feed-sort" aria-label="Sorteer bijdragen" data-menu-label="Sorteer bijdragen">${[['popular', 'Populair', 'flame'], ['new', 'Nieuw', 'clock'], ['unanswered', 'Onbeantwoord', 'help']].map(([value, label, ico]) => `<option value="${value}" data-icon="${ico}" ${ui.sort === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><select class="sort-select" id="category-select" aria-label="Filter op onderwerp" data-icon="grid"><option value="all">Alle onderwerpen</option>${categories.map(c => `<option value="${c.id}" data-icon="${c.icon}" ${ui.category === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>`; }
function empty(title = 'Hier is het nog even rustig.', text = 'Deel als eerste een vraag of een slimme oplossing. Je collega’s denken graag met je mee.', action = 'new', label = 'Deel je kennis', sticker = 'Hé!') { return `<div class="empty-state"><span class="sticker" aria-hidden="true">${sticker}</span><h2>${title}</h2><p>${text}</p><button class="button primary" data-action="${action}">${icon(action === 'new' || action === 'new-template' ? 'plus' : 'arrow', 'sm')}${label}</button></div>`; }
function rightColumn(...args) { return views.rightColumn(...args); }
function branchScore(branchId) { return state.posts.filter(p => p.branch === branchId).reduce((n, p) => n + p.votes, 0); }
function feedPage() {
  const pg = page(); const labels = { kennisplein: 'Kennisplein', bewaard: 'Bewaard', 'mijn-bijdragen': 'Mijn bijdragen', volgend: 'Mijn netwerk' }; const title = labels[pg] || 'Kennisplein';
  let posts = feedPosts(); const templates = state.templates.filter(t => pg === 'bewaard' ? state.savedTemplates.includes(t.id) : pg === 'mijn-bijdragen' ? t.own : false);
  const intro = pg === 'kennisplein' ? hero() : `${breadcrumb(title)}<div class="page-heading"><div><h1>${pg === 'bewaard' ? 'Bewaard voor <span class="mark">later</span>' : pg === 'volgend' ? 'Mijn <span class="mark">netwerk</span>' : 'Mijn <span class="mark">bijdragen</span>'}</h1><p>${pg === 'bewaard' ? 'Handige kennis en templates. Op één plek, voor later.' : pg === 'volgend' ? 'De nieuwste ideeën van de filialen die jij volgt.' : 'Jouw vragen, praktijkhacks en aangepaste templates.'}</p></div>${pg === 'volgend' ? '<a class="button secondary" href="#filialen">' + icon('users', 'sm') + 'Filialen ontdekken</a>' : ''}</div>`;
  let context = ui.category !== 'all' ? `<div class="result-context"><span>${icon('info', 'sm')}Onderwerp: <strong>${esc(category(ui.category).name)}</strong></span><button data-action="clear-category" aria-label="Onderwerpfilter verwijderen">${icon('close', 'sm')}</button></div>` : '';
  if (ui.branch !== 'all') context += `<div class="result-context"><span>${icon('store', 'sm')}Bijdragen van <strong>Jumbo ${esc(branch(ui.branch).city)}</strong></span><button data-action="clear-branch" aria-label="Filiaalfilter verwijderen">${icon('close', 'sm')}</button></div>`;
  const showTemplates = ui.type === 'template';
  const sortHint = { popular: 'de handigste eerst', new: 'de nieuwste eerst', unanswered: 'vragen die nog op een reactie wachten' }[ui.sort];
  const body = showTemplates ? `<div class="template-grid two">${state.templates.filter(t => (ui.category === 'all' || t.category === ui.category) && (ui.branch === 'all' || t.branch === ui.branch) && (pg !== 'bewaard' || state.savedTemplates.includes(t.id)) && (pg !== 'mijn-bijdragen' || t.own) && (pg !== 'volgend' || state.followedBranches.includes(t.branch))).map(templateCard).join('') || empty('Nog geen templates hier.', 'Bekijk alle templates of deel er zelf één.', 'open-library', 'Naar de bibliotheek')}</div>` : posts.length ? `<div class="post-list">${posts.slice(0, ui.limit).map(postCard).join('')}</div>${posts.length > ui.limit ? `<button class="button secondary load-more" data-action="load-more">Meer bijdragen ontdekken ${icon('down', 'sm')}</button>` : ''}` : empty();
  return `${intro}<div class="content-grid ${pg !== 'kennisplein' ? 'is-subpage' : ''}"><section id="community-feed" aria-labelledby="feed-title"><div class="section-heading"><div><h2 id="feed-title">${pg === 'kennisplein' ? 'Voor jou op de vloer' : pg === 'volgend' ? 'Van je collega-filialen' : pg === 'bewaard' ? 'Bewaard voor later' : 'Door jou gedeeld'}</h2><p class="section-sub">${countText(posts.length, 'bijdrage', 'bijdragen')} · ${sortHint}</p></div><button class="button primary" data-action="new">${icon('plus', 'sm')}Stel je vraag</button></div>${filterChips()}${context}${sortRow()}${body}${templates.length && !showTemplates ? `<div class="section-heading section-heading-spaced"><div><h2>Jouw templates</h2></div></div><div class="template-grid two">${templates.map(templateCard).join('')}</div>` : ''}</section>${rightColumn()}</div>`;
}
function templateCover(...args) { return views.templateCover(...args); }
function templateCard(t) { const b = branch(t.branch); return `<article class="template-card">${templateCover(t)}<div class="template-body"><div class="post-tags">${categoryTag(t.category)}${typeTag('template')}</div><h3><button class="template-title" data-action="template" data-id="${t.id}">${esc(t.title)}</button></h3><p>${esc(t.description)}</p><div class="template-author">${avatar(t.author, 'tiny', b.color)}<span>Jumbo ${esc(b.city)} · ${esc(t.author)}</span></div><div class="template-actions"><span class="template-metric" title="Downloads">${icon('download', 'sm')}${t.downloads}<span class="visually-hidden"> downloads</span></span><span class="template-metric" title="Aangepaste versies">${icon('fork', 'sm')}${t.forks}<span class="visually-hidden"> aangepaste versies</span></span><button class="button secondary small" data-action="template" data-id="${t.id}">Bekijk template ${icon('chevron', 'sm')}</button></div></div></article>`; }
function libraryPage() { let templates = [...state.templates]; if (ui.templateCategory !== 'all') templates = templates.filter(t => t.category === ui.templateCategory); return `${breadcrumb('Templates')}<div class="page-heading"><div><h1>Waarom zelf het wiel <span class="mark">uitvinden</span>?</h1><p>Checklists, planningen en overdrachten die al werken op de vloer. Download ze of maak er jouw eigen versie van.</p></div><button class="button primary" data-action="new-template">${icon('plus', 'sm')}Deel een template</button></div><div class="library-banner side-card"><span class="banner-icon">${icon('fork', 'lg')}</span><div><h2>Gemaakt door collega's. <strong>Klaar voor jouw filiaal.</strong></h2><p>Pas een template aan, voeg je eigen kennis toe en deel hem weer terug.</p></div><button class="button secondary" data-action="fork-help">Hoe werkt aanpassen?</button></div><div class="library-toolbar"><div class="filter-row" role="group" aria-label="Filter templates op onderwerp"><button class="filter-chip ${ui.templateCategory === 'all' ? 'active' : ''}" data-action="template-category" data-id="all" aria-pressed="${ui.templateCategory === 'all'}">Alle templates <span class="chip-count">${state.templates.length}</span></button>${categories.map(c => `<button class="filter-chip ${ui.templateCategory === c.id ? 'active' : ''}" data-action="template-category" data-id="${c.id}" aria-pressed="${ui.templateCategory === c.id}">${icon(c.icon, 'sm')}${esc(c.name)}</button>`).join('')}</div><span class="search-count" role="status">${countText(templates.length, 'template', 'templates')}</span></div><div class="template-grid">${templates.map(templateCard).join('')}</div>${templates.length ? '' : empty('Hier staat nog geen template.', 'Deel de eerste handige checklist voor dit onderwerp.', 'new-template', 'Deel een template')}`; }
function branchesPage(...args) { return views.branchesPage(...args); }
function insightsPage() { const totalVotes = state.posts.reduce((n, p) => n + p.votes + p.answers.reduce((v, a) => v + a.votes, 0), 0); const unanswered = state.posts.filter(p => p.type === 'question' && !p.answers.length); const categoryCounts = categories.map(c => ({ ...c, count: state.posts.filter(p => p.category === c.id).length })).sort((a, b) => b.count - a.count); const max = categoryCounts[0]?.count || 1; const top = state.posts.filter(p => p.type === 'hack').sort((a, b) => b.votes - a.votes).slice(0, 4); const stat = (label, ico, value, note) => `<div class="stat-card"><div class="stat-label"><span class="stat-icon">${icon(ico, 'sm')}</span>${label}</div><strong>${value}</strong><small>${note}</small></div>`; return `${breadcrumb('Praktijkinzichten')}<div class="page-heading"><div><h1>Kleine signalen. <span class="mark">Landelijke</span> lessen.</h1><p>Waar lopen filialen tegenaan? En welke oplossingen helpen echt? Bekijk de thema's, zonder medewerkers of filialen met elkaar te vergelijken.</p></div><button class="button secondary export-button" data-action="export-insights">${icon('download', 'sm')}Exporteer inzichten</button></div><div class="stats-grid">${stat('Gedeelde kennis', 'messages', state.posts.length, 'vragen en praktijkhacks')}${stat('Stemmen uit de praktijk', 'thumbsUp', new Intl.NumberFormat('nl-NL').format(totalVotes), 'op bijdragen en reacties')}${stat('Herbruikbare templates', 'files', state.templates.length, `${state.templates.filter(t => t.parentId).length} aangepaste versies`)}${stat('Nog zonder reactie', 'help', unanswered.length, "vragen waar collega's op wachten")}</div><div class="insights-grid"><section class="chart-card"><h2>Dit leeft op de winkelvloer</h2><p>Aantal bijdragen per onderwerp · alle demodata</p><div class="chart-rows">${categoryCounts.map(c => `<div class="chart-row"><span>${esc(c.name)}</span><div class="chart-track"><div class="chart-bar" style="width:${(c.count / max) * 100}%" role="img" aria-label="${esc(c.name)}: ${c.count} bijdragen"></div></div><strong>${c.count}</strong></div>`).join('')}</div></section><section class="chart-card"><h2>Dit werkt volgens collega's</h2><p>Praktijkhacks met de meeste upvotes</p><ol class="insight-list">${top.map((p, i) => `<li class="insight-item"><span class="insight-number">${i + 1}</span><div><h3><a href="#vraag/${p.id}">${esc(p.title)}</a></h3><p>${esc(category(p.category).name)} · ${p.votes} upvotes</p></div></li>`).join('')}</ol></section></div><div class="privacy-banner notification positive">${icon('shield')}<p><strong>Inzicht in thema's, zonder individuele profielen.</strong><br>Deze pagina toont alleen geaggregeerde gegevens. Namen, reacties en filiaalgegevens staan niet in de export. Alle getoonde community-inhoud is fictieve demodata; dit is geen beoordeling van echte medewerkers of filialen.</p></div>`; }
function detailPage() {
  const post = state.posts.find(p => p.id === route().split('/')[1]);
  if (!post) return breadcrumb('Bijdrage', [['#kennisplein', 'Kennisplein']]) + empty('Deze bijdrage bestaat niet.', 'We hebben goed gezocht, maar deze link klopt niet of de bijdrage is niet meer beschikbaar.', 'discover', 'Naar het kennisplein', 'Oh oh!');
  const b = branch(post.branch);
  const followed = state.followedBranches.includes(b.id);
  const answers = [...post.answers].sort(answerSort === 'new' ? (a, b) => b.createdAt - a.createdAt : (a, b) => Number(b.accepted) - Number(a.accepted) || b.votes - a.votes);
  const related = state.posts.filter(p => p.id !== post.id && p.category === post.category).slice(0, 3);
  const answerCard = a => { const ab = branch(a.branch); return `<article class="answer-card ${a.accepted ? 'accepted' : ''}"><div class="answer-content">${a.accepted ? `<div class="accept-label">${icon('checkCircle', 'sm')}Dit antwoord hielp de vraagsteller</div>` : ''}<div class="post-meta">${avatar(a.author, 'tiny', ab.color)}<span class="author">${esc(a.author)}</span><span>Jumbo ${esc(ab.city)}</span><span>${timeAgo(a.createdAt)}</span></div><div class="prose">${esc(a.body)}</div><div class="answer-footer">${voteButton(a.id, a.votes)}${post.own ? `<button class="button secondary small accept-button ${a.accepted ? 'is-accepted' : ''}" data-action="accept-answer" data-id="${a.id}" data-post="${post.id}">${icon('check', 'sm')}${a.accepted ? 'Geaccepteerd' : 'Dit hielp mij'}</button>` : ''}</div></div></article>`; };
  return `${breadcrumb(typeLabel(post.type), [['#kennisplein', 'Kennisplein']])}<button class="back-button link-chevron" data-action="discover">${icon('arrowLeft', 'sm')}Terug naar het kennisplein</button>
  <div class="detail-layout"><section>
    <article class="detail-card"><div class="detail-content">
      <div class="post-tags">${categoryTag(post.category)}${typeTag(post.type)}${post.solved ? '<span class="tag solved">' + icon('check', 'sm') + (post.type === 'hack' ? 'Werkt in de praktijk' : 'Opgelost') + '</span>' : ''}</div>
      <h1>${esc(post.title)}</h1>
      <div class="post-meta">${avatar(post.author, 'tiny', b.color)}<span class="author">${esc(post.author)}</span><span>Jumbo ${esc(b.city)}</span><span>${timeAgo(post.createdAt)}</span></div>
      <div class="prose prose-intro">${esc(post.body)}</div>
      ${post.tags.length ? `<div class="detail-tag-row" aria-label="Tags">${post.tags.map(t => `<span class="tag">#${esc(t)}</span>`).join('')}</div>` : ''}
      <div class="detail-action-row">${voteButton(post.id, post.votes)}<button class="action-link" data-action="save-post" data-id="${post.id}" aria-pressed="${state.saved.includes(post.id)}">${icon('bookmark', 'sm')}${state.saved.includes(post.id) ? 'Bewaard' : 'Bewaar bijdrage'}</button><button class="action-link" data-action="share" data-id="${post.id}">${icon('share', 'sm')}Deel bijdrage</button>${post.own && post.type === 'question' ? `<button class="action-link" data-action="solve" data-id="${post.id}">${icon('checkCircle', 'sm')}${post.solved ? 'Heropen vraag' : 'Markeer als opgelost'}</button>` : ''}</div>
    </div></article>
    <div class="answers-heading"><h2>${countText(answers.length, 'reactie uit de praktijk', 'reacties uit de praktijk')}</h2><select id="answer-sort" class="sort-select" aria-label="Sorteer reacties"><option value="votes" ${answerSort === 'votes' ? 'selected' : ''}>Meest behulpzaam</option><option value="new" ${answerSort === 'new' ? 'selected' : ''}>Nieuwste eerst</option></select></div>
    ${answers.length ? answers.map(answerCard).join('') : `<div class="notification note answers-empty">${icon('lightbulb', 'sm')}<p><strong>Nog geen reacties.</strong> Weet jij hoe jullie dit aanpakken? Jouw ervaring kan een collega vandaag al verder helpen.</p></div>`}
    <form class="answer-form side-card" id="answer-form" data-id="${post.id}"><h2>Wat werkt bij jullie?</h2><p>Een klein idee kan voor een ander filiaal een groot verschil maken.</p><label class="field-label" for="answer-body">Jouw reactie</label><textarea id="answer-body" name="body" required minlength="10" maxlength="6000" placeholder="Deel je ervaring of stel een verdiepende vraag…"></textarea><div class="answer-form-footer"><span class="field-hint">Je reageert als ${esc(state.profile.name)} · Jumbo ${esc(branch(state.profile.branch).city)}</span><button class="button primary" type="submit">${icon('messages', 'sm')}Plaats je reactie</button></div></form>
  </section>
  <aside class="detail-aside" aria-label="Meer over deze bijdrage">
    <div class="side-card author-card"><h3>Gedeeld vanuit de praktijk</h3><div class="author-card-person">${avatar(post.author, 'medium', b.color)}<div><strong>${esc(post.author)}</strong><p>Jumbo ${esc(b.city)} · ${esc(b.name)}</p></div></div><button class="button secondary small full ${followed ? 'following' : ''}" data-action="follow" data-id="${b.id}" aria-pressed="${followed}">${icon(followed ? 'check' : 'plus', 'sm')}${followed ? 'Je volgt dit filiaal' : 'Volg dit filiaal'}</button></div>
    <div class="notification note guideline-note"><span class="script">Tip!</span><p><strong>Samen komen we verder.</strong> Deel wat bij jou werkt. Wees duidelijk, blijf vriendelijk en laat persoonlijke gegevens achterwege.</p><button class="link-chevron" data-action="guidelines">Onze 5 afspraken ${icon('chevron', 'sm')}</button></div>
    ${related.length ? `<div class="side-card"><h3>Ook interessant</h3><div class="side-list">${related.map(p => `<a class="side-list-item" href="#vraag/${p.id}"><span class="side-list-icon">${icon(p.type === 'hack' ? 'lightbulb' : 'messages', 'sm')}</span><span class="side-list-text"><strong>${esc(p.title)}</strong><small>${typeLabel(p.type)} · ${countText(p.answers.length, 'reactie', 'reacties')}</small></span>${icon('chevron', 'sm')}</a>`).join('')}</div></div>` : ''}
  </aside></div>`;
}
function searchPage() { return `<div class="search-results-wrap"><section class="search-sections" aria-label="Zoekresultaten">${searchResults(state, ui.query, searchFilters, { categories, branches })}</section></div>`; }

function resetSearchFilters() { Object.assign(searchFilters, { type: 'all', category: 'all', branch: 'all' }); }
function readSearchRoute() {
  if (page() !== 'zoeken') return;
  const query = route().startsWith('zoeken/') ? route().slice(7) : ui.query;
  if (query !== ui.query) resetSearchFilters();
  ui.query = query.slice(0, 400);
}
function updateSearchResults() {
  const target = $('.search-sections'); if (!target) return;
  // Keep the input in place while typing: focus, caret and IME composition survive.
  const focused = document.activeElement;
  const focusAction = focused?.dataset.action;
  const focusId = focused?.dataset.id;
  const selectId = focused?.dataset.selectId;
  closeDropdown();
  target.innerHTML = searchResults(state, ui.query, searchFilters, { categories, branches });
  enhanceSelects(target);
  if (selectId) $(`[data-select-id="${selectId}"]`, target)?.focus();
  else if (focusAction) [...target.querySelectorAll('[data-action]')].find(el => el.dataset.action === focusAction && el.dataset.id === focusId)?.focus();
}
function runSearch(query, { reset = false } = {}) {
  clearTimeout(searchTimer);
  const alreadySearching = page() === 'zoeken';
  ui.query = String(query).slice(0, 400);
  if (reset) resetSearchFilters();
  const target = `#zoeken/${encodeURIComponent(ui.query)}`;
  // One history entry opens search; subsequent keystrokes update that entry.
  history[alreadySearching ? 'replaceState' : 'pushState'](null, '', target);
  if (alreadySearching) updateSearchResults(); else renderMain();
  for (const link of document.querySelectorAll('.side-nav .nav-link')) {
    const active = link.hash === '#kennisplein';
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  }
  $('.search-intro')?.classList.toggle('has-query', Boolean(ui.query.trim()));
  for (const field of document.querySelectorAll('#global-search,#page-search')) if (field.value !== ui.query) field.value = ui.query;
}
const knownPages = ['kennisplein', 'templates', 'filialen', 'inzichten', 'vraag', 'zoeken', 'bewaard', 'mijn-bijdragen', 'volgend'];
function notFoundPage() { return `<div class="empty-state not-found"><span class="sticker" aria-hidden="true">Oh oh!</span><h1>Deze pagina bestaat niet</h1><p>We hebben goed gezocht, maar deze pagina kunnen we niet vinden.</p><h2>Hoe kunnen we je verder helpen?</h2><div class="not-found-links"><a class="button secondary" href="#kennisplein">Kennisplein</a><a class="button secondary" href="#templates">Templates</a><a class="button secondary" href="#filialen">Filialen</a><a class="button secondary" href="#zoeken">Zoeken</a></div></div>`; }
function renderMain() {
  captureAnswerDraft(); const pg = page(); const known = knownPages.includes(pg);
  const band = pg === 'zoeken' ? searchForm(ui.query) : pg === 'kennisplein' ? views.welcomeBand() : '';
  const html = !known ? notFoundPage() : pg === 'templates' ? libraryPage() : pg === 'filialen' ? branchesPage() : pg === 'inzichten' ? insightsPage() : pg === 'vraag' ? detailPage() : pg === 'zoeken' ? searchPage() : feedPage();
  $('#main').innerHTML = `${band}<div class="page page-${known ? pg : 'not-found'}">${html}</div>`;
  if ($('#answer-body')) $('#answer-body').value = answerDrafts.get($('#answer-form').dataset.id) || '';
  enhanceSelects($('#main'));
  document.title = `${!known ? 'Pagina niet gevonden' : ({ templates: 'Templates', filialen: 'Filialen', inzichten: 'Praktijkinzichten', vraag: 'Bijdrage', zoeken: 'Zoeken', bewaard: 'Bewaard', 'mijn-bijdragen': 'Mijn bijdragen', volgend: 'Mijn netwerk' }[pg] || 'Kennisplein')} · Jumboverflow`;
}
function render() { captureAnswerDraft(); shell(); renderMain(); }

function closeModal() { closeDropdown(true); const root = $('#modal-root'); root.innerHTML = ''; document.body.style.overflow = ''; activeTemplate = null; modalReturnFocus?.focus(); }
function modal(title, subtitle, body, footerHtml = '', wide = false) {
  if (!$('#modal-root').innerHTML) modalReturnFocus = document.activeElement;
  $('#modal-root').innerHTML = `<div class="modal-overlay" data-overlay="true"><section class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"${subtitle ? ' aria-describedby="modal-subtitle"' : ''}><header class="modal-header"><div><h2 id="modal-title">${title}</h2>${subtitle ? `<p id="modal-subtitle">${subtitle}</p>` : ''}</div><button class="icon-button modal-close" data-action="close-modal" aria-label="Venster sluiten">${icon('close')}</button></header><div class="modal-body">${body}</div>${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}</section></div>`;
  document.body.style.overflow = 'hidden'; enhanceSelects($('#modal-root')); const dialog = $('.modal'); animateDialog(dialog); queueMicrotask(() => { if (dialog?.isConnected && !dialog.contains(document.activeElement)) dialog.querySelector('input:not([type="radio"]),textarea,.dropdown-trigger,.icon-button')?.focus({ preventScroll: true }); });
}
function newContribution(type = 'question') {
  modal('Deel wat <span class="mark">jij</span> weet.', 'Een goede vraag of een klein idee helpt de hele community.', `<form id="contribution-form"><fieldset class="type-fieldset"><legend class="field-label">Wat wil je delen?</legend><div class="type-options">${[['question', 'Vraag stellen', 'messages'], ['hack', 'Praktijkhack', 'lightbulb'], ['template', 'Template', 'files']].map(([v, label, ico]) => `<label class="type-option"><input type="radio" name="type" value="${v}" ${type === v ? 'checked' : ''}><span>${icon(ico, 'sm')}${label}</span></label>`).join('')}</div></fieldset><div class="form-field"><label for="post-title">${type === 'question' ? 'Wat wil je weten?' : 'Geef je bijdrage een duidelijke titel'}</label><input id="post-title" name="title" required minlength="8" maxlength="150" placeholder="Bijvoorbeeld: hoe organiseren jullie de avondoverdracht?"></div><div class="form-field"><label for="post-body">${type === 'template' ? 'Wat maakt dit template handig?' : 'Vertel iets meer'}</label><textarea id="post-body" name="body" required minlength="20" maxlength="10000" placeholder="Wat is de situatie? Wat hebben jullie al geprobeerd? Deel genoeg context zodat collega’s mee kunnen denken."></textarea></div><div class="form-row"><div class="form-field"><label for="post-category">Onderwerp</label><select id="post-category" name="category">${categories.map(c => `<option value="${c.id}" data-icon="${c.icon}">${esc(c.name)}</option>`).join('')}</select></div><div class="form-field"><label for="post-tags">Tags <span>(optioneel)</span></label><input id="post-tags" name="tags" maxlength="120" placeholder="inwerken, vulploeg, zaterdag"></div></div><div id="template-fields" ${type !== 'template' ? 'hidden' : ''}><div class="form-field"><label for="template-content">Inhoud van je template</label><textarea id="template-content" name="content" class="code" placeholder="# Mijn template&#10;&#10;- [ ] Eerste taak&#10;- [ ] Tweede taak" ${type === 'template' ? 'required minlength="10"' : ''}></textarea><small>Tekst of Markdown. Collega's kunnen je template aanpassen en downloaden.</small></div><div class="form-field file-upload"><label for="template-file">Of laad een tekstbestand in <span>(optioneel, maximaal 500 KB)</span></label><input id="template-file" type="file" accept=".txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json"><small>CSV, Markdown, JSON of tekst. De inhoud wordt bewerkbaar in het veld hierboven.</small></div></div><div class="form-tip notification note">${icon('info', 'sm')}<p>Je deelt als <strong>${esc(state.profile.name)}</strong> van Jumbo ${esc(branch(state.profile.branch).city)}. Deel geen persoonlijke gegevens van collega's of klanten.</p></div></form>`, `<button class="button secondary" data-action="close-modal">Annuleren</button><button class="button primary" type="submit" form="contribution-form">${icon('plus', 'sm')}Publiceer bijdrage</button>`);
}
function openTemplate(templateId) { const t = state.templates.find(t => t.id === templateId); if (!t) { toast('Deze template is niet gevonden.'); return; } activeTemplate = t.id; const b = branch(t.branch); const saved = state.savedTemplates.includes(t.id); modal(esc(t.title), 'Een bewezen startpunt. Maak het passend voor jouw winkel.', `<div class="template-detail-grid"><div>${templateCover(t)}</div><div class="template-summary"><div class="post-tags">${categoryTag(t.category)}<span class="tag">${t.format}</span>${t.parentId ? '<span class="tag solved">Aangepaste versie</span>' : ''}</div><h3>Een goed idee om <strong>over te nemen.</strong></h3><p>${esc(t.description)}</p><div class="template-author">${avatar(t.author, 'tiny', b.color)}<span>${esc(t.author)} · Jumbo ${esc(b.city)}</span></div><div class="template-action-group"><button class="button primary" data-action="download" data-id="${t.id}">${icon('download', 'sm')}Download ${t.format}</button><button class="button secondary" data-action="fork" data-id="${t.id}">${icon('fork', 'sm')}Pas aan voor mijn filiaal</button></div><div class="template-action-group"><button class="action-link" data-action="save-template" data-id="${t.id}" aria-pressed="${saved}">${icon('bookmark', 'sm')}${saved ? 'Bewaard in jouw collectie' : 'Bewaar voor later'}</button></div></div></div><h4 class="preview-label">Zo ziet de inhoud eruit</h4><pre class="template-preview" aria-label="Inhoud van de template">${esc(t.content)}</pre>`, `<span class="modal-meta">${icon('download', 'sm')}${t.downloads} downloads · ${icon('fork', 'sm')}${t.forks} aangepaste versies</span><button class="button secondary" data-action="close-modal">Sluiten</button>`, true); activeTemplate = t.id; }
function forkTemplate(templateId) { activeTemplate = null; const t = state.templates.find(t => t.id === templateId); if (!t) return; modal('Een goede basis. <span class="mark">Jouw</span> eigen draai.', 'Pas het template aan voor je filiaal. De originele versie blijft beschikbaar.', `<form id="fork-form" data-parent="${t.id}"><div class="form-field"><label for="fork-title">Naam van jouw versie</label><input name="title" id="fork-title" required minlength="5" maxlength="150" value="${esc(t.title)} — ${esc(branch(state.profile.branch).city)}"></div><div class="form-field"><label for="fork-description">Wat heb je aangepast?</label><input id="fork-description" name="description" required minlength="5" maxlength="300" value="Aangepast voor Jumbo ${esc(branch(state.profile.branch).city)}."></div><div class="form-field"><label for="fork-content">Maak het passend voor jouw filiaal</label><textarea class="code" id="fork-content" name="content" required minlength="10" maxlength="80000">${esc(t.content.replaceAll('[filiaal]', branch(state.profile.branch).city))}</textarea></div><div class="form-tip notification note">${icon('fork', 'sm')}<p>Deze versie wordt toegevoegd aan de templatebibliotheek en aan Mijn bijdragen. Je downloadt hem daarna als ${t.format}.</p></div></form>`, `<button class="button secondary" data-action="template" data-id="${t.id}">${icon('arrowLeft', 'sm')}Terug</button><button class="button primary" type="submit" form="fork-form">${icon('check', 'sm')}Bewaar mijn versie</button>`, true); }
function helpModal() { modal('Hallo! <span class="mark">Zo werkt</span> het kennisplein.', 'Samen weten we meer. Welkom op het kennisplein voor de winkelvloer.', `<ol class="help-steps"><li class="help-step"><span class="help-number">1</span><div><h3>Vraag het aan je collega's</h3><p>Zoek eerst of iemand je vraag al heeft gesteld. Nog geen antwoord? Deel je situatie en laat andere filialen meedenken.</p></div></li><li class="help-step"><span class="help-number">2</span><div><h3>Geef goede ideeën een zetje</h3><p>Een antwoord geholpen of een hack geprobeerd? Klik op ‘Handig’. Zo komt bruikbare kennis bovenaan. Bewaar je favorieten voor later.</p></div></li><li class="help-step"><span class="help-number">3</span><div><h3>Neem over. Pas aan. Deel terug.</h3><p>Download een template of klik op ‘Pas aan voor mijn filiaal’. Je krijgt een eigen bewerkbare versie, met een verwijzing naar het origineel.</p></div></li></ol><div class="help-note notification note">${icon('info', 'sm')}<p>${backendMode === 'shared' ? 'Je bijdragen, reacties en templates worden gedeeld opgeslagen. Stemmen, bewaarde items en je profiel horen bij jouw account.' : 'Je gebruikt de lokale demoversie. Wijzigingen worden in deze browser opgeslagen; de gedeelde server is niet verbonden.'} De eerste berichten, namen en ervaringen zijn fictieve voorbeelden. Jumboverflow is een zelfstandig concept en geen officiële Jumbo-dienst.</p></div>`, `<button class="button secondary" data-action="guidelines">Onze 5 afspraken</button><button class="button primary" data-action="close-modal">Aan de slag ${icon('chevron', 'sm')}</button>`); }
function guidelinesModal() { const items = [['Vragen staat vrij', 'Geen vraag is te klein. Wie iets vraagt, helpt ook de collega die morgen hetzelfde zoekt.', 'help'], ['Deel wat écht werkt', 'Vertel wat jullie hebben geprobeerd, ook wat misging. Daar leren we samen het meest van.', 'lightbulb'], ['Vriendelijk en concreet', 'Reageer zoals je een collega op de vloer helpt: positief, duidelijk en met een voorbeeld.', 'smile'], ['Privacy voorop', 'Geen namen, roosters of andere gegevens van collega’s en klanten. Ook niet op een foto of in een template.', 'shield'], ['Geef de eer waar die hoort', 'Gebruik je een idee van een ander filiaal? Noem ze en deel jouw verbeterde versie weer terug.', 'heart']]; modal('Onze <span class="mark">5 afspraken</span>', 'Zo houden we het kennisplein fijn, veilig en bruikbaar voor iedereen.', `<ol class="promise-list">${items.map(([title, text, ico], i) => `<li class="promise"><span class="promise-badge" aria-hidden="true">${icon(ico)}<b>${i + 1}</b></span><div><h3>${title}</h3><p>${text}</p></div></li>`).join('')}</ol>`, `<button class="button primary" data-action="close-modal">Helder ${icon('check', 'sm')}</button>`); }
function aboutModal() { modal('De vloer verdient een <span class="mark">eigen</span> kennisplein.', 'Jumboverflow · zelfstandig concept en interactief prototype', `<ol class="help-steps"><li class="help-step"><span class="help-number">${icon('lightbulb', 'sm')}</span><div><h3>Een concept voor Jumbo-filialen</h3><p>Een plek waar teams elkaar helpen met oplossingen die werken. Dit prototype is geen officiële dienst van Jumbo. De vooraf ingevulde community-inhoud en medewerkers zijn fictieve voorbeelden. Je eigen bijdragen worden daaraan toegevoegd.</p></div></li><li class="help-step"><span class="help-number">${icon('grid', 'sm')}</span><div><h3>Gebouwd op Jumbo's Kompas-huisstijl</h3><p>Kleuren uit de actuele Kompas-tokens van jumbo.com: geel #FCBF00, tekst #171717, wit, ondersteunend grijs #F1F1F1, rand #E3E3E3, hulptekst #757575 en positief groen #00812D. Pilvormige knoppen en chips, zachte tintvlakken en heldere kaarten, koppen in Jumbo The Sans Black met een gele markering en het handgeschreven accent voor ‘Hallo’ en ‘Tip!’.</p></div></li></ol><div class="help-note"><strong>Geraadpleegde bronnen</strong><ul class="source-list"><li><a href="https://www.jumbo.com/" target="_blank" rel="noopener noreferrer">Jumbo.com — actuele website, Kompas-tokens en web-assets</a></li><li><a href="https://www.jumbo.com/service" target="_blank" rel="noopener noreferrer">Jumbo Service — begroeting, servicetegels en toon</a></li><li><a href="https://design.jumbo.com/latest/foundations/typography-yLZcyYAu" target="_blank" rel="noopener noreferrer">Kompas — het digitale designsysteem van Jumbo</a></li><li><a href="https://assets.website-files.com/5e68bd1f74a45a08affa8897/627a1e3d0c1c314b87ddcb63_JUMBO_Styleguide_A0.pdf" target="_blank" rel="noopener noreferrer">Jumbo Styleguide — aanvullende huisstijlreferentie</a></li></ul><p>${backendMode === 'shared' ? 'Opslag: een gedeelde database, met persoonlijke voorkeuren per account. Alleen de auteur kan een antwoord accepteren of een eigen vraag afsluiten.' : 'Opslag: lokaal in jouw browser, omdat de gedeelde server niet verbonden is.'} De inzichtenpagina en de CSV-export bevatten alleen totalen en thema's.</p></div>`, `<button class="button primary" data-action="close-modal">Helder</button>`); }
function profileModal() { modal('Hallo, <span class="mark">collega</span>.', 'Zo stel je jouw demo-profiel en filiaal in.', `<form id="profile-form"><div class="form-field"><label for="profile-name">Jouw naam</label><input id="profile-name" name="name" value="${esc(state.profile.name)}" required minlength="2" maxlength="70" autocomplete="name"></div><div class="form-row"><div class="form-field"><label for="profile-branch">Jouw filiaal</label><select id="profile-branch" name="branch">${branches.map(b => `<option value="${b.id}" ${state.profile.branch === b.id ? 'selected' : ''}>Jumbo ${esc(b.city)} · ${esc(b.name)}</option>`).join('')}</select></div><div class="form-field"><label for="profile-role">Jouw rol</label><select id="profile-role" name="role">${['Vulploegleider', 'Teamleider', 'Filiaalmanager', 'Winkelmedewerker', 'Hoofdkantoor'].map(r => `<option ${r === state.profile.role ? 'selected' : ''}>${r}</option>`).join('')}</select></div></div><div class="form-tip notification note">${icon('info', 'sm')}<p>${backendMode === 'shared' ? 'Je profiel en voorkeuren worden bij jouw account opgeslagen. De toegang tot deze website verloopt via ChatGPT.' : 'Dit is een lokaal demo-profiel. Je instellingen blijven in deze browser bewaard.'} Je rol is een profielomschrijving; hiermee veranderen je toegangsrechten niet.</p></div></form>`, `<button class="button secondary" data-action="close-modal">Annuleren</button><button class="button primary" type="submit" form="profile-form">${icon('check', 'sm')}Profiel opslaan</button>`); }
function notificationsModal() { const item = (ico, attrs, title, text, meta) => `<li class="notice-item"><button ${attrs}><span class="notice-icon">${icon(ico)}</span><span class="notice-text"><strong>${title}</strong><span>${text}</span><small>${meta}</small></span>${icon('chevron', 'sm')}</button></li>`; modal('Nieuws van het <span class="mark">kennisplein</span>', 'Voorbeeldmeldingen uit de demo-community.', `<ul class="notice-list">${item('lightbulb', 'data-action="notification-post" data-id="p4"', 'Een nieuwe aanpak voor het inwerken', 'Jumbo Eindhoven deelde een checklist voor de eerste werkdag.', 'Voorbeeldmelding · vandaag')}${item('files', 'data-action="template" data-id="t1"', 'Maak je overdracht een stukje makkelijker', 'Het template van Jumbo Tilburg staat voor je klaar.', 'Voorbeeldmelding · gisteren')}${item('users', 'data-action="open-branches"', 'Je hoeft het niet alleen te bedenken', 'Volg een filiaal en ontdek hun ideeën in Mijn netwerk.', 'Tip voor jou')}</ul>`); }
function downloadFile(content, filename, mime = 'text/plain;charset=utf-8') { const blob = new Blob([mime.startsWith('text/csv') ? '\uFEFF' : '', content], { type: mime }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function downloadTemplate(templateId) { const t = state.templates.find(t => t.id === templateId); if (!t) return; const ext = { CSV: 'csv', MD: 'md', TXT: 'txt', JSON: 'json' }[t.format] || 'txt'; downloadFile(t.content, `${t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}.${ext}`, t.format === 'CSV' ? 'text/csv;charset=utf-8' : t.format === 'JSON' ? 'application/json' : 'text/plain;charset=utf-8'); t.downloads++; state.templateDownloads.push(t.id); persist('download-template', { templateId: t.id }); toast('Je template wordt gedownload. Maak er iets moois van!'); renderMain(); if (activeTemplate === t.id) openTemplate(t.id); }
function toggleVote(key) { let item = state.posts.find(p => p.id === key); if (!item) for (const p of state.posts) { item = p.answers.find(a => a.id === key); if (item) break; } if (!item) return; const index = state.votes.indexOf(key); const added = index < 0; if (index >= 0) { state.votes.splice(index, 1); item.votes--; } else { state.votes.push(key); item.votes++; } persist('vote', { targetId: key, value: added }); renderMain(); if (added) { lastVotedKey = key; lastVotedAt = performance.now(); animateVote(key, true); } }
async function sharePost(postId) { const url = `${location.origin}${location.pathname}#vraag/${postId}`; try { await navigator.clipboard.writeText(url); toast('Link naar deze bijdrage gekopieerd.'); } catch { modal('Deel deze bijdrage', 'Kopieer de link hieronder en deel hem met een collega die toegang heeft.', `<div class="form-field"><label for="share-url">Link naar bijdrage</label><input id="share-url" readonly value="${esc(url)}" data-select-on-focus="true"></div>`); } }

document.addEventListener('click', async event => {
  if (event.target.matches('[data-overlay]')) { closeModal(); return; }
  const link = event.target.closest('a[href^="#"]'); if (link) { const wasOpen = ui.mobileOpen; ui.mobileOpen = false; $('.sidebar')?.classList.remove('open'); $('.mobile-backdrop')?.classList.remove('visible'); $('.mobile-menu')?.setAttribute('aria-expanded', 'false'); if (!['vraag', 'zoeken'].includes(link.hash.slice(1).split('/')[0])) resetFilters(); if (link.hash === (location.hash || '#kennisplein')) { event.preventDefault(); render(); window.scrollTo({ top: 0, behavior: 'instant' }); if (wasOpen) $('#main')?.focus({ preventScroll: true }); return; } }
  const el = event.target.closest('[data-action]'); if (!el) return; const action = el.dataset.action; const key = el.dataset.id;
  switch (action) {
    case 'new': newContribution(); break;
    case 'new-template': newContribution('template'); break;
    case 'type': ui.type = key; ui.limit = 6; renderMain(); break;
    case 'category': ui.category = key; ui.type = 'all'; ui.limit = 6; ui.mobileOpen = false; navigate('kennisplein'); setTimeout(() => $('#community-feed')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth', block: 'start' }), 0); break;
    case 'clear-category': ui.category = 'all'; render(); break;
    case 'clear-branch': ui.branch = 'all'; renderMain(); break;
    case 'sort': ui.sort = key; ui.limit = 6; renderMain(); break;
    case 'load-more': ui.limit += 6; renderMain(); break;
    case 'vote': toggleVote(key); break;
    case 'save-post': { const index = state.saved.indexOf(key); if (index >= 0) state.saved.splice(index, 1); else state.saved.push(key); persist('settings', preferences()); render(); toast(index < 0 ? 'Bewaard voor later.' : 'Verwijderd uit je bewaarde bijdragen.'); break; }
    case 'save-template': { const index = state.savedTemplates.indexOf(key); if (index >= 0) state.savedTemplates.splice(index, 1); else state.savedTemplates.push(key); persist('settings', preferences()); render(); openTemplate(key); toast(index < 0 ? 'Template bewaard voor later.' : 'Template verwijderd uit je collectie.'); break; }
    case 'template': openTemplate(key); break;
    case 'fork': forkTemplate(key); break;
    case 'download': downloadTemplate(key); break;
    case 'template-category': ui.templateCategory = key; renderMain(); break;
    case 'follow': { const index = state.followedBranches.indexOf(key); if (index >= 0) state.followedBranches.splice(index, 1); else state.followedBranches.push(key); persist('settings', preferences()); renderMain(); toast(index < 0 ? `Je volgt nu Jumbo ${branch(key).city}.` : `Je volgt Jumbo ${branch(key).city} niet meer.`); break; }
    case 'branch-feed': closeModal(); resetFilters(); ui.branch = key; ui.mobileOpen = false; navigate('kennisplein'); break;
    case 'my-branch': resetFilters(); ui.branch = state.profile.branch; ui.mobileOpen = false; navigate('kennisplein'); break;
    case 'share': await sharePost(key); break;
    case 'help': case 'fork-help': helpModal(); break;
    case 'guidelines': guidelinesModal(); break;
    case 'about': aboutModal(); break;
    case 'profile': profileModal(); break;
    case 'notifications': notificationsModal(); break;
    case 'notification-post': closeModal(); navigate(`vraag/${key}`); break;
    case 'open-branches': closeModal(); navigate('filialen'); break;
    case 'open-library': navigate('templates'); break;
    case 'open-search': navigate('zoeken'); setTimeout(() => $('#page-search')?.focus(), 50); break;
    case 'search-example': runSearch(el.dataset.query, { reset: true }); $('#page-search')?.focus(); break;
    case 'search-type': searchFilters.type = key; updateSearchResults(); break;
    case 'search-reset': resetSearchFilters(); updateSearchResults(); $('#page-search')?.focus(); break;
    case 'close-modal': closeModal(); break;
    case 'discover': resetFilters(); navigate('kennisplein'); break;
    case 'menu': ui.mobileOpen = !ui.mobileOpen; $('.sidebar').classList.toggle('open', ui.mobileOpen); $('.mobile-backdrop').classList.toggle('visible', ui.mobileOpen); el.setAttribute('aria-expanded', ui.mobileOpen); if (ui.mobileOpen) setTimeout(() => $('.drawer-close')?.focus({ preventScroll: true }), 50); break;
    case 'menu-close': ui.mobileOpen = false; $('.sidebar').classList.remove('open'); $('.mobile-backdrop').classList.remove('visible'); $('.mobile-menu').setAttribute('aria-expanded', 'false'); $('.mobile-menu')?.focus({ preventScroll: true }); break;
    case 'solve': { const p = state.posts.find(p => p.id === key); if (p?.own) { p.solved = !p.solved; persist('solve', { postId: p.id, value: p.solved }); renderMain(); toast(p.solved ? 'Je vraag is gemarkeerd als opgelost.' : 'Je vraag is weer open.'); } break; }
    case 'accept-answer': { const p = state.posts.find(p => p.id === el.dataset.post); if (p?.own) { const a = p.answers.find(a => a.id === key); const accepted = !a.accepted; p.answers.forEach(a => a.accepted = false); a.accepted = accepted; p.solved = accepted; persist('accept-answer', { postId: p.id, answerId: a.id, value: accepted }); renderMain(); toast(accepted ? 'Fijn dat dit antwoord je verder helpt.' : 'Je hebt de markering verwijderd.'); } break; }
    case 'export-insights': { const rows = ['Onderwerp,Bijdragen,Vragen,Praktijkhacks,Templates', ...categories.map(c => { const posts = state.posts.filter(p => p.category === c.id); return `${c.name},${posts.length},${posts.filter(p => p.type === 'question').length},${posts.filter(p => p.type === 'hack').length},${state.templates.filter(t => t.category === c.id).length}`; })]; downloadFile(rows.join('\n'), 'jumboverflow-praktijkinzichten.csv', 'text/csv;charset=utf-8'); toast('Geaggregeerde inzichten gedownload, zonder namen of filialen.'); break; }
  }
});
document.addEventListener('input', event => {
  if (['global-search', 'page-search'].includes(event.target.id)) {
    clearTimeout(searchTimer);
    if (event.isComposing) return;
    const value = event.target.value;
    searchTimer = setTimeout(() => runSearch(value, { reset: true }), 220);
  }
});
document.addEventListener('compositionend', event => {
  if (['global-search', 'page-search'].includes(event.target.id)) {
    clearTimeout(searchTimer);
    const value = event.target.value;
    searchTimer = setTimeout(() => runSearch(value, { reset: true }), 220);
  }
});
document.addEventListener('change', async event => {
  if (event.target.id === 'search-category') { searchFilters.category = event.target.value; updateSearchResults(); }
  if (event.target.id === 'search-branch') { searchFilters.branch = event.target.value; updateSearchResults(); }
  if (event.target.id === 'feed-sort') { ui.sort = event.target.value; ui.limit = 6; renderMain(); }
  if (event.target.id === 'category-select') { ui.category = event.target.value; ui.limit = 6; render(); }
  if (event.target.id === 'answer-sort') { answerSort = event.target.value; renderMain(); }
  if (event.target.name === 'type') {
    const type = event.target.value; $('#template-fields').hidden = type !== 'template'; $('#template-content').required = type === 'template'; if (type === 'template') $('#template-content').minLength = 10; else $('#template-content').removeAttribute('minlength'); $('label[for="post-title"]').textContent = type === 'question' ? 'Wat wil je weten?' : 'Geef je bijdrage een duidelijke titel'; $('label[for="post-body"]').textContent = type === 'template' ? 'Wat maakt dit template handig?' : 'Vertel iets meer';
  }
  if (event.target.id === 'template-file') {
    const file = event.target.files[0]; if (!file) return;
    if (file.size > 500000) { toast('Dit bestand is te groot. Kies een tekstbestand tot 500 KB.'); event.target.value = ''; return; }
    const ext = file.name.split('.').pop().toLowerCase(); if (!['csv', 'md', 'txt', 'json'].includes(ext)) { toast('Kies een CSV-, Markdown-, JSON- of tekstbestand.'); event.target.value = ''; return; }
    try { const text = await file.text(); if (text.length > 80000) { toast('Dit template is te lang. Gebruik maximaal 80.000 tekens.'); event.target.value = ''; return; } $('#template-content').value = text; $('#template-content').dataset.format = ext.toUpperCase(); toast('Bestand ingeladen. Je kunt de inhoud nu aanpassen.'); } catch { toast('Het bestand kon niet worden gelezen.'); }
  }
});
document.addEventListener('submit', event => {
  const form = event.target; if (!['search-form', 'page-search-form', 'contribution-form', 'answer-form', 'fork-form', 'profile-form'].includes(form.id)) return; event.preventDefault();
  if (form.id === 'search-form' || form.id === 'page-search-form') { runSearch(form.id === 'search-form' ? $('#global-search').value : $('#page-search').value, { reset: true }); return; }
  const data = new FormData(form); const value = name => String(data.get(name) || '').trim();
  if (form.id === 'contribution-form') {
    const type = value('type'); if (value('title').length < 8 || value('body').length < 20) { toast('Vul een titel en een duidelijke beschrijving in.'); return; }
    if (type === 'template') {
      if (value('content').length < 10 || value('content').length > 80000) { toast('Gebruik 10 tot 80.000 tekens voor je template.'); return; }
      const t = { id: id('t'), title: value('title'), description: value('body'), category: value('category'), branch: state.profile.branch, author: state.profile.name, format: $('#template-content').dataset.format || 'MD', content: value('content'), downloads: 0, forks: 0, preview: 'checklist', createdAt: Date.now(), parentId: null, own: true }; state.templates.unshift(t); persist('create-template', { template: t }); closeModal(); navigate('templates'); openTemplate(t.id); toast('Je template staat in de bibliotheek.');
    } else {
      const p = { id: id('p'), type, title: value('title'), body: value('body'), category: value('category'), tags: value('tags').split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean).slice(0, 5), author: state.profile.name, branch: state.profile.branch, votes: 0, answers: [], solved: type === 'hack', createdAt: Date.now(), own: true }; state.posts.unshift(p); persist('create-post', { post: p }); closeModal(); navigate(`vraag/${p.id}`); toast('Je bijdrage staat op het kennisplein.');
    }
  }
  if (form.id === 'answer-form') {
    if (value('body').length < 10) { toast('Schrijf een reactie van minimaal 10 tekens.'); return; }
    const p = state.posts.find(p => p.id === form.dataset.id); if (!p) return; p.answers.push({ id: id('a'), author: state.profile.name, branch: state.profile.branch, body: value('body'), votes: 0, accepted: false, createdAt: Date.now(), own: true }); persist('create-answer', { postId: p.id, answer: p.answers.at(-1) }); form.reset(); answerDrafts.delete(p.id); renderMain(); toast('Bedankt! Je reactie is geplaatst.');
  }
  if (form.id === 'fork-form') {
    if (value('title').length < 5 || value('description').length < 5 || value('content').length < 10) { toast('Vul een naam, beschrijving en inhoud in.'); return; }
    const parent = state.templates.find(t => t.id === form.dataset.parent); if (!parent) return; const t = { ...parent, id: id('t'), title: value('title'), description: value('description'), content: value('content'), parentId: parent.id, branch: state.profile.branch, author: state.profile.name, downloads: 0, forks: 0, createdAt: Date.now(), own: true }; parent.forks++; state.templates.unshift(t); state.savedTemplates.push(t.id); persist('fork-template', { template: t, parentId: parent.id }); closeModal(); render(); openTemplate(t.id); toast('Jouw versie is opgeslagen en klaar om te downloaden.');
  }
  if (form.id === 'profile-form') {
    if (value('name').length < 2) { toast('Vul een naam van minimaal twee tekens in.'); return; }
    const oldName = state.profile.name; state.profile = { name: value('name'), branch: value('branch'), role: value('role') };
    state.posts.forEach(p => { if (p.own && p.author === oldName) p.author = state.profile.name; p.answers.forEach(a => { if (a.own && a.author === oldName) a.author = state.profile.name; }); }); state.templates.forEach(t => { if (t.own && t.author === oldName) t.author = state.profile.name; }); persist('settings', preferences()); closeModal(); render(); toast('Je demo-profiel is bijgewerkt.');
  }
});
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); if (matchMedia('(max-width:640px)').matches) { navigate('zoeken'); setTimeout(() => $('#page-search')?.focus(), 50); } else $('#global-search')?.focus(); }
  if (event.key === 'Escape') { if ($('#modal-root').innerHTML) closeModal(); else if (ui.mobileOpen) { ui.mobileOpen = false; render(); $('.mobile-menu')?.focus({ preventScroll: true }); } }
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[role="button"][data-action]')) { event.preventDefault(); event.target.click(); }
  if (event.key === 'Tab' && $('#modal-root').innerHTML) { const nodes = [...$('.modal').querySelectorAll('button,a[href],input:not([type="radio"]),input:checked,select,textarea,[tabindex="0"]')].filter(el => !el.disabled && !el.closest('[hidden]')); const first = nodes[0], last = nodes.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
});
window.addEventListener('hashchange', () => { clearTimeout(searchTimer); readSearchRoute(); ui.mobileOpen = false; render(); window.scrollTo({ top: 0, behavior: 'instant' }); });
window.addEventListener('storage', event => { if (backendMode === 'local' && event.key === STORAGE_KEY) { state = loadState(); render(); toast('Je kennisplein is bijgewerkt vanuit een ander tabblad.'); } });
window.addEventListener('scroll', updateHeaderShadow, { passive: true });
initInteractions();
await initialize();
readSearchRoute();
render();
setInterval(async () => {
  if (backendMode !== 'shared' || pendingWrites || document.hidden || document.querySelector('.modal') || document.activeElement?.matches('input,textarea,select,.dropdown-trigger')) return;
  try { const response = await fetch('/api/state'); if (response.ok) { state = (await response.json()).state; renderMain(); } } catch { }
}, 45000);

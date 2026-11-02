import { renderCityArt } from './city-art.js';

/** Presentation components. State and actions stay in app.js. */
export function createViews(C) {
  const { icon, esc, avatar, branch, category, categories, branches, navLink,
    categoryTag, typeTag, voteButton, timeAgo, countText, breadcrumb, footer } = C;

  function shell() {
    const { state, ui } = C;
    const b = branch(state.profile.branch);
    return `
      <header class="topbar">
        <button class="mobile-menu icon-button" data-action="menu" aria-label="Menu openen" aria-expanded="${ui.mobileOpen}">${icon('menu')}</button>
        <a class="brand" href="#kennisplein" aria-label="JumboOverflow startpagina"><img src="./assets/jumbo-logo.svg" alt="Jumbo"><span class="brand-tail">overflow<span class="brand-dot">.</span></span></a>
        <form class="header-search" id="search-form" role="search">${icon('search')}<input id="global-search" type="search" aria-label="Zoek een vraag, tip of template" placeholder="Beschrijf je vraag of probleem…" maxlength="400" value="${esc(ui.query)}" autocomplete="off"><span class="shortcut">Ctrl K</span></form>
        <div class="header-right">
          <button class="icon-button mobile-search" data-action="open-search" aria-label="Zoeken">${icon('search')}</button>
          <button class="header-location" data-action="profile">${icon('store','sm')}<span>Jumbo ${esc(b.city)}</span>${icon('down','sm')}</button>
          <button class="icon-button notification-button" data-action="notifications" aria-label="Meldingen bekijken">${icon('bell')}</button>
          <button class="profile-button" data-action="profile" aria-label="Jouw profiel aanpassen">${avatar(state.profile.name,'self')}<span class="profile-name">${esc(state.profile.name.split(' ')[0])}</span>${icon('down','sm')}</button>
        </div>
      </header>
      <div class="app-layout">
        <div class="mobile-backdrop ${ui.mobileOpen?'visible':''}" data-action="menu-close"></div>
        <aside class="sidebar ${ui.mobileOpen?'open':''}" aria-label="Hoofdnavigatie">
          <div><p class="sidebar-label">Samen slimmer</p><nav class="side-nav">${navLink('kennisplein','Ontdekken','grid')}${navLink('volgend','Mijn netwerk','users')}${navLink('templates','Templates','files',state.templates.length)}${navLink('filialen','Filialen','store')}</nav></div>
          <div class="sidebar-line"></div>
          <div><p class="sidebar-label">Jouw werkplek</p><nav class="side-nav">${navLink('bewaard','Bewaard','bookmark',state.saved.length+state.savedTemplates.length)}${navLink('mijn-bijdragen','Mijn bijdragen','edit')}${navLink('inzichten','Praktijkinzichten','chart')}</nav></div>
          <div class="sidebar-prompt"><span class="prompt-icon">${icon('lightbulb')}</span><p>Een klein idee kan<br>een groot verschil maken.</p><button data-action="new">Deel jouw idee ${icon('arrow','sm')}</button></div>
          <div class="sidebar-bottom"><button class="branch-mini" data-action="my-branch"><span class="branch-icon">${icon('store','sm')}</span><span><strong>Jumbo ${esc(b.city)}</strong><small>${esc(b.name)} · jouw filiaal</small></span>${icon('chevron','sm')}</button><div class="sidebar-help"><button data-action="help">${icon('help','sm')}Zo werkt het</button><span class="local-indicator" title="${C.backendMode==='shared'?'Lokale gedeelde database verbonden':'Gegevens in deze browser'}"><i></i>Demo</span></div></div>
        </aside><main class="main" id="main" tabindex="-1"></main>
      </div>`;
  }

  function topics() {
    return `<section class="topics-section" aria-labelledby="topics-title"><div class="topics-heading"><h2 id="topics-title">Waar wil je slimmer in worden?</h2><span>Vind je onderwerp</span></div><div class="topic-grid">${categories.map(c=>`<button class="topic-card ${C.ui.category===c.id?'active':''}" data-action="category" data-id="${c.id}" aria-pressed="${C.ui.category===c.id}"><span class="topic-symbol">${icon(c.icon)}</span><span class="topic-name">${esc(c.name)}</span><span class="topic-count">${countText(C.state.posts.filter(p=>p.category===c.id).length,'bijdrage','bijdragen')}</span>${icon('arrow','sm')}</button>`).join('')}</div></section>`;
  }

  function hero() {
    return `<section class="hero" aria-labelledby="welcome-title"><div class="hero-copy"><div class="hero-kicker"><span></span>VOOR COLLEGA'S. DOOR COLLEGA'S.</div><h1 id="welcome-title">Samen maken we<br>het werk slimmer<span>.</span></h1><p>De beste ideeën beginnen op de winkelvloer.<br>Ontdek wat werkt. Help elkaar verder.</p><div class="hero-actions"><button class="button black" data-action="new">${icon('plus','sm')}Deel je kennis</button><a class="button text" href="#templates">Ontdek de templates ${icon('arrow','sm')}</a></div></div><div class="hero-visual"><span class="hero-orbit" aria-hidden="true"></span><img class="colleagues-illustration" src="./assets/colleagues-hero.png" alt="Twee Jumbo-collega's delen een praktische aanpak op de winkelvloer" width="1280" height="1280" fetchpriority="high"><div class="hero-note">${icon('checkCircle','sm')}Een goed idee deel je samen.</div></div></section><div class="community-strip"><div class="avatar-stack">${avatar('Sanne Vries','tiny','#eadfcb')}${avatar('Bram Jansen','tiny','#dde7d4')}${avatar('Noor Peters','tiny','#e9dce9')}${avatar('Mo Amrani','tiny','#dce4ec')}</div><span><strong>${branches.length} filialen</strong> delen al hun kennis. Samen kom je verder.</span><span class="strip-right">${icon('heart','sm')}Van de vloer, voor de vloer</span></div>${topics()}`;
  }

  function postCard(p) {
    const { state } = C;
    const b = branch(p.branch);
    const answered = p.answers.some(a=>a.accepted);
    const saved = state.saved.includes(p.id);
    return `<article class="post-card" data-post="${p.id}"><div class="post-content"><div class="post-author-row">${avatar(p.author,'medium',b.color)}<div class="post-author-info"><span class="author">${esc(p.author)}</span><button class="branch-link" data-action="branch-feed" data-id="${b.id}">Jumbo ${esc(b.city)}</button></div><span class="post-time">${timeAgo(p.createdAt)}</span><button class="post-save ${saved?'saved':''}" data-action="save-post" data-id="${p.id}" aria-label="${saved?'Verwijderen uit bewaard':'Bijdrage bewaren'}" aria-pressed="${saved}">${icon('bookmark')}</button></div><div class="post-tags">${categoryTag(p.category)}${typeTag(p.type)}</div><h3><a class="post-title" href="#vraag/${p.id}">${esc(p.title)}</a></h3><p class="post-excerpt">${esc(p.body)}</p><div class="post-footer">${voteButton(p.id,p.votes)}<a href="#vraag/${p.id}" class="meta-comments ${answered?'answered':''}">${icon('messages','sm')}${countText(p.answers.length,'reactie','reacties')}</a>${p.solved?`<span class="post-resolved">${icon('checkCircle','sm')}${p.type==='hack'?'Bewezen aanpak':'Opgelost'}</span>`:''}<a class="post-read" href="#vraag/${p.id}" aria-label="Lees ${esc(p.title)}">${icon('arrow','sm')}</a></div></div></article>`;
  }

  function rightColumn() {
    return `<aside class="right-column" aria-label="Uitgelicht op het kennisplein"><section class="side-card week-tip"><div class="eyebrow">HET GOEDE IDEE VAN DE WEEK</div><div class="spot-illustration" aria-hidden="true"><div class="spot-circle"></div><div class="spot-paper"><span class="paper-clip"></span><span class="paper-heading">Een fijne eerste dag</span>${['Een buddy erbij','Samen aan de slag','Even terugkijken'].map(text=>`<span class="paper-task"><i>${icon('check','sm')}</i>${text}</span>`).join('')}</div><span class="spot-spark">${icon('sparkles')}</span></div><h3>Kleine aanpak.<br>Groot verschil.</h3><p>Met één buddy en één A4 geef je nieuwe collega's een vliegende start.</p><div class="tip-footer">${avatar('Noor Peters','tiny','#e9dfed')}Een idee van Jumbo Eindhoven</div><a class="button secondary full" href="#vraag/p4">Bekijk de aanpak ${icon('arrow','sm')}</a></section><section class="side-card useful-templates"><div class="side-card-heading"><span class="small-section-icon">${icon('files','sm')}</span><h3>Direct aan de slag</h3></div><p>Gemaakt door collega's. Klaar voor jou.</p><div class="mini-doc-list">${C.state.templates.filter(t=>['t1','t2','t3'].includes(t.id)).map(t=>`<button class="mini-doc" data-action="template" data-id="${t.id}"><span class="doc-icon ${t.format==='CSV'?'csv':''}">${icon(t.format==='CSV'?'grid':'files','sm')}</span><span><strong>${esc(t.title)}</strong><small>${t.format} · ${t.downloads} keer gebruikt</small></span>${icon('chevron','sm')}</button>`).join('')}</div><a class="card-link" href="#templates">Naar alle templates ${icon('arrow','sm')}</a></section><section class="network-invitation"><div class="network-icons"><span>${icon('store')}</span><i></i><span>${icon('store')}</span><i></i><span>${icon('store')}</span></div><h3>Eén Jumbo. Heel veel kennis.</h3><p>Volg een filiaal en ontdek wat er bij je collega's werkt.</p><a href="#filialen">Ontdek de filialen ${icon('arrow','sm')}</a></section></aside>`;
  }

  function templateCover(t) {
    const isGrid = t.format==='CSV';
    return `<div class="template-cover ${isGrid?'template-cover-grid':'template-cover-document'}" data-action="template" data-id="${t.id}" role="button" tabindex="0" aria-label="Bekijk ${esc(t.title)}"><div class="template-back-sheet"></div><div class="preview-sheet"><div class="sheet-masthead"><span class="sheet-brand">JUMBO</span><span>Voor de werkvloer</span></div><h4>${esc(t.title)}</h4><div class="sheet-subtitle">Een goed begin voor jouw filiaal.</div>${isGrid?`<div class="sheet-row head"><i class="sheet-cell"></i><i class="sheet-cell"></i><i class="sheet-cell"></i></div>${Array.from({length:5},()=>'<div class="sheet-row"><i class="sheet-cell"></i><i class="sheet-cell"></i><i class="sheet-cell"></i></div>').join('')}`:Array.from({length:4},()=>`<div class="sheet-block"><i class="sheet-check">${icon('check','sm')}</i><div style="flex:1"><div class="sheet-line"></div><div class="sheet-line short"></div></div></div>`).join('')}<div class="sheet-bottom-mark"></div></div><span class="cover-format">${icon(isGrid?'grid':'files','sm')}${t.format}</span>${t.parentId?`<span class="cover-fork">${icon('fork','sm')}Jouw eigen versie</span>`:''}</div>`;
  }

  function storeVisual(b) { return renderCityArt(b.id, b.city); }

  function branchesPage() {
    const { state } = C;
    return `${breadcrumb('Filialen')}<div class="page-heading"><div><div class="eyebrow">DICHTBIJ JE COLLEGA'S</div><h1>Je staat er niet alleen voor.</h1><p>Andere winkel, dezelfde uitdagingen. Volg je collega-filialen<br>en laat je inspireren door wat bij hen werkt.</p></div><button class="button secondary" data-action="profile">${icon('store','sm')}Mijn filiaal wijzigen</button></div><div class="branch-grid">${branches.map(b=>{const following=state.followedBranches.includes(b.id);const own=b.id===state.profile.branch;return `<article class="branch-card">${storeVisual(b)}<div class="branch-card-inner"><div class="branch-card-header"><span class="branch-initials">${esc(b.initials)}</span>${own?'<span class="tag featured">Jouw filiaal</span>':''}</div><h3>Jumbo ${esc(b.city)}</h3><p>${esc(b.name)} · ${esc(b.address)}</p><div class="branch-stats"><span><strong>${state.posts.filter(p=>p.branch===b.id).length}</strong>bijdragen</span><span><strong>${state.templates.filter(t=>t.branch===b.id).length}</strong>templates</span><span><strong>${C.branchScore(b.id)}</strong>keer geholpen</span></div><button class="button secondary ${following?'following':''}" data-action="follow" data-id="${b.id}" aria-pressed="${following}">${icon(following?'check':'plus','sm')}${following?'Je volgt dit filiaal':'Volg dit filiaal'}</button><button class="button text full" data-action="branch-feed" data-id="${b.id}">Bekijk bijdragen ${icon('arrow','sm')}</button></div></article>`;}).join('')}</div>${footer()}`;
  }

  return { shell, hero, postCard, rightColumn, templateCover, branchesPage };
}

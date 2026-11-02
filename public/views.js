import { renderCityArt } from './city-art.js';

/** Presentation components. State and actions stay in app.js.
 *  Structure follows jumbo.com: grey USP bar, white header with a pill search,
 *  a horizontal main navigation, full-width bands and a dark footer. */
export function createViews(C) {
  const { icon, esc, avatar, branch, category, categories, branches, navLink,
    categoryTag, typeTag, voteButton, timeAgo, countText } = C;
  const firstName = () => C.state.profile.name.split(' ')[0];

  function shell() {
    const { state, ui } = C;
    const b = branch(state.profile.branch);
    return `
      <header class="topbar"><div class="container topbar-inner">
        <button class="mobile-menu icon-button" data-action="menu" aria-label="Menu openen" aria-expanded="${ui.mobileOpen}" aria-controls="primary-navigation">${icon('menu')}</button>
        <a class="brand" href="#kennisplein" aria-label="Jumboverflow startpagina"><img src="./assets/jumbo-logo.svg" alt="Jumbo" width="154" height="31"><span class="brand-tail">verflow</span></a>
        <form class="header-search" id="search-form" role="search">
          <input id="global-search" type="search" aria-label="Zoek een vraag, tip of template" placeholder="Zoek een vraag, tip of template…" maxlength="400" value="${esc(ui.query)}" autocomplete="off">
          <button class="search-submit" type="submit" aria-label="Zoeken">${icon('search')}</button>
        </form>
        <div class="header-right">
          <button class="header-link profile-button" data-action="profile" aria-label="Jouw profiel aanpassen">${avatar(state.profile.name, 'self')}<span class="profile-text"><strong class="profile-name">${esc(firstName())}</strong><small class="profile-branch">Jumbo ${esc(b.city)}</small></span></button>
          <button class="icon-button notification-button" data-action="notifications" aria-label="Meldingen bekijken" title="Meldingen">${icon('bell')}</button>
          <button class="button primary small header-cta" data-action="new" aria-label="Deel je kennis">${icon('plus', 'sm')}<span>Deel je kennis</span></button>
        </div>
      </div></header>
      <div class="mobile-backdrop ${ui.mobileOpen ? 'visible' : ''}" data-action="menu-close"></div>
      <nav class="sidebar ${ui.mobileOpen ? 'open' : ''}" id="primary-navigation" aria-label="Hoofdnavigatie"><div class="container nav-inner">
        <div class="drawer-head"><img src="./assets/jumbo-logo.svg" alt="" width="110" height="22"><button class="icon-button drawer-close" data-action="menu-close" aria-label="Menu sluiten">${icon('close')}</button></div>
        <p class="sidebar-label">Samen slimmer</p>
        <div class="side-nav">${navLink('kennisplein', 'Ontdekken', 'grid')}${navLink('volgend', 'Mijn netwerk', 'users')}${navLink('templates', 'Templates', 'files', state.templates.length)}${navLink('filialen', 'Filialen', 'store')}${navLink('inzichten', 'Praktijkinzichten', 'chart')}</div>
        <p class="sidebar-label">Jouw werkplek</p>
        <div class="side-nav side-nav-personal">${navLink('bewaard', 'Bewaard', 'bookmark', state.saved.length + state.savedTemplates.length)}${navLink('mijn-bijdragen', 'Mijn bijdragen', 'edit')}</div>
        <div class="drawer-extra">
          <button class="branch-mini" data-action="my-branch"><span class="branch-icon">${icon('store', 'sm')}</span><span><strong>Jumbo ${esc(b.city)}</strong><small>${esc(b.name)} · jouw filiaal</small></span>${icon('chevron', 'sm')}</button>
          <button class="button primary full" data-action="new">${icon('plus', 'sm')}Deel je kennis</button>
          <button class="link-chevron" data-action="help">Zo werkt het ${icon('chevron', 'sm')}</button>
        </div>
      </div></nav>
      <main class="main" id="main" tabindex="-1"></main>
      ${siteFooter()}`;
  }

  function siteFooter() {
    return `<footer class="site-footer">
      <div class="footer-top"><div class="container footer-grid">
        <section class="footer-help" aria-labelledby="footer-help-title">
          <a class="footer-brand-badge" href="#kennisplein" aria-label="Jumboverflow startpagina">
            <svg class="footer-j-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
              <rect width="64" height="64" rx="8" fill="#fcbf00"/>
              <g transform="translate(21, 13) scale(1.22)">
                <path d="M18.02.593v19.14c0 4.61-7.029 7.462-12.76 7.462-2.496 0-3.948-.475-5.26-1.028.702.303 2.34 2.38 2.34 2.38 1.303.557 2.764 1.036 5.266 1.036 5.717 0 12.755-2.862 12.755-7.472V2.967L18.019.593" fill="#000"/>
                <path d="M0 23.337c.77.386 1.533.66 2.34.66 2.664 0 4.008-1.255 4.008-3.525V.592H18.02v19.14c0 4.611-7.028 7.463-12.76 7.463-2.495 0-3.947-.475-5.259-1.028v-2.83" fill="#fff"/>
              </g>
            </svg>
          </a>
          <div>
            <a class="footer-wordmark" href="#kennisplein" aria-label="Jumboverflow"><img src="./assets/jumbo-logo.svg" alt="Jumbo" width="112" height="22"><span class="footer-wordmark-tail">verflow</span></a>
            <h2 id="footer-help-title">We helpen je graag!</h2>
            <p>Vraag je je af hoe het kennisplein werkt? <button class="footer-inline" data-action="help">Bekijk de uitleg</button> of leg je vraag voor aan collega's.</p>
            <button class="footer-tip" data-action="guidelines"><span class="script">Tip!</span><span>Lees onze 5 afspraken</span>${icon('chevron', 'sm')}</button>
          </div>
        </section>
        <section aria-labelledby="footer-discover"><h2 id="footer-discover">Ontdekken</h2><ul class="footer-links"><li><a href="#kennisplein">Kennisplein</a></li><li><a href="#zoeken">Zoeken</a></li><li><a href="#templates">Templates</a></li><li><a href="#filialen">Filialen</a></li><li><a href="#inzichten">Praktijkinzichten</a></li></ul></section>
        <section aria-labelledby="footer-work"><h2 id="footer-work">Jouw werkplek</h2><ul class="footer-links"><li><a href="#volgend">Mijn netwerk</a></li><li><a href="#bewaard">Bewaard</a></li><li><a href="#mijn-bijdragen">Mijn bijdragen</a></li><li><button data-action="profile">Profiel en filiaal</button></li><li><button data-action="notifications">Meldingen</button></li></ul></section>
        <section aria-labelledby="footer-about"><h2 id="footer-about">Over Jumboverflow</h2><ul class="footer-links"><li><button data-action="help">Zo werkt het</button></li><li><button data-action="guidelines">Onze 5 afspraken</button></li><li><button data-action="about">Over dit prototype &amp; huisstijl</button></li></ul></section>
      </div>
      <div class="container footer-legal"><ul><li>Zelfstandig studieconcept</li><li>Geen officiële Jumbo-dienst</li><li>Alle voorbeeldinhoud is fictief</li></ul><span>${icon('heart', 'sm')}Gemaakt voor collega's. Beter door collega's.</span></div></div>
      <div class="footer-bottom"><div class="container"><span>Jumbo-merkmiddelen blijven eigendom van hun rechthebbenden.</span><span>© 2026 Jumboverflow</span></div></div>
    </footer>`;
  }

  function welcomeBand() { return ''; }

  function hero() {
    const { ui } = C;
    return `<section class="hero-section" aria-labelledby="welcome-title">
      <div class="hero-grid">
        <article class="promo-card hero-main">
          <div class="promo-copy">
            <p class="script hero-hello">Hallo ${esc(firstName())}!</p>
            <h1 id="welcome-title">Samen maken we het werk <strong class="mark">slimmer</strong></h1>
            <p class="hero-lead">Ontdek oplossingen, vragen en kant-en-klare templates van collega's uit ${branches.length} filialen.</p>
            <div class="hero-actions">
              <button class="link-chevron" data-action="new">Deel je vraag of tip ${icon('chevron', 'sm')}</button>
              <a class="link-chevron" href="#templates">Bekijk templates ${icon('chevron', 'sm')}</a>
            </div>
          </div>
          <div class="promo-visual"><img src="./assets/colleagues-hero.png" alt="Twee Jumbo-collega's delen een praktische aanpak" width="1280" height="1280" fetchpriority="high"></div>
        </article>
        <article class="promo-card hero-spotlight">
          <div class="promo-copy">
            <span class="tag featured">Idee van de week</span>
            <h2>Eén A4 voor een <strong>vliegende start</strong></h2>
            <p>Zo werkt Jumbo Eindhoven nieuwe collega's rustig in.</p>
            <a class="link-chevron" href="#vraag/p4">Bekijk de aanpak ${icon('chevron', 'sm')}</a>
          </div>
          <div class="promo-visual promo-visual-paper" aria-hidden="true"><div class="spot-paper"><span class="paper-clip"></span><span class="paper-heading">Een fijne eerste dag</span>${['Een buddy erbij', 'Samen aan de slag', 'Even terugkijken'].map(text => `<span class="paper-task"><i>${icon('check', 'sm')}</i>${text}</span>`).join('')}</div></div>
        </article>
      </div>
      <div class="topic-strip" aria-label="Onderwerpen">${categories.map(c => `<button class="topic-pill ${ui.category === c.id ? 'active' : ''}" data-action="category" data-id="${c.id}" aria-pressed="${ui.category === c.id}"><span class="topic-symbol tint-${c.color}">${icon(c.icon)}</span><span class="topic-name">${esc(c.name)}</span></button>`).join('')}</div>
    </section>`;
  }

  function postCard(p) {
    const { state } = C;
    const b = branch(p.branch);
    const answered = p.answers.some(a => a.accepted);
    const saved = state.saved.includes(p.id);
    return `<article class="post-card" data-post="${p.id}"><div class="post-content"><div class="post-author-row">${avatar(p.author, 'medium', b.color)}<div class="post-author-info"><span class="author">${esc(p.author)}</span><button class="branch-link" data-action="branch-feed" data-id="${b.id}">Jumbo ${esc(b.city)}</button></div><span class="post-time">${timeAgo(p.createdAt)}</span><button class="post-save icon-button ${saved ? 'saved' : ''}" data-action="save-post" data-id="${p.id}" aria-label="${saved ? 'Verwijderen uit bewaard' : 'Bijdrage bewaren'}" aria-pressed="${saved}">${icon('bookmark')}</button></div><div class="post-tags">${categoryTag(p.category)}${typeTag(p.type)}</div><h3><a class="post-title" href="#vraag/${p.id}">${esc(p.title)}</a></h3><p class="post-excerpt">${esc(p.body)}</p><div class="post-footer">${voteButton(p.id, p.votes)}<a href="#vraag/${p.id}" class="meta-comments ${answered ? 'answered' : ''}">${icon('messages', 'sm')}${countText(p.answers.length, 'reactie', 'reacties')}</a>${p.solved ? `<span class="post-resolved">${icon('checkCircle', 'sm')}${p.type === 'hack' ? 'Bewezen aanpak' : 'Opgelost'}</span>` : ''}<a class="post-read link-chevron" href="#vraag/${p.id}" aria-label="Lees verder: ${esc(p.title)}">Lees verder ${icon('chevron', 'sm')}</a></div></div></article>`;
  }

  function rightColumn() {
    const { state } = C;
    const open = state.posts.filter(p => p.type === 'question' && !p.answers.length).sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
    const picks = state.templates.filter(t => ['t1', 't2', 't3'].includes(t.id));
    return `<aside class="right-column" aria-label="Uitgelicht op het kennisplein">
      <section class="side-card help-wanted"><h3>Kun jij helpen?</h3><p>Deze vragen wachten nog op een eerste reactie.</p>
        <div class="side-list">${open.map(p => `<a class="side-list-item" href="#vraag/${p.id}"><span class="side-list-icon">${icon('help', 'sm')}</span><span class="side-list-text"><strong>${esc(p.title)}</strong><small>Jumbo ${esc(branch(p.branch).city)} · ${timeAgo(p.createdAt)}</small></span>${icon('chevron', 'sm')}</a>`).join('') || '<p class="side-empty">Alle vragen hebben al een reactie. Top!</p>'}</div>
      </section>
      <section class="side-card useful-templates"><h3>Direct aan de slag</h3><p>Gemaakt door collega's. Klaar voor jou.</p>
        <div class="side-list">${picks.map(t => `<button class="side-list-item mini-doc" data-action="template" data-id="${t.id}"><span class="doc-icon ${t.format === 'CSV' ? 'csv' : ''}">${icon(t.format === 'CSV' ? 'grid' : 'files', 'sm')}</span><span class="side-list-text"><strong>${esc(t.title)}</strong><small>${t.format} · ${t.downloads} keer gebruikt</small></span>${icon('chevron', 'sm')}</button>`).join('')}</div>
        <a class="link-chevron card-link" href="#templates">Naar alle templates ${icon('chevron', 'sm')}</a>
      </section>
      <section class="side-card network-invitation"><div class="network-icons" aria-hidden="true"><span>${icon('store', 'sm')}</span><i></i><span>${icon('store', 'sm')}</span><i></i><span>${icon('store', 'sm')}</span></div><h3>Eén Jumbo. <strong>Heel veel kennis.</strong></h3><p>Volg een filiaal en ontdek wat er bij je collega's werkt.</p><a class="link-chevron" href="#filialen">Ontdek de filialen ${icon('chevron', 'sm')}</a></section>
    </aside>`;
  }

  function templateCover(t) {
    const isGrid = t.format === 'CSV';
    const tint = category(t.category).color;
    return `<div class="template-cover tint-${tint} ${isGrid ? 'template-cover-grid' : 'template-cover-document'}" data-action="template" data-id="${t.id}" role="button" tabindex="0" aria-label="Bekijk ${esc(t.title)}"><div class="template-back-sheet"></div><div class="preview-sheet"><div class="sheet-masthead"><span class="sheet-brand">JUMBO</span><span>Voor de werkvloer</span></div><h4>${esc(t.title)}</h4><div class="sheet-subtitle">Een goed begin voor jouw filiaal.</div>${isGrid ? `<div class="sheet-row head"><i class="sheet-cell"></i><i class="sheet-cell"></i><i class="sheet-cell"></i></div>${Array.from({ length: 5 }, () => '<div class="sheet-row"><i class="sheet-cell"></i><i class="sheet-cell"></i><i class="sheet-cell"></i></div>').join('')}` : Array.from({ length: 4 }, () => `<div class="sheet-block"><i class="sheet-check">${icon('check', 'sm')}</i><div class="sheet-lines"><div class="sheet-line"></div><div class="sheet-line short"></div></div></div>`).join('')}</div><span class="cover-format">${icon(isGrid ? 'grid' : 'files', 'sm')}${t.format}</span>${t.parentId ? `<span class="cover-fork">${icon('fork', 'sm')}Aangepaste versie</span>` : ''}</div>`;
  }

  function storeVisual(b) { return renderCityArt(b.id, b.city); }

  function branchesPage() {
    const { state } = C;
    return `${C.breadcrumb('Filialen')}<div class="page-heading"><div><h1>Je staat er <span class="mark">niet alleen</span> voor.</h1><p>Andere winkel, dezelfde uitdagingen. Volg je collega-filialen en laat je inspireren door wat bij hen werkt.</p></div><button class="button secondary" data-action="profile">${icon('store', 'sm')}Mijn filiaal wijzigen</button></div><div class="branch-grid">${branches.map(b => { const following = state.followedBranches.includes(b.id); const own = b.id === state.profile.branch; return `<article class="branch-card ${own ? 'is-own' : ''}">${storeVisual(b)}<div class="branch-card-inner"><div class="branch-card-header"><span class="branch-initials">${esc(b.initials)}</span>${own ? '<span class="tag featured">Jouw filiaal</span>' : ''}</div><h3>Jumbo ${esc(b.city)}</h3><p>${esc(b.name)} · ${esc(b.address)}</p><div class="branch-stats"><span><strong>${state.posts.filter(p => p.branch === b.id).length}</strong>bijdragen</span><span><strong>${state.templates.filter(t => t.branch === b.id).length}</strong>templates</span><span><strong>${C.branchScore(b.id)}</strong>keer geholpen</span></div><button class="button secondary small ${following ? 'following' : ''}" data-action="follow" data-id="${b.id}" aria-pressed="${following}">${icon(following ? 'check' : 'plus', 'sm')}${following ? 'Je volgt dit filiaal' : 'Volg dit filiaal'}</button><button class="link-chevron" data-action="branch-feed" data-id="${b.id}">Bekijk bijdragen ${icon('chevron', 'sm')}</button></div></article>`; }).join('')}</div>`;
  }

  return { shell, welcomeBand, hero, postCard, rightColumn, templateCover, branchesPage };
}

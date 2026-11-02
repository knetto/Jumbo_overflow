const paths = {
  thumbsUp:'<path d="M7 10v11H3V10zm0 0 5-8a3 3 0 0 1 1 3v4h5a3 3 0 0 1 3 3l-2 7a3 3 0 0 1-3 2H7"/>',
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  messages:'<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/><path d="M8 10h8m-8 4h5"/>',
  files:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8m-8 4h5"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/>',
  store:'<path d="M3 9h18L19 3H5zM4 9v11h16V9M9 20v-7h6v7M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>',
  bookmark:'<path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  chart:'<path d="M3 3v18h18M7 16v-5m5 5V7m5 9v-8"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  search:'<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  arrowLeft:'<path d="M20 12H4m6-6-6 6 6 6"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  down:'<path d="m6 9 6 6 6-6"/>',
  up:'<path d="m6 15 6-6 6 6"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  checkCircle:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  lightbulb:'<path d="M9 18h6m-5 3h4M8.5 14.5a6 6 0 1 1 7 0C14 15.5 15 16 15 17H9c0-1 1-1.5-.5-2.5z"/>',
  flame:'<path d="M12 3c1 5-5 6-5 10a5 5 0 0 0 10 0c0-2-1-3-2-4 0 3-3 3-3 1 0-2 1-4 0-7z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 4h.01"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-9 12a3 3 0 0 0 6 0"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  box:'<path d="m3 7 9-5 9 5-9 5zM3 7v10l9 5 9-5V7M12 12v10M7.5 4.5l9 5"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-13 4h2m4 0h2"/>',
  sparkles:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5zM20 2v4m-2-2h4"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  fork:'<circle cx="6" cy="4" r="2"/><circle cx="18" cy="4" r="2"/><circle cx="6" cy="20" r="2"/><path d="M6 6v12M18 6v3a4 4 0 0 1-4 4H6"/>',
  share:'<path d="M12 16V3m-5 5 5-5 5 5M5 12H3v9h18v-9h-2"/>',
  edit:'<path d="m16 3 5 5M4 15 16 3a2 2 0 0 1 3 0l2 2a2 2 0 0 1 0 3L9 20l-6 1z"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  shield:'<path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6z"/><path d="m8 12 3 3 5-6"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  pin:'<path d="m16 3 5 5-5 2-2 5-2 2-5-5 2-2 5-2zM9 15l-6 6"/>',
  external:'<path d="M15 3h6v6m0-6L10 14M9 3H3v18h18v-6"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  location:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
  medal:'<circle cx="12" cy="8" r="6"/><path d="m8 13-2 9 6-3 6 3-2-9"/>',
};
export const icon = (name, size='') => `<svg class="icon ${size}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.messages}</svg>`;
export const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export const initials = name => /^[A-Z]{2}$/.test(name) ? name : name.split(' ').filter(Boolean).filter((_,i,a)=>i===0||i===a.length-1).map(x=>x[0]).join('').toUpperCase();
export const avatar = (name, extra='', color='') => `<span class="avatar ${extra}" ${color ? `style="background:${esc(color)}"` : ''}>${esc(initials(name))}</span>`;

export const heroArt = `<div class="hero-art" aria-hidden="true"><svg viewBox="0 0 340 225" xmlns="http://www.w3.org/2000/svg">
<circle cx="197" cy="112" r="92" fill="#fce28a"/>
<path d="M37 145c-35-23-12-61 12-51 15 7-2 29-15 22-21-10-6-46 14-54" fill="none" stroke="#bc9438" stroke-width="1.4" stroke-dasharray="4 4"/><path d="m41 58 8 3-4 8" fill="none" stroke="#bc9438" stroke-width="1.4"/>
<g transform="translate(93 21) rotate(8 90 90)"><rect x="3" y="5" width="156" height="171" rx="8" fill="#d4b44a" opacity=".25"/><rect width="156" height="171" rx="7" fill="#fff9e7" stroke="#b7a26a" stroke-width="1.1"/></g>
<g transform="translate(70 30) rotate(-8 90 90)"><rect x="3" y="5" width="163" height="176" rx="7" fill="#d4b44a" opacity=".2"/><rect width="163" height="176" rx="7" fill="white" stroke="#383828" stroke-width="1.5"/><path d="M16 23h24" stroke="#fcbf00" stroke-width="7"/><text x="17" y="48" font-family="Jumbo, sans-serif" font-size="17" font-weight="900" fill="#171717">Dit werkt bij ons.</text><path d="M17 61h126" stroke="#e7e4d6"/><rect x="17" y="76" width="15" height="15" rx="3" fill="#fff3bd"/><path d="m21 83 3 3 5-6" fill="none" stroke="#837028" stroke-width="1.5"/><path d="M43 80h81m-81 7h57" stroke="#d5d4c6" stroke-width="3" stroke-linecap="round"/><rect x="17" y="103" width="15" height="15" rx="3" fill="#fff3bd"/><path d="m21 110 3 3 5-6" fill="none" stroke="#837028" stroke-width="1.5"/><path d="M43 107h88m-88 7h65" stroke="#d5d4c6" stroke-width="3" stroke-linecap="round"/><rect x="17" y="130" width="15" height="15" rx="3" fill="#fff3bd"/><path d="m21 137 3 3 5-6" fill="none" stroke="#837028" stroke-width="1.5"/><path d="M43 134h72m-72 7h49" stroke="#d5d4c6" stroke-width="3" stroke-linecap="round"/></g>
<g transform="translate(216 44) rotate(8)"><rect x="3" y="4" width="97" height="62" rx="8" fill="#d2b44e" opacity=".2"/><path d="M0 8a8 8 0 0 1 8-8h81a8 8 0 0 1 8 8v39a8 8 0 0 1-8 8H28L16 66V55H8a8 8 0 0 1-8-8z" fill="#fcbf00" stroke="#4c411f" stroke-width="1.4"/><path d="m36 23 12-10 12 10m-24 12 12-10 12 10" fill="none" stroke="#171717" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></g>
<g transform="translate(177 170) rotate(3)"><rect x="2" y="3" width="135" height="34" rx="17" fill="#a4b28d" opacity=".15"/><rect width="135" height="34" rx="17" fill="#eaf2df" stroke="#81966b" stroke-width="1.1"/><circle cx="18" cy="17" r="8" fill="#73935a"/><path d="m14.5 17 2.5 2.5 4.5-5" stroke="white" stroke-width="1.3" fill="none"/><text x="32" y="21" font-family="Jumbo,sans-serif" font-size="10" font-weight="700" fill="#536643">Samen uitgeprobeerd</text></g>
<path d="m287 128 3 10 10 3-10 3-3 10-3-10-10-3 10-3zM57 28l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#383322"/>
</svg></div>`;

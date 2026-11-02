import { esc } from './ui.js';

// Small city portraits, drawn in the same palette and line style as the shop.
// Landmarks are symbolic city accents, rather than depictions of the actual branches.
function canalHouse(x, roof = 'step') {
  const top = roof === 'bell'
    ? `M${x} 63q0-8 5-8v-5q5-10 10 0v5q5 0 5 8`
    : roof === 'gable'
      ? `M${x} 63l10-17 10 17`
      : `M${x} 63v-6h4v-6h4v-6h4v6h4v6h4v6`;
  return `<path d="M${x} 63h20v34h-20z" fill="#f8f8ef"/><path d="${top}" fill="#fff7d6"/><path d="M${x} 63v34m20-34v34M${x+5} 70v5m10-5v5m-10 7v5m10-5v5M${x+8} 97v-7h5v7"/>`;
}

const cityScenes = {
  dordrecht: {
    landmark: 'de Grote Kerk en het waterfront',
    art: `<path d="M45 98V34h29v64" fill="#f5f5eb"/>
      <path d="M43 34v-7h6v4h6v-4h7v4h6v-4h8v7z" fill="#fff4c4"/>
      <path d="M48 46h23m-23 21h23M52 54v7m13-7v7M52 76v13m13-13v13"/>
      <circle cx="59.5" cy="43" r="5" fill="#fff0ac"/><path d="M59.5 40v3l2 1"/>
      <path d="M74 67l17-16 20 19v28H74z" fill="#f5f5eb"/>
      <path d="M23 104h56m-45 5h22m183-5h35m-28 5h18" stroke="#b9c4b0"/>`,
  },
  utrecht: {
    landmark: 'de Domtoren',
    art: `<path d="M47 98V64h26v34M50 64V38h20v26M53 38V20h14v18" fill="#f5f5eb"/>
      <path d="M51 20l9-13 9 13z" fill="#fff0b0"/><path d="M60 7V3M45 64h30M48 38h24M51 20h18"/>
      <path d="M54 72v19m12-19v19M55 47v10m10-10v10M57 25v8m6-8v8"/>
      <circle cx="60" cy="44" r="4" fill="#fff0ad"/><path d="M60 41v3l2 1"/>
      <path d="M232 94q17-22 34 0m-30 0v4m25-4v4M230 102h40m-30 5h18" stroke="#b5c0aa"/>`,
  },
  breda: {
    landmark: 'de spitse toren van de Grote Kerk',
    art: `<path d="M49 98V53h25v45M53 53V36h17v17M56 36V27h11v9" fill="#f6f6eb"/>
      <path d="M54 27l7-19 8 19z" fill="#fff1ae"/><path d="M61 8V3m-4 4h8M47 53h29M51 36h21"/>
      <path d="M56 64v20m11-20v20M58 41v7m6-7v7"/>
      <circle cx="61.5" cy="58" r="4" fill="#fff0ad"/>
      <path d="M74 71l17-18 22 21v24H74z" fill="#f5f5eb"/><path d="M82 79v11m10-13v13"/>`,
  },
  eindhoven: {
    landmark: 'het Evoluon',
    art: `<path d="M53 94l7-20h22l7 20" fill="#eef1e6"/>
      <path d="M25 66q7-25 45-25t45 25" fill="#f5f6ed"/>
      <ellipse cx="70" cy="66" rx="48" ry="9" fill="#fff4c6"/>
      <path d="M27 65q43 8 86 0M70 41v-7m-3 0h6M62 77v13m16-13v13"/>
      <path d="M36 58h68M44 50h52" stroke="#cad2bd"/>
      <path d="M237 98V74h23v24m-20-17h17m-17 7h17" fill="#f1f3e9"/>
      <path d="M247 74V58"/><circle cx="247" cy="56" r="2" fill="#fcbf00" stroke="none"/>`,
  },
  rotterdam: {
    landmark: 'de Erasmusbrug en de skyline',
    art: `<path d="M24 91h93M49 91l20-65 8 40 12 25" fill="none" stroke-width="1.7"/>
      <path d="M69 26L29 91m40-65L41 91m28-65L60 91m9-65L78 91m-1-25 25 25" stroke="#b9c2a9"/>
      <path d="M235 98V61h13v37m5 0V45h14v53" fill="#f0f2e7"/>
      <path d="M237 68h9m-9 8h9m10-24h9m-9 9h9m-9 9h9" stroke="#bdc7ae"/>
      <path d="M26 104h59m154 0h35" stroke="#bcc9b2"/>`,
  },
  groningen: {
    landmark: 'de Martinitoren',
    art: `<path d="M48 98V61h27v37M52 61V42h19v19M55 42V28h13v14" fill="#f4f5e9"/>
      <path d="M55 28l6-12 7 12z" fill="#fff1b7"/>
      <path d="M61 16V9m-3 0h6m-18 52h31M50 42h23M53 28h17"/>
      <circle cx="61" cy="36" r="4" fill="#fff0b0"/>
      <path d="M55 70v17m12-17v17M57 47v9m9-9v9"/>
      <path d="M76 98V77l17-11 14 11v21" fill="#f4f5eb"/>
      <path d="M232 98V82l15-10 15 10v16" fill="#f1f3e7"/>`,
  },
  tilburg: {
    landmark: 'textielfabrieken en industrieel erfgoed',
    art: `<path d="M29 98V68l22-14v14l22-14v14l22-14v44z" fill="#f3f4e8"/>
      <path d="M37 62V26h9v30M35 26h13v5H35z" fill="#fff1bd"/>
      <path d="M40 22q-6-5 0-9m9 9q6-5 0-9" stroke="#c4ccb8"/>
      <path d="M35 78h13v11H35zm21 0h13v11H56zm21 0h13v11H77z" fill="#fff9e0"/>
      <path d="M29 94h63m-52-16v11m22-11v11m21-11v11" stroke="#c2cbb3"/>
      <path d="M237 98V66h23v32m-18-26v20m6-20v20m6-20v20" fill="#f4f5eb"/>`,
  },
  amsterdam: {
    landmark: 'grachtenpanden en een grachtenbrug',
    art: `${canalHouse(26,'step')}${canalHouse(50,'bell')}${canalHouse(74,'gable')}
      <path d="M229 91q22-29 44 0v7h-8q-14-18-28 0h-8z" fill="#f4f5eb"/>
      <path d="M230 87h42m-35-6v8m9-12v7m10-6v7m9-4v8M24 104h62m151 0h35m-29 5h19" stroke="#b8c4ad"/>`,
  },
  arnhem: {
    landmark: 'de John Frostbrug over de Rijn',
    art: `<path d="M21 91h99M27 90q36-70 75 0" fill="none" stroke-width="2"/>
      <path d="M32 82v9m9-23v23m10-35v35m11-40v40m11-38v38m10-30v30m10-16v16M22 96h91" stroke="#bac4ac"/>
      <path d="M31 79q35-55 65 0" fill="none" stroke="#cbd2bf"/>
      <path d="M24 103h64m-53 5h28m176-5h31" stroke="#b9c9af"/>
      <path d="M241 98V77m0 7c-16-8-7-23 0-13 8-14 20 1 0 13" fill="#dfe7d4"/>`,
  },
  zwolle: {
    landmark: 'de Sassenpoort',
    art: `<path d="M35 98V57h17v41m22 0V57h17v41M52 98V67h22v31" fill="#f4f4e8"/>
      <path d="M32 57l12-25 11 25zm39 0 11-25 12 25z" fill="#fff0b4"/>
      <path d="M52 68l11-14 11 14M44 32v-7m38 7v-7M33 58h22m16 0h22"/>
      <path d="M57 98V84q6-12 12 0v14" fill="#fffdf3"/>
      <path d="M41 66v9m5 3v10m33-22v9m5 3v10"/>
      <path d="M231 98V85h33v13m-29-19 12-9 13 9" fill="#f1f4e8"/>`,
  },
  denbosch: {
    landmark: 'de gotische Sint-Janskathedraal',
    art: `<path d="M30 98V74l16-15 14 15 17-23 20 23v24z" fill="#f3f4e9"/>
      <path d="M42 98V49h17v49M45 49V37h11v12M46 37l5-17 5 17z" fill="#f6f5e9"/>
      <path d="M37 97l5-24m18 24-2-24m10 24 2-20m15 20-2-20m13 20-4-20M48 56v11m5-11v11"/>
      <path d="M34 82v10m42-23v17m12-10v16M77 51V41m-4 5h8"/>
      <circle cx="50.5" cy="74" r="4" fill="#fff0b5"/>
      <path d="M235 98q2-18 9-18t9 18" fill="#e5ebdb" stroke="#a1af90"/>`,
  },
  maastricht: {
    landmark: 'de Sint Servaasbrug en de Maas',
    art: `<path d="M24 79h91v18h-7q-9-21-18 0H84q-9-21-18 0H60q-9-21-18 0H24z" fill="#f3f1e3"/>
      <path d="M24 79h91m-88-5h86m-82 0v5m14-5v5m14-5v5m14-5v5m14-5v5m14-5v5"/>
      <path d="M36 73V55l12-11 13 11v18m4 0V60l14-13 14 13v13" fill="#f5f4e8"/>
      <path d="M43 58v7m11-7v7m18-3v6m11-6v6M24 103h71m-62 5h19m14 0h22m150-5h35" stroke="#b8c6af"/>
      <path d="M237 98V70h24v28m-26-28 14-12 14 12" fill="#f3f5e8"/>`,
  },
};

const storefront = `<g transform="translate(30 14.7) scale(.85)">
  <path d="M81 46h138v52H81z" fill="#fff"/>
  <path d="M77 46h146l-9-24H86z" fill="#fcbf00"/>
  <path d="M104 22 99 46m29-24-2 24m25-24v24m23-24 3 24m22-24 5 24" stroke="#fff6d6" stroke-width="11"/>
  <path d="M77 46h146l-9-24H86z" fill="none"/>
  <path d="M143 98V61h25v37" fill="#f5f4e9"/>
  <path d="M92 61h37v24H92zm87 0h28v24h-28z" fill="#fff9e2"/>
  <path d="M147 67v22m16-22v22" stroke="#e2dfcf" stroke-width="2"/>
</g>`;

export function renderCityArt(branchId, city) {
  const scene = cityScenes[branchId];
  const label = scene ? `${city}: winkelillustratie met ${scene.landmark}` : `Winkelillustratie voor ${city}`;
  return `<div class="branch-cover" data-city="${esc(branchId)}" title="${esc(label)}"><svg viewBox="0 0 300 115" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(label)}">
    <g fill="none" stroke="#8e987e" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${scene?.art || ''}</g>
    <path d="M22 98h256" stroke="#d6d8cc" stroke-width="1.4"/>
    <g fill="none" stroke="#31342a" stroke-width="1.7" stroke-linejoin="round">${storefront}</g>
    <path d="M258 98V83m0 6c-12-7-7-19 0-11 7-11 17 1 0 11" fill="#dce5d0" stroke="#79896a" stroke-width="1.3" stroke-linecap="round"/>
    <path d="m246 28 2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fcbf00"/>
  </svg></div>`;
}

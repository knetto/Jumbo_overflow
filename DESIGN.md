# Jumboverflow — ontwerp volgens Jumbo Kompas

Deze versie wordt uitsluitend lokaal ontwikkeld en bekeken op http://localhost:4173. Er is bij deze update niets gepubliceerd.

## Richting

Jumboverflow moet voelen als een stukje jumbo.com voor collega's: dezelfde opbouw, dezelfde componenten en dezelfde toon. Het dashboard begroet je zoals de servicepagina van Jumbo ("Hallo Jesse"), laat je meteen een onderwerp kiezen en toont daarna de kennis van collega's. Alles is gebouwd op de Kompas-tokens die jumbo.com zelf gebruikt.

## Wat we van jumbo.com hebben geanalyseerd

Geraadpleegd op 2 november 2026: de homepage, de servicepagina, de receptenpagina en de 404-pagina van jumbo.com (desktop en mobiel), plus de gepubliceerde stylesheet met de `--kompas-*`-designtokens.

| Onderdeel | Jumbo.com / Kompas | Toegepast in Jumboverflow |
| --- | --- | --- |
| Paginaopbouw | Ruime witte header met een groot logo, een hoog pilvormig zoekveld (50px), profiel-/filiaalknop en gele pilknop, daaronder een rustige horizontale hoofdnavigatie | De drukke bovenbalk is weggelaten zodat de header en navigatie direct en overzichtelijk openen; onder 1024px wordt de navigatie een uitschuifmenu |
| Navigatie | Vette links van 18px zonder losse tellers op desktop, actief = gele balk van 4px | Rustige horizontale balk zonder visuele ruis; in het mobiele menu blijven de tellers zichtbaar |
| Kleur | `#FCBF00`, tekst `#171717`, wit, `#F1F1F1`, rand `#E3E3E3`, hulptekst `#757575`, positief `#00812D` | Alle salie-/olijftinten uit de vorige versie verwijderd en vervangen door deze tokens |
| Zachte vlakken | Bannertinten `#FFF9E5`, `#FFF0E5`, `#E5F6EB`, `#E8F6FB`, `#F4E8F2`, `#FCE5E6` | Onderwerpen, avatars, templatecovers en herobanners |
| Typografie | Jumbo The Sans; koppen in Black; mixkoppen (regular + Black); gele, handgetekende markering onder een woord; Kalam voor "Hallo" en "Tip!" | Zelfde schaal (body 16px, intro 17–18px, koppen 26–42px); eigen getekende markering; Kalam lokaal meegeleverd |
| Knoppen | Pil (radius 200px), 48px hoog, Bold 18px; primair geel (hover `#FDCC33`), secundair wit met rand `#9E9E9E` | Alle knoppen omgezet; kleine variant 40px/16px |
| Chips | Pil met grijze rand, zwart bij selectie | Filters, type-keuze in formulieren, zoekvoorbeelden |
| Panelen | Wit, 1px `#E3E3E3`, radius 8px, optionele gele accentlijn van 3px | Kaarten, zijkolom, antwoordformulier, templatebanner en vensters |
| Herobanners & onderwerpstrook | Grote afgeronde herokaarten (zachte tint links, geel boogvlak met illustratie rechts) met direct daaronder een horizontale rij ronde icoon-snelkoppelingen | Eén krachtige herosectie ("Hallo Jesse! Samen maken we het werk slimmer" + "Idee van de week") gevolgd door de 6 onderwerpen op één rustige horizontale rij zonder hokjesgrid |
| Meldingen | Notificatie radius 8 (note `#FFF9E5`, positief `#E5F6EB`); snackbar `#464646`, radius 4, groen icoon | Tips, privacymelding en toasts |
| Dialoog | Radius 8, gele onderlijn, gele pilknoppen; mobiel als bottom sheet | Alle vensters |
| Footer | Donker (`#232323`), "We helpen je graag!" met portret, "Tip!", linkkolommen, juridische regel, witte onderstrook | Volledig nagebouwd met eigen inhoud |
| 404 / leeg | Geel tekstballonnetje "Oh oh!", Black-kop, "Hoe kunnen we je verder helpen?" met pilknoppen | Lege staten, zoekresultaten zonder treffers en een nieuwe 404-pagina |
| Focus | 2px `#0A4FFF`, 4px afstand | Overal toegepast |
| Toon | "Hallo!", "We helpen je graag!", "Tip!", kort, warm, je-vorm, "Bekijk …" | Copy herschreven; nieuwe "Onze 5 afspraken" in de stijl van De 7 Zekerheden |

## UX-verbeteringen

- Zoeken staat op elk scherm in de header, ook op mobiel (volle breedte, zoals jumbo.com).
- Onderwerpen staan direct in beeld; de gekozen tegel krijgt een gele accentlijn.
- Kleinste tekst is nu 12px (alleen USP-balk en juridische regel); metadata 14px, inhoud 16–18px. In de vorige versie stond veel tekst op 9–11px.
- Contrast: hulptekst `#757575` op wit; geen lichtgroene tekst meer.
- Kruimelpaden zijn klikbaar; een klik op de huidige pagina laadt die opnieuw en wist filters.
- Een nieuwe zijkolom "Kun jij helpen?" toont onbeantwoorde vragen.
- Stemmen, bewaren, delen en oplossen staan in één actieregel onder een bijdrage.
- Een lege reactielijst nodigt uit om te reageren; het formulier laat zien namens wie je reageert.
- Het menu op mobiel heeft een sluitknop, focusbeheer en blijft onbereikbaar voor het toetsenbord zolang het dicht is.
- Vensters worden op mobiel een bottom sheet met een vaste actiebalk.
- Een 404-pagina met vervolgstappen in plaats van een stille terugval.
- Alle templateonderwerpen zijn filterbaar (eerder 5 van de 6).

## Beeld

- [public/assets/colleagues-hero.png](public/assets/colleagues-hero.png): bestaande illustratie, nu in de promotegel en in de footer.
- De stadsillustraties in [public/city-art.js](public/city-art.js) gebruiken Kompas-grijzen in plaats van salie.
- Tekstballon-smiley, checklist en markering zijn eigen SVG/CSS-tekeningen. Er zijn geen beeldbestanden van Jumbo gekopieerd, behalve het logo en de lettertypen die er al in zaten.

## Motion

GSAP 3.15 wordt lokaal geladen. Dropdowns openen in 260 ms met `back.out(1.05)`, vensters met een korte fade en knoppen en chips geven een lichte klikfeedback. Navigatie-onderlijnen en pijlen bewegen in 150–200 ms. Bij `prefers-reduced-motion: reduce` vallen alle animaties weg.

## Bestanden

- `public/styles.css`: tokens, basis, shell, componenten en pagina's (vervangt `styles.css` en `design.css`).
- `public/interactions.css`: dropdowns in Kompas-stijl.
- `public/search.css`: zoekband, chips en resultaten.
- `public/assets/Kalam-Bold-latin.woff2`: Kalam Bold, SIL Open Font License 1.1 (Indian Type Foundry).

Dit zijn ontwerpinterpretaties voor een studieconcept. Het is geen officiële Jumbo-dienst. Merkmiddelen blijven eigendom van hun rechthebbenden.

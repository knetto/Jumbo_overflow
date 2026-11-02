# Jumboverflow

Een functioneel kennisplatform voor Jumbo-filialen, met een interface die is gebaseerd op de actuele Jumbo-webhuisstijl. Zelfstandig studieconcept; geen officiële Jumbo-dienst.

Dit project wordt lokaal ontwikkeld en bekeken op **http://localhost:4173**. Een commit of synchronisatie met GitHub publiceert de website niet. De vormgeving en gebruikte ontwerpbronnen staan in [DESIGN.md](DESIGN.md).

## Starten

Node.js 22.13 of hoger is nodig. Er is geen frontend-build nodig voor lokaal gebruik.

```sh
npm install
npm run dev
```

Open http://localhost:4173. De lokale server gebruikt SQLite in `.data/jumbooverflow.sqlite` en voert nog niet toegepaste migraties automatisch uit. Sluit de server met Ctrl+C. Een nieuwe browsercontext heeft een eigen lokaal demo-account; alle contexts delen bijdragen. De lokale cookie is uitsluitend voor ontwikkeling en wordt nooit gebruikt voor de online authenticatie.

## Wat werkt

- 24 oorspronkelijke vragen/praktijkhacks, inhoudelijke antwoorden, 12 templates en 12 fictieve filiaalprofielen.
- Zoeken met losse woorden of hele zinnen door vragen, praktijkhacks, antwoorden en volledige templates. Met Nederlandse verwante begrippen, woordvarianten, kleine typefouten, relevantiesortering en gemarkeerde fragmenten. Zoekresultaten zijn te filteren per type, onderwerp en filiaal; een zoeklink bewaart de zoekzin bij herladen.
- Het kennisplein filteren per onderwerp, type en filiaal en sorteren op populariteit, nieuw en onbeantwoord.
- Vragen en praktijkhacks plaatsen, reageren, stemmen en een antwoord accepteren. Alleen de auteur kan een eigen vraag oplossen of een antwoord markeren.
- Een template bekijken, bewaren, als echt Markdown-/CSV-/JSON-/tekstbestand downloaden, aanpassen (forken) en opnieuw delen. Tekstbestanden uploaden tot 500 KB en 80.000 tekens.
- Filialen volgen, persoonlijke bewaarde items en een aanpasbaar profiel.
- Geaggregeerde praktijkinzichten en een CSV-export zonder auteurs en filiaalnamen.
- Responsieve navigatie zoals jumbo.com: horizontale hoofdnavigatie op desktop, uitschuifmenu met focusbeheer op tablet en mobiel, zoekveld altijd in beeld. Toetsenbordbediening, focusvasthouding in vensters, bottom sheets op mobiel en verminderde animatie bij de bijbehorende systeeminstelling.
- "Onze 5 afspraken" voor de community en een 404-pagina met vervolgstappen.
- Eigen Jumbo-dropdowns voor filters, sortering, onderwerpen, filiaal en rol; met toetsenbordnavigatie, zoeken door te typen, automatisch omhoog uitklappen en een subtiele GSAP-animatie. GSAP wordt lokaal geladen, zonder CDN.
- Een eigen stadsillustratie voor elk van de twaalf filialen.

## Opslag en toegang

De zoekfunctie draait volledig lokaal in de browser; zoekvragen en inhoud gaan niet naar een externe zoek- of AI-dienst. `public/search-engine.js` weegt titels, tags, inhoud en antwoorden, met een vaste woordenlijst voor winkelonderwerpen zoals inwerken, uitval, FIFO en overdracht. Het is een lokale zoekmachine, geen taalmodel: vrije zinnen werken het beste wanneer de situatie herkenbare winkelbegrippen bevat. Nieuwe bijdragen, reacties en aangepaste templates zijn direct doorzoekbaar. `public/search-view.js` en `public/search.css` verzorgen de zoekinterface.

De lokale versie gebruikt SQLite en een ontwikkelcookie per browsercontext. De code bevat daarnaast een optionele Cloudflare Worker met D1-database; in die omgeving verzorgt Sites de toegang via ChatGPT. Er wordt niet automatisch gedeployd. Eigenaarcontroles en validatie gebeuren op de server. Een profielrol is een omschrijving en verleent geen aanvullende rechten.

De eerste inhoud is fictieve demodata, eenmalig ingevoegd buiten de schemamigratie. Nieuwe bijdragen worden gedeeld opgeslagen. Stemmen zijn uniek per gebruiker en bijdrage. Bewaarde items, gevolgde filialen en het profiel zijn persoonlijk. De inzichtenpagina presenteert thema's en totalen; dit is geen afzonderlijk beveiligd hoofdkantoorportaal of volledig anonimiseringssysteem voor de rest van de community.

Wanneer de API niet beschikbaar is, werkt de interface met een herkenbare lokale demo in localStorage. De uitleg in de app vermeldt de actieve opslagvorm. Er is geen realtime websocket; open pagina's verversen de gedeelde gegevens elke 45 seconden wanneer geen formulier of venster in gebruik is. Herladen haalt direct de laatste gegevens op.

## Huisstijl en bronnen

Geraadpleegd op 2 november 2026:

- [Jumbo.com](https://www.jumbo.com/): logo, publiek aangeboden Jumbo The Sans Regular/Bold/Black en actuele Kompas CSS-tokens. Hoofdkleur `#FCBF00`, tekst `#171717`, wit `#FFFFFF`, ondersteunende achtergrond `#F1F1F1`, subtiel geel `#FFF9E5`, positief groen `#00812D`, rand `#E3E3E3`, hulptekst `#757575`, focus `#0A4FFF`. De opbouw (USP-balk, header met pilvormig zoekveld, horizontale navigatie, servicetegels, promotegels, donkere footer), pilknoppen, chips, panelen met gele accentlijn, snackbar en de "Oh oh!"-pagina zijn op jumbo.com bestudeerd. Zie [DESIGN.md](DESIGN.md) voor de volledige vergelijking.
- [Jumbo Kompas — Typography](https://design.jumbo.com/latest/foundations/typography-yLZcyYAu): Jumbo The Sans voor digitale toepassingen en Black voor nadruk in koppen.
- Kalam Bold voor de handgeschreven accenten ("Hallo", "Tip!"), zoals jumbo.com die gebruikt. Lokaal meegeleverd in `public/assets/Kalam-Bold-latin.woff2` onder de SIL Open Font License 1.1.
- [Jumbo Styleguide](https://assets.website-files.com/5e68bd1f74a45a08affa8897/627a1e3d0c1c314b87ddcb63_JUMBO_Styleguide_A0.pdf): aanvullende merkcontext; de actuele digitale bron krijgt voorrang op oudere print-/socialregels.
- [Jumbo huisstijlhandboek 2019](https://assets.website-files.com/5e68bd1f74a45a08affa8897/621c8f811a15cc5f005ae0e7_Jumbo%20huisstijl%20handboek%202019.pdf): historische vergelijking voor kleur en fontgebruik.

De pagina-indeling, illustratie en interacties zijn voor dit concept gemaakt. De voorbeeldberichten zijn zelf geschreven; er zijn geen Reddit-berichten of persoonsgegevens van echte medewerkers gekopieerd. De merkmiddelen blijven toebehoren aan hun rechthebbenden.

## Controleren en bouwen

```sh
npm run check
npm test
npm run build
node scripts/validate-artifact.mjs
```

Voor de browsertests moet de ontwikkelserver actief zijn. Tests gebruiken de geïnstalleerde Chrome-browser via Playwright. De API-tests gebruiken een lege SQLite-database in geheugen en controleren gedeelde opslag, unieke stemmen, eigenaarschap, isolatie van persoonlijke voorkeuren, invoervalidatie en forks. De browsertests controleren ook twee onafhankelijke accounts, downloads, verversen en mobiele layouts.

`public/` bevat de interface en lokale merkassets. `worker/api.js` bevat de gedeelde API. `db/schema.ts` en `drizzle/` bevatten het schema en de gegenereerde migratie. `scripts/build.mjs` bundelt de bestanden zonder externe runtime-imports naar `dist/server/index.js`. De hostingmanifest staat in `.openai/hosting.json`. Sites past productiemigraties bij publicatie toe. Gebruik bij schemawijzigingen `npm run db:generate`; wijzig geen al toegepaste migratie.

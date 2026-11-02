# Projectafspraken

- Werk lokaal en houd de preview bereikbaar op `http://localhost:4173` wanneer de gebruiker de app wil bekijken.
- Publiceer of deploy niet zonder een nieuwe, expliciete instructie van de gebruiker. Een commit of GitHub-push is geen opdracht om de website te publiceren.
- De GitHub-repository voor dit project is `https://github.com/knetto/Jumbo_overflow.git`.
- Behoud de Jumbo-huisstijl: Jumbo The Sans, `#FCBF00`, donkere tekst, wit en rustige ondersteunende tinten.
- `public/` bevat de interface, `worker/api.js` de API en `server.mjs` de lokale server met SQLite. Bewaar geen lokale database, credentials, `node_modules` of testuitvoer in Git.
- Start de preview met `npm run dev`. Voer voor functionele wijzigingen `npm run check` en de relevante tests uit. Voor de browsertests moet de preview actief zijn en Chrome geïnstalleerd zijn.

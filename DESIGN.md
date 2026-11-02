# JumboOverflow — ontwerpupdate

Deze versie wordt uitsluitend lokaal ontwikkeld en bekeken op http://localhost:4173. Er is bij deze update niets gepubliceerd.

## Richting

Een rustige, herkenbare Jumbo-werkplek waarin collega's praktische kennis vinden. Het dashboard geeft eerst context, daarna duidelijke onderwerpen en vervolgens inhoud. Een bijdrage toont de collega, de vraag of aanpak en de acties. Het stemmen staat als ‘Handig’ onder de inhoud; de verticale stemkolom en filiaalranglijst zijn verwijderd uit de feed.

Jumbo-geel `#FCBF00`, bijna zwart `#171717` en Jumbo The Sans Regular, Bold en Black vormen de basis. Witruimte, lichte neutrale oppervlakken, beperkt kleurgebruik, consistente iconen en duidelijk contrast ondersteunen de inhoud. De templatebibliotheek gebruikt documentvoorbeelden, filialen herkenbare winkelillustraties en het kennisplein een eigen illustratie van twee collega's.

## Bekeken referenties

- [Jumbo Kompas — Typography](https://design.jumbo.com/latest/foundations/typography-yLZcyYAu): eigen digitale merktypografie en nadruk met Black.
- [Slite](https://slite.com/): kennis als toegankelijke, geordende werkplek. Vertaald naar onderwerpingangen en minder concurrerende navigatie.
- [Guru](https://www.getguru.com/): herbruikbare, herkenbare kennisbijdragen. Vertaald naar rustige contentkaarten met een duidelijke herkomst.
- [Linear](https://linear.app/features): consistente navigatie en visuele hiërarchie. Gebruikt als productreferentie, zonder de donkere merkstijl over te nemen.
- [Instrument — Work](https://www.instrument.com/work): samenhang tussen merk, digitaal product en beeld. Gebruikt als referentie voor een eigen visuele richting.

Dit zijn ontwerpinterpretaties voor dit project, geen overgenomen schermen of claims over hun interne apps.

## Illustratie

Bestand: [public/assets/colleagues-hero.png](public/assets/colleagues-hero.png).

Gemaakt met de ingebouwde imagegen-tool; transparante achtergrond. De uiteindelijke illustratie is in de lokale projectmap opgeslagen. De kleine checklist- en winkelillustraties zijn native HTML/CSS/SVG, zodat ze scherp blijven op elk scherm.

De uiteindelijke prompt voor de gekozen illustratie:

> Restyle this image completely as a premium ultra-minimal FLAT VECTOR EDITORIAL brand illustration for a contemporary professional Dutch supermarket web application. Preserve the idea of TWO ADULT colleagues sharing knowledge, the checklist and one small grocery shelf. REDUCE DETAIL drastically: simplify the shelf to only six geometric grocery product shapes, remove the large trolley entirely, make the bodies graceful angular paper-cut silhouettes with simple mitten hands, extremely minimal facial details (tiny eye dots and simple curved smiles), no large cartoon eyes, no detailed hair strands. One black polo uniform, one white shirt with a yellow vest. One colleague darker brown skin and one warm light skin. Strictly use crisp solid flat shapes with ZERO gradients, ZERO shading, ZERO glow, ZERO blur, ZERO shadow and NO texture. Thin charcoal contours only where useful. Restrained four colors: charcoal #171717, warm off-white #FFFDF5, Jumbo yellow #FCBF00, sage #DDE4D5 plus two natural skin tones. Plenty of genuinely transparent space around the entire freestanding illustration. Square compact composition with the two colleagues prominent, full bodies inside frame, small shelf beside them. This is a clean sophisticated abstract editorial illustration, NOT a children's cartoon and NOT a polished 3D render. No words, no letters, no logos, no background, no decorative floating UI.

## Controle

### Dropdowns en beweging

Alle enkelvoudige selecties zijn vervangen door eigen dropdowns in de Jumbo-stijl. Een verborgen native select behoudt de formulierwaarde; de zichtbare combobox en listbox ondersteunen pijltjes, Home/End, typen om te zoeken, Enter, Tab en Escape. Het menu wordt in de bovenste browserlaag getoond en klapt waar nodig omhoog, zodat het binnen het scherm en buiten de afsnijding van een dialoog blijft.

De lokaal meegeleverde GSAP 3.15 verzorgt een opening van 260 ms met `back.out(1.05)`, 5 pixels verplaatsing en een startschaling van 0.985. Het effect is bewust klein. Dialogen verschijnen met een korte fade; knoppen geven een lichte klikfeedback. Bij `prefers-reduced-motion: reduce` worden deze animaties overgeslagen.

Referenties: [GSAP easing](https://gsap.com/docs/v3/Eases/), [GSAP fromTo](https://gsap.com/docs/v3/GSAP/gsap.fromTo%28%29/) en [W3C select-only combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/).

De twaalf filiaalillustraties hebben nu elk een eigen stadsaccent in [public/city-art.js](public/city-art.js): de Grote Kerk van Dordrecht, Domtoren, Grote Kerk van Breda, Evoluon, Erasmusbrug, Martinitoren, Tilburgse textielfabrieken, Amsterdamse grachtenpanden, John Frostbrug, Sassenpoort, Sint-Jan en Sint Servaasbrug. De winkel, lijnvoering en het kleurenpalet blijven gemeenschappelijk. Het gaat om symbolische stadsportretten. De SVG's blijven scherp op mobiele schermen en hebben elk een beschrijvende toegankelijke naam.

Enkele geraadpleegde stadsreferenties: [Grote Kerk Dordrecht](https://indordrecht.nl/locaties/grote-kerk-dordrecht/), [Sassenpoort](https://www.visitzwolle.com/wat-te-doen/dagje-uit/47401-sassenpoort/) en [Sint Servaasbrug](https://www.visitmaastricht.com/nl/locaties/1335944557/sint-servaasbrug).

De bestaande browsertests controleren vragen, reacties, stemmen, zoeken, templates aanpassen en downloaden, uploaden, geaggregeerde exports en delen tussen twee accounts. De nieuwe vormgeving is daarnaast visueel bekeken op desktop en mobiel. Backend en gegevensmodel zijn bij deze ontwerpupdate ongewijzigd.

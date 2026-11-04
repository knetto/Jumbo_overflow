import { ANONYMOUS_AUTHOR, contributionIdentity } from './identity.js';

// Local retrieval: weighted words, Dutch inflections, small typos and shop-floor concepts.
// No external service receives search terms or community content.
const stopwords = new Set(('de het een en of maar met voor van in op aan bij om te tot uit is zijn was wordt worden heeft hebben ik jij je jullie wij we mijn ons onze ze zij hun er hier daar dit dat die deze welke wie wat hoe waarom wanneer waar kan kunnen wil willen moet moeten zou zouden als dan ook nog al niet geen wel even echt iets veel meer minder naar door over zoek zoeken graag help hulp tips tip handige handig aanpak doen gaat gaan krijg krijgen laat laten zorgen zorgt ervoor werkt werken weten weet steeds blijft komt please how can i my we our the a an to for with and do does me need').split(' '));

export function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('nl').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
const words = value => normalize(value).split(' ').filter(Boolean);
const stem = word => word.length > 5 ? word.replace(/(?:eren|ers|en|es|s|e)$/, '') : word.length > 4 ? word.replace(/s$/, '') : word;

const concepts = [
  ['inwerken','Inwerken & begeleiding',['inwerken','inwerkboek','inwerkchecklist','onboarding','starter','starters','beginners','eerste dag','eerste werkdag','eerste week','nieuwe collega','nieuwe medewerker','nieuw personeel','new employee','training']],
  ['buddy','Samen leren',['buddy','begeleiding','begeleiden','duo','apprentice','mentoring','meekijken','voordoen','samen oefenen']],
  ['motivatie','Motivatie & focus',['motivatie','gemotiveerd','ongemotiveerd','motiveren','focus','concentratie','afgeleid','kletsen','kletst','praten','niks doen','niet luisteren','niet meewerken','niet afkrijgen','jongeren','13 jarigen','jonge vulploeg']],
  ['bezetting','Bezetting & uitval',['ziekmelding','ziek','zieke','uitval','vallen uit','personeelstekort','onderbezetting','onderbezet','tekort','te weinig mensen','te weinig personeel','te weinig medewerkers','iemand valt uit','ziek gemeld','belpool','staff shortage','understaffed']],
  ['rooster','Roosters & beschikbaarheid',['rooster','roosteren','roosters','beschikbaarheid','personeelsplanning','diensten plannen','dienstplanning','scheduling']],
  ['overdracht','Overdracht',['overdracht','overdragen','overdrachtsbord','overdrachtsbericht','overdrachtstemplate','groepschat','groepsapp','communicatie','informatie delen','volgende ploeg','volgende dienst','handover']],
  ['houdbaarheid','Houdbaarheid & FIFO',['fifo','houdbaarheid','houdbaarheidscontrole','houdbaar','datumcontrole','tht','tgt','over datum','verlopen','bedorven','derving','voedselverspilling','expiry','expired']],
  ['magazijn','Magazijn & restanten',['magazijn','rolcontainer','rolcontainers','restanten','restjes','halflege','opslag','warehouse']],
  ['vracht','Vracht & vullen',['vracht','vullen','bijvullen','vultaken','vakvullen','aanvullen','schappen vullen','shelf stocking']],
  ['sluiten','Winkel afsluiten',['sluiten','sluitronde','sluiting','afsluiten','afsluit','laatste ronde','closing']],
  ['veiligheid','Veilig werken',['veiligheid','veilig','onveilig','nooduitgangen','looproutes','dozen','karton','afval','safety']],
  ['scanner','Scanners & apparatuur',['scanner','scanners','handscanner','handscanners','apparaten','apparatuur','opladen','opgeladen','batterij','accu','defect','storing']],
  ['zelfscan','Zelfscan',['zelfscan','zelfscankassa','zelfscankassas','selfcheckout','self checkout']],
  ['klantvragen','Klanten helpen',['klantvragen','klanten helpen','klant helpen','klantvraag','servicepunt','wegwijs','producten vinden','product vinden','customer questions']],
  ['feestdagen','Feestdagen & piekdrukte',['december','decemberdrukte','decemberplanning','kerst','kerstmis','kerstdrukte','feestdagen','pasen','piekweek','piekweken','piekmomenten','drukke week','christmas']],
  ['acties','Acties & presentatie',['actiewissel','actie','acties','actiematerialen','actiepresentatie','promotie','aanbiedingen']],
  ['dagstart','Dagstart',['dagstart','startmoment','starten dienst','begin dienst','standup','briefing']],
  ['feedback','Feedback & terugkijken',['feedback','evaluatie','evalueren','terugblik','terugkijken','eindgesprek']],
  ['verbeteren','Ideeën uit de winkel',['verbeteren','verbeteridee','verbeterbord','ideeen','idee','eigenaarschap','terugkoppeling']],
].map(([id,label,aliases])=>({id,label,aliases:aliases.map(normalize)}));

function findConcepts(text, fuzzy=false) {
  const padded = ` ${normalize(text)} `;
  const tokens=fuzzy?words(text).filter(t=>t.length>=6&&!stopwords.has(t)):[];
  return concepts.filter(c=>c.aliases.some(alias=>padded.includes(` ${alias} `)||(fuzzy&&alias.length>=6&&!alias.includes(' ')&&tokens.some(t=>distance(t,alias,1)<=1))));
}

// Bounded Damerau-Levenshtein: includes swapped letters (e.g. overdarcht).
function distance(a, b, limit) {
  if (Math.abs(a.length-b.length)>limit) return limit+1;
  let previousPrevious, previous=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    const current=[i];let minimum=i;
    for(let j=1;j<=b.length;j++){
      current[j]=Math.min(current[j-1]+1,previous[j]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));
      if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])current[j]=Math.min(current[j],previousPrevious[j-2]+1);
      minimum=Math.min(minimum,current[j]);
    }
    if(minimum>limit)return limit+1;
    previousPrevious=previous;previous=current;
  }
  return previous[b.length];
}

function similarity(query, term) {
  if(query===term)return 1;
  if(query.length>=4&&stem(query)===stem(term))return .9;
  if(query.length>=4&&term.startsWith(query))return .78;
  if(stem(query).length>=6&&term.startsWith(stem(query)))return .76;
  if(query.length<4)return 0;
  const limit=query.length>=8?2:1;
  const d=distance(query,term,limit);
  return d<=limit ? (d===1?.72:.52) : 0;
}

function makeDocument(item, kind, metadata) {
  if (item.anonymous) item = { ...item, ...contributionIdentity(null, true) };
  const branch=metadata.branches?.find(b=>b.id===item.branch);
  const category=metadata.categories?.find(c=>c.id===item.category);
  const fields=[
    {text:item.title,weight:6,label:'Titel'},
    {text:(item.tags||[]).join(' '),weight:5,label:'Onderwerp'},
    {text:item.body||item.description,weight:3,label:kind==='template'?'Beschrijving':'Bijdrage'},
    {text:kind==='template'?'template templates sjabloon sjablonen':kind==='hack'?'praktijkhack praktijkhacks hack hacks':'vraag vragen',weight:3,label:'Soort'},
    {text:[item.author,branch?.city,branch?.name,branch?.address].filter(Boolean).join(' '),weight:4,label:'Collega & filiaal'},
    {text:category?.name,weight:1,label:'Categorie'},
    ...(kind==='template'?[{text:item.content,weight:2,label:'In het template'}]:(item.answers||[]).map(a=>({text:a.body,weight:a.accepted?2.8:2.3,label:`Antwoord van ${a.anonymous?ANONYMOUS_AUTHOR:a.author}`}))),
  ].filter(f=>f.text).map(f=>({...f,terms:new Set(words(f.text)),concepts:findConcepts(f.text)}));
  return {item,kind,fields};
}

/** Search all current data, including newly created answers and forked templates. */
export function searchKnowledge(state, query, metadata={}) {
  const text=normalize(String(query).slice(0,400));
  const tokens=[...new Set(words(text).filter(w=>w.length>1&&!stopwords.has(w)))].slice(0,32);
  const queryConcepts=findConcepts(text,true);
  if(!tokens.length&&!queryConcepts.length)return {results:[],concepts:[],tokens:[]};
  const documents=[...(state.posts||[]).map(p=>makeDocument(p,p.type,metadata)),...(state.templates||[]).map(t=>makeDocument(t,'template',metadata))];
  const vocabulary=new Set(documents.flatMap(d=>d.fields.flatMap(f=>[...f.terms])));
  const matches=new Map(tokens.map(token=>[token,[...vocabulary].map(term=>[term,similarity(token,term)]).filter(([,s])=>s>0)]));
  // Rare terms should carry more weight than ubiquitous words such as 'collega'.
  const idf=new Map(tokens.map(token=>{
    const frequency=documents.filter(d=>d.fields.some(f=>f.terms.has(token))).length;
    return [token,1+Math.log(1+documents.length/(1+frequency))];
  }));
  const totalWeight=tokens.reduce((sum,t)=>sum+idf.get(t),0);
  const results=[];
  for(const doc of documents){
    let score=0,coverage=0;const fieldScores=new Map(),matchedTerms=new Set();
    for(const token of tokens){
      let best=0,quality=0;
      for(const field of doc.fields){
        let fieldBest=0;
        for(const [term,strength] of matches.get(token))if(field.terms.has(term)){
          fieldBest=Math.max(fieldBest,strength);matchedTerms.add(term);
        }
        if(fieldBest){
          const value=fieldBest*field.weight*idf.get(token);
          best=Math.max(best,value);quality=Math.max(quality,fieldBest);
          fieldScores.set(field,(fieldScores.get(field)||0)+value);
        }
      }
      score+=best;coverage+=quality*idf.get(token);
    }
    const related=queryConcepts.filter(c=>doc.fields.some(f=>f.label!=='Categorie'&&f.concepts.includes(c)));
    for(const concept of related){
      let best=0;
      for(const field of doc.fields){
        if(field.label==='Categorie'||!field.concepts.includes(concept))continue;
        const value=field.weight*2.6;
        best=Math.max(best,value);fieldScores.set(field,(fieldScores.get(field)||0)+value);
        for(const term of field.terms)if(concept.aliases.includes(term))matchedTerms.add(term);
      }
      score+=best;
    }
    const ratio=totalWeight?coverage/totalWeight:0;
    if(queryConcepts.length&&!related.length&&ratio<.85)continue;
    // A lone incidental word in a long question is insufficient evidence.
    if(!related.length&&(ratio<.38||score<5))continue;
    if(!score)continue;
    score*=.5+ratio*.7+(queryConcepts.length?related.length/queryConcepts.length*.55:0);
    if(tokens.length&&doc.fields.slice(0,3).some(f=>normalize(f.text).includes(text)))score+=22;
    const wantsTemplate=tokens.some(t=>['template','templates','sjabloon','sjablonen'].includes(t));
    if(wantsTemplate&&doc.kind==='template')score+=16;
    if(tokens.includes('vraag')&&doc.kind==='question')score+=8;
    // Prefer general advice over a specialist subtopic the user did not ask for.
    if(queryConcepts.length){
      const extraTopics=doc.fields[0].concepts.filter(c=>!queryConcepts.includes(c)).length;
      score*=Math.pow(.8,extraTopics);
    }
    if(!wantsTemplate&&doc.kind!=='template')score+=.5;
    // Votes only break close matches; relevance always determines the order.
    score+=Math.log1p(Math.max(0,Number(doc.item.votes)||Number(doc.item.downloads)||0))*.08;
    const contentFields=doc.fields.filter(f=>['Bijdrage','Beschrijving','In het template'].includes(f.label)||f.label.startsWith('Antwoord van'));
    const source=contentFields.reduce((best,f)=>(fieldScores.get(f)||0)>(fieldScores.get(best)||0)?f:best,contentFields[0]);
    const snippetText=doc.item.format==='CSV'&&source?.label==='In het template'?source.text.replace(/,+/g,' · '):source?.label==='In het template'?source.text.replace(/^#{1,6}\s+/gm,'').replace(/^- \[[ x]\] /gm,''):source?.text;
    results.push({item:doc.item,kind:doc.kind,score,concepts:related.map(c=>c.label),terms:[...matchedTerms],snippet:makeSnippet(snippetText||doc.item.title,matchedTerms),source:source?.label||'Titel'});
  }
  results.sort((a,b)=>b.score-a.score||String(a.item.id).localeCompare(String(b.item.id)));
  return {results,concepts:queryConcepts.map(c=>c.label),tokens};
}

function makeSnippet(text, terms, length=230) {
  const clean=String(text).replace(/\s+/g,' ').trim();
  // Locate an actual matched word; snippets keep original spelling and punctuation.
  let index=-1;
  for(const match of clean.matchAll(/[\p{L}\p{N}]+/gu))if(terms.has(normalize(match[0]))){index=match.index;break;}
  let start=Math.max(0,index-65);
  if(start>0){const boundary=clean.indexOf(' ',start);start=boundary<0?start:boundary+1;}
  let end=Math.min(clean.length,start+length);
  if(end<clean.length){const boundary=clean.lastIndexOf(' ',end);if(boundary>start)end=boundary;}
  return `${start?'… ':''}${clean.slice(start,end)}${end<clean.length?' …':''}`;
}

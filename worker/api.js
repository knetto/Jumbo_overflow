import { createSeed, categories, branches } from '../public/data.js';
import { contributionIdentity } from '../public/identity.js';

class ApiError extends Error { constructor(message,status=400){super(message);this.status=status;} }
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const safeId=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(value);
function textField(value,min,max,label){if(typeof value!=='string'||value.trim().length<min||value.length>max)throw new ApiError(`${label}: gebruik ${min} tot ${max} tekens.`);return value.trim();}
function validateCategory(value){if(!categories.some(c=>c.id===value))throw new ApiError('Kies een geldig onderwerp.');return value;}
function validateId(value){if(!safeId(value))throw new ApiError('Ongeldige verwijzing.');return value;}
function identity(profile,anonymous){if(anonymous!==undefined&&typeof anonymous!=='boolean')throw new ApiError('Kies of je anoniem wilt plaatsen.');return contributionIdentity(profile,anonymous===true);}
function defaults(){const s=createSeed();return {profile:s.profile,saved:s.saved,savedTemplates:s.savedTemplates,followedBranches:s.followedBranches,followedCategories:[],templateDownloads:[]};}
async function ensureSeed(db){
  if(await db.prepare('SELECT id FROM records WHERE id = ?').bind('seed-v1').first())return;
  const seed=createSeed();const rows=[];
  for(const p of seed.posts){const {answers,...data}=p;rows.push([p.id,'post',JSON.stringify(data),p.createdAt,null]);for(const a of answers)rows.push([a.id,'answer',JSON.stringify(a),a.createdAt,p.id]);}
  for(const t of seed.templates)rows.push([t.id,'template',JSON.stringify(t),t.createdAt,t.parentId]);
  rows.push(['seed-v1','meta','{}',Date.now(),null]);
  await db.batch(rows.map(r=>db.prepare('INSERT OR IGNORE INTO records (id,kind,owner_id,data,created_at,parent_id) VALUES (?, ?, ?, ?, ?, ?)').bind(r[0],r[1],'seed',r[2],r[3],r[4])));
}
async function userSettings(db,userId){const row=await db.prepare('SELECT data FROM settings WHERE user_id = ?').bind(userId).first();return row?JSON.parse(row.data):defaults();}
async function owned(db,recordId,userId,kind){const row=await db.prepare('SELECT * FROM records WHERE id = ?').bind(validateId(recordId)).first();if(!row||row.kind!==kind)throw new ApiError('Deze bijdrage is niet gevonden.',404);if(row.owner_id!==userId)throw new ApiError('Alleen de auteur kan dit aanpassen.',403);return row;}
async function getRecord(db,recordId,kind){const row=await db.prepare('SELECT * FROM records WHERE id = ?').bind(validateId(recordId)).first();if(!row||row.kind!==kind)throw new ApiError('Deze bijdrage is niet gevonden.',404);return row;}
function insertRecord(db,recordId,kind,userId,data,parentId=null){validateId(recordId);return db.prepare('INSERT INTO records (id,kind,owner_id,data,created_at,parent_id) VALUES (?, ?, ?, ?, ?, ?)').bind(recordId,kind,userId,JSON.stringify(data),data.createdAt,parentId);}

export async function readState(db,userId){
  await ensureSeed(db);
  const [recordsResult,allVotes,myVotes,downloadCounts,preferences]=await Promise.all([
    db.prepare("SELECT * FROM records WHERE kind IN ('post','answer','template') ORDER BY created_at DESC").all(),
    db.prepare('SELECT target_id, COUNT(*) AS count FROM votes GROUP BY target_id').all(),
    db.prepare('SELECT target_id FROM votes WHERE user_id = ?').bind(userId).all(),
    db.prepare('SELECT target_id, COUNT(*) AS count FROM downloads GROUP BY target_id').all(),
    userSettings(db,userId),
  ]);
  const voteCounts=Object.fromEntries(allVotes.results.map(r=>[r.target_id,Number(r.count)]));
  const downloadMap=Object.fromEntries(downloadCounts.results.map(r=>[r.target_id,Number(r.count)]));
  const docs=recordsResult.results.map(r=>{const data=JSON.parse(r.data);return {...data,...(data.anonymous===true?contributionIdentity(null,true):{}),id:r.id,own:r.owner_id===userId,_kind:r.kind,_parent:r.parent_id};});
  const posts=docs.filter(r=>r._kind==='post').map(p=>{const {_kind,_parent,...post}=p;return {...post,votes:post.votes+(voteCounts[p.id]||0),answers:docs.filter(a=>a._kind==='answer'&&a._parent===p.id).map(a=>{const {_kind,_parent,...answer}=a;return {...answer,votes:answer.votes+(voteCounts[a.id]||0)};})};});
  const templates=docs.filter(r=>r._kind==='template').map(t=>{const {_kind,_parent,...template}=t;return {...template,downloads:t.downloads+(downloadMap[t.id]||0),forks:t.forks+docs.filter(r=>r._kind==='template'&&r._parent===t.id).length};});
  return {version:1,...preferences,posts,templates,votes:myVotes.results.map(r=>r.target_id),storage:'shared'};
}

export async function handleApi(request,env){
  try{
    const url=new URL(request.url);if(!env.DB)throw new ApiError('De gedeelde database is nog niet gekoppeld.',503);
    const userId=request.headers.get('oai-authenticated-user-id');if(!userId)throw new ApiError('Log in om het kennisplein te gebruiken.',401);
    if(request.method==='GET'&&url.pathname==='/api/state')return json({state:await readState(env.DB,userId)});
    if(request.method!=='POST'||url.pathname!=='/api/actions')return json({error:'Niet gevonden.'},404);
    const origin=request.headers.get('Origin');if(origin&&origin!==url.origin)throw new ApiError('Dit verzoek komt niet van het kennisplein.',403);
    const raw=await request.text();if(raw.length>120000)throw new ApiError('Je bijdrage is te groot.',413);
    let requestData;try{requestData=JSON.parse(raw);}catch{throw new ApiError('Dit verzoek kan niet worden gelezen.');}
    const {action,payload={}}=requestData;const db=env.DB;await ensureSeed(db);
    const settings=await userSettings(db,userId);const profile=settings.profile;
    const now=Date.now();
    if(action==='settings'){
      const allowed={...settings};
      if(payload.profile){const p=payload.profile;allowed.profile={name:textField(p.name,2,70,'Naam'),role:textField(p.role,2,60,'Rol'),branch:p.branch};if(!branches.some(b=>b.id===p.branch))throw new ApiError('Kies een geldig filiaal.');}
      for(const field of ['saved','savedTemplates','followedBranches','followedCategories']){if(payload[field]){if(!Array.isArray(payload[field])||payload[field].length>1000||!payload[field].every(safeId))throw new ApiError('Je voorkeuren zijn ongeldig.');allowed[field]=[...new Set(payload[field])];}}
      await db.prepare('INSERT INTO settings (user_id,data) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data').bind(userId,JSON.stringify(allowed)).run();
      if(payload.profile)await db.prepare("UPDATE records SET data = json_set(data,'$.author',?) WHERE owner_id = ? AND COALESCE(json_extract(data,'$.anonymous'),0) = 0").bind(allowed.profile.name,userId).run();
    } else if(action==='vote'){
      const targetId=validateId(payload.targetId);const target=await db.prepare("SELECT id FROM records WHERE id = ? AND kind IN ('post','answer')").bind(targetId).first();if(!target)throw new ApiError('Deze bijdrage bestaat niet.',404);
      if(typeof payload.value!=='boolean')throw new ApiError('Ongeldige stem.');
      if(payload.value)await db.prepare('INSERT OR IGNORE INTO votes (user_id,target_id) VALUES (?,?)').bind(userId,targetId).run();
      else await db.prepare('DELETE FROM votes WHERE user_id = ? AND target_id = ?').bind(userId,targetId).run();
    } else if(action==='create-post'){
      const p=payload.post;if(!p||!['question','hack'].includes(p.type))throw new ApiError('Kies een vraag of praktijkhack.');
      const post={id:validateId(p.id),title:textField(p.title,8,150,'Titel'),body:textField(p.body,20,10000,'Beschrijving'),category:validateCategory(p.category),type:p.type,...identity(profile,p.anonymous),votes:0,solved:p.type==='hack',createdAt:now,tags:Array.isArray(p.tags)?p.tags.filter(t=>typeof t==='string').slice(0,5).map(t=>t.slice(0,40)):[]};
      await insertRecord(db,post.id,'post',userId,post).run();
    } else if(action==='create-answer'){
      const post=await getRecord(db,payload.postId,'post');const a=payload.answer;if(!a)throw new ApiError('Schrijf een reactie.');
      const answer={id:validateId(a.id),body:textField(a.body,10,6000,'Reactie'),...identity(profile,a.anonymous),votes:0,accepted:false,createdAt:now};
      await insertRecord(db,answer.id,'answer',userId,answer,post.id).run();
    } else if(action==='create-template'||action==='fork-template'){
      const t=payload.template;if(!t)throw new ApiError('Vul een template in.');const parent=action==='fork-template'?await getRecord(db,payload.parentId,'template'):null;const original=parent?JSON.parse(parent.data):null;
      const template={id:validateId(t.id),title:textField(t.title,5,150,'Titel'),description:textField(t.description,5,10000,'Beschrijving'),content:textField(t.content,10,80000,'Inhoud'),category:validateCategory(original?.category||t.category),format:original?.format||(['CSV','MD','TXT','JSON'].includes(t.format)?t.format:'MD'),parentId:parent?.id||null,author:profile.name,branch:profile.branch,downloads:0,forks:0,preview:'checklist',createdAt:now};
      await insertRecord(db,template.id,'template',userId,template,template.parentId).run();
      if(parent){settings.savedTemplates=[...new Set([...settings.savedTemplates,template.id])];await db.prepare('INSERT INTO settings (user_id,data) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data').bind(userId,JSON.stringify(settings)).run();}
    } else if(action==='download-template'){
      await getRecord(db,payload.templateId,'template');await db.prepare('INSERT INTO downloads (id,target_id,created_at) VALUES (?,?,?)').bind(crypto.randomUUID(),payload.templateId,now).run();
    } else if(action==='solve'){
      const post=await owned(db,payload.postId,userId,'post');if(JSON.parse(post.data).type!=='question')throw new ApiError('Dit is geen vraag.');if(typeof payload.value!=='boolean')throw new ApiError('Ongeldige status.');
      await db.prepare("UPDATE records SET data = json_set(data,'$.solved',json(?)) WHERE id = ?").bind(JSON.stringify(payload.value),post.id).run();
    } else if(action==='accept-answer'){
      const post=await owned(db,payload.postId,userId,'post');const answer=await getRecord(db,payload.answerId,'answer');if(answer.parent_id!==post.id)throw new ApiError('Dit antwoord hoort niet bij deze vraag.');if(typeof payload.value!=='boolean')throw new ApiError('Ongeldige status.');
      await db.batch([
        db.prepare("UPDATE records SET data = json_set(data,'$.accepted',json('false')) WHERE kind = 'answer' AND parent_id = ?").bind(post.id),
        db.prepare("UPDATE records SET data = json_set(data,'$.accepted',json(?)) WHERE id = ?").bind(JSON.stringify(payload.value),answer.id),
        db.prepare("UPDATE records SET data = json_set(data,'$.solved',json(?)) WHERE id = ?").bind(JSON.stringify(payload.value),post.id),
      ]);
    } else throw new ApiError('Deze actie is niet beschikbaar.');
    return json({state:await readState(db,userId)});
  }catch(error){if(error instanceof ApiError)return json({error:error.message},error.status);console.error('JumboOverflow API error',error?.message);return json({error:'Opslaan is niet gelukt. Probeer het opnieuw.'},500);}
}

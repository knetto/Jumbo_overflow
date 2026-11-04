import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLocalDb} from '../scripts/local-db.mjs';
import {handleApi} from '../worker/api.js';
function harness(){
  const db=createLocalDb();
  async function call(user,action,payload={},extra={}){
    const headers={'Content-Type':'application/json',...(user?{'oai-authenticated-user-id':user}:{}),...extra};
    const request=new Request('https://test.local/api/'+(action?'actions':'state'),{method:action?'POST':'GET',headers,body:action?JSON.stringify({action,payload}):undefined});
    const response=await handleApi(request,{DB:db});return {status:response.status,...await response.json()};
  }
  return {db,call};
}
const post={id:'test-post',type:'question',title:'Hoe kunnen we de overdracht verbeteren?',body:'We willen onze overdracht samen verbeteren en zoeken praktische tips van andere teams.',category:'planning',tags:['overdracht']};
test('Shared database is seeded once and rejects requests without identity',async()=>{
  const {db,call}=harness();try{
    assert.equal((await call(null)).status,401);
    const first=await call('alice');const second=await call('bob');
    assert.equal(first.state.posts.length,24);assert.equal(second.state.posts.length,24);
    assert.equal(first.state.templates.length,12);
    assert.equal(first.state.storage,'shared');
  }finally{db.close();}
});
test('Shared contributions appear for another identity; authorship cannot be spoofed',async()=>{
  const {db,call}=harness();try{
    await call('alice','settings',{profile:{name:'Alice Test',branch:'breda',role:'Teamleider'}});
    const created=await call('alice','create-post',{post:{...post,author:'Spoofed',branch:'utrecht',votes:9999}});
    assert.equal(created.status,200);
    const mine=created.state.posts.find(p=>p.id===post.id);assert.equal(mine.author,'Alice Test');assert.equal(mine.votes,0);assert.equal(mine.branch,'breda');assert.equal(mine.own,true);
    const theirs=(await call('bob')).state.posts.find(p=>p.id===post.id);assert.equal(theirs.own,false);assert.equal(theirs.author,'Alice Test');
    assert.equal((await call('bob','solve',{postId:post.id,value:true})).status,403);
  }finally{db.close();}
});
test('Votes are idempotent per account and combine across accounts',async()=>{
  const {db,call}=harness();try{
    const base=(await call('alice')).state.posts.find(p=>p.id==='p1').votes;
    await call('alice','vote',{targetId:'p1',value:true});
    await call('alice','vote',{targetId:'p1',value:true});
    let result=await call('bob','vote',{targetId:'p1',value:true});
    assert.equal(result.state.posts.find(p=>p.id==='p1').votes,base+2);
    result=await call('alice','vote',{targetId:'p1',value:false});
    assert.equal(result.state.posts.find(p=>p.id==='p1').votes,base+1);
    assert.equal(result.state.votes.includes('p1'),false);
    assert.equal((await call('bob')).state.votes.includes('p1'),true);
  }finally{db.close();}
});
test('Only the question author can accept a shared answer',async()=>{
  const {db,call}=harness();try{
    await call('alice','create-post',{post});
    await call('bob','create-answer',{postId:post.id,answer:{id:'test-answer',body:'Wij gebruiken drie korte blokken en bespreken de prioriteiten samen.'}});
    assert.equal((await call('bob','accept-answer',{postId:post.id,answerId:'test-answer',value:true})).status,403);
    const accepted=await call('alice','accept-answer',{postId:post.id,answerId:'test-answer',value:true});
    const p=accepted.state.posts.find(p=>p.id===post.id);assert.equal(p.solved,true);assert.equal(p.answers[0].accepted,true);
    assert.equal((await call('bob')).state.posts.find(p=>p.id===post.id).answers[0].own,true);
  }finally{db.close();}
});
test('Forks preserve source content and preferences remain personal',async()=>{
  const {db,call}=harness();try{
    const original=(await call('alice')).state.templates.find(t=>t.id==='t1');
    const result=await call('alice','fork-template',{parentId:'t1',template:{id:'test-fork',title:'Overdracht voor ons eigen filiaal',description:'Een eigen lokale werkverdeling.',content:'# Onze versie\n\nSamen elke dienst goed overdragen.'}});
    assert.equal(result.status,200);
    assert.equal(result.state.templates.find(t=>t.id==='t1').content,original.content);
    assert.equal(result.state.templates.find(t=>t.id==='t1').forks,original.forks+1);
    assert.equal(result.state.savedTemplates.includes('test-fork'),true);
    assert.equal((await call('bob')).state.savedTemplates.includes('test-fork'),false);
  }finally{db.close();}
});
test('Server validates fields and prevents cross-origin writes',async()=>{
  const {db,call}=harness();try{
    assert.equal((await call('alice','create-post',{post:{...post,title:'x'}})).status,400);
    assert.equal((await call('alice','create-post',{post:{...post,category:'invalid'}})).status,400);
    assert.equal((await call('alice','vote',{targetId:'p1',value:true},{Origin:'https://other.example'})).status,403);
    assert.equal((await call('alice','create-post',{post})).status,200);
    assert.equal((await call('alice','create-answer',{postId:'missing',answer:{id:'test-answer',body:'Dit is een lang genoeg antwoord.'}})).status,404);
  }finally{db.close();}
});

test('Anonymous questions, tips and answers omit identity while keeping ownership',async()=>{
  const {db,call}=harness();try{
    await call('alice','settings',{profile:{name:'Alice Private',branch:'breda',role:'Teamleider'}});
    for(const type of ['question','hack']){
      const id=`anonymous-${type}`;
      const created=await call('alice','create-post',{post:{...post,id,type,anonymous:true,author:'Alice Private',branch:'breda'}});
      assert.equal(created.status,200);
      assert.equal(created.state.posts.find(p=>p.id===id).own,true);
      const shared=(await call('bob')).state.posts.find(p=>p.id===id);
      assert.equal(shared.author,'Anonieme collega');assert.equal(shared.branch,null);
      assert.equal(shared.anonymous,true);assert.equal(shared.own,false);
      assert.equal(shared.owner_id,undefined);
      const stored=await db.prepare('SELECT data FROM records WHERE id = ?').bind(id).first();
      assert.doesNotMatch(stored.data,/Alice Private|breda/);
    }
    await call('bob','settings',{profile:{name:'Bob Private',branch:'utrecht',role:'Winkelmedewerker'}});
    const replied=await call('bob','create-answer',{postId:'anonymous-question',answer:{id:'anonymous-answer',body:'Een andere taakverdeling helpt ons bij de avondoverdracht.',anonymous:true}});
    assert.equal(replied.status,200);
    assert.equal(replied.state.posts.find(p=>p.id==='anonymous-question').answers[0].own,true);
    const answer=(await call('alice')).state.posts.find(p=>p.id==='anonymous-question').answers[0];
    assert.equal(answer.author,'Anonieme collega');assert.equal(answer.branch,null);assert.equal(answer.own,false);
    assert.doesNotMatch((await db.prepare('SELECT data FROM records WHERE id = ?').bind(answer.id).first()).data,/Bob Private|utrecht/);
    assert.equal((await call('bob','solve',{postId:'anonymous-question',value:true})).status,403);
    assert.equal((await call('bob','accept-answer',{postId:'anonymous-question',answerId:answer.id,value:true})).status,403);
    const accepted=await call('alice','accept-answer',{postId:'anonymous-question',answerId:answer.id,value:true});
    assert.equal(accepted.status,200);assert.equal(accepted.state.posts.find(p=>p.id==='anonymous-question').solved,true);
  }finally{db.close();}
});

test('Profile changes preserve anonymity in storage and all public responses',async()=>{
  const {db,call}=harness();try{
    await call('alice','create-post',{post:{...post,anonymous:true}});
    await call('alice','create-answer',{postId:post.id,answer:{id:'private-reply',body:'Dit is een antwoord zonder mijn naam of filiaal.',anonymous:true}});
    await call('alice','create-post',{post:{...post,id:'named-post'}});
    await call('alice','create-answer',{postId:'named-post',answer:{id:'named-reply',body:'Dit antwoord wordt onder mijn eigen naam geplaatst.'}});
    const result=await call('alice','settings',{profile:{name:'Changed Private Name',branch:'utrecht',role:'Teamleider'}});
    assert.equal(result.status,200);
    const mine=result.state.posts.find(p=>p.id===post.id);
    assert.equal(mine.author,'Anonieme collega');assert.equal(mine.answers[0].author,'Anonieme collega');
    for(const id of [post.id,'private-reply']){
      const stored=JSON.parse((await db.prepare('SELECT data FROM records WHERE id = ?').bind(id).first()).data);
      assert.equal(stored.author,'Anonieme collega');assert.equal(stored.branch,null);
    }
    const named=result.state.posts.find(p=>p.id==='named-post');
    assert.equal(named.author,'Changed Private Name');assert.equal(named.answers[0].author,'Changed Private Name');
    const theirs=(await call('bob')).state.posts.find(p=>p.id===post.id);
    assert.doesNotMatch(JSON.stringify(theirs),/Changed Private Name|utrecht/);
  }finally{db.close();}
});

test('Anonymous flag must be a boolean and defaults to a named contribution',async()=>{
  const {db,call}=harness();try{
    for(const anonymous of ['true','false',1,null]){
      assert.equal((await call('alice','create-post',{post:{...post,anonymous}})).status,400);
    }
    const result=await call('alice','create-post',{post:{...post,anonymous:false}});
    assert.equal(result.status,200);assert.equal(result.state.posts.find(p=>p.id===post.id).anonymous,false);
    assert.equal((await call('alice','create-answer',{postId:post.id,answer:{id:'bad-answer',body:'Een antwoord met ongeldige instellingen.',anonymous:'false'}})).status,400);
  }finally{db.close();}
});

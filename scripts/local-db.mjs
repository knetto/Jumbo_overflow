import { DatabaseSync } from 'node:sqlite';
import { readFileSync,readdirSync,mkdirSync } from 'node:fs';
import path from 'node:path';

export function createLocalDb(filename=':memory:'){
  if(filename!==':memory:')mkdirSync(path.dirname(filename),{recursive:true});
  const sqlite=new DatabaseSync(filename);
  sqlite.exec('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)');
  for(const name of readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort()){
    if(!sqlite.prepare('SELECT name FROM local_migrations WHERE name = ?').get(name)){
      sqlite.exec('BEGIN');try{sqlite.exec(readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8'));sqlite.prepare('INSERT INTO local_migrations(name) VALUES (?)').run(name);sqlite.exec('COMMIT');}catch(error){sqlite.exec('ROLLBACK');throw error;}
    }
  }
  const statement=(sql,args=[])=>({
    bind(...values){return statement(sql,values);},
    async first(){return sqlite.prepare(sql).get(...args)||null;},
    async all(){return {results:sqlite.prepare(sql).all(...args)};},
    _run(){return {success:true,meta:sqlite.prepare(sql).run(...args)};},
    async run(){return this._run();},
  });
  return {prepare:sql=>statement(sql),async batch(items){sqlite.exec('BEGIN');try{const results=items.map(item=>item._run());sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}},close:()=>sqlite.close()};
}

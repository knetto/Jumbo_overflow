import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

let browser;
before(async()=>{browser=await chromium.launch({channel:'chrome',headless:true});});
after(async()=>{await browser?.close();});
async function open(options={}){
  const context=await browser.newContext({viewport:{width:1440,height:1100},...options});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/**',r=>r.fulfill({status:404,body:'Local search test'}));
  await page.goto('http://localhost:4173/#zoeken');
  await page.locator('#page-search').waitFor();
  return {page,context,errors};
}
async function waitQuery(page,query){await page.waitForFunction(q=>document.querySelector('.search-status')?.textContent.includes(`“${q}”`),query);}

test('Sentence search is live, retains the caret, ranks advice and survives reload',async()=>{
  const {page,context,errors}=await open();
  try{
    const query='Er zijn te weinig mensen voor de avondploeg';
    await page.locator('#page-search').fill(query);await waitQuery(page,query);
    assert.equal(await page.locator('.knowledge-result').first().getAttribute('data-result'),'p3');
    assert.equal(await page.locator('#page-search').evaluate(e=>e===document.activeElement),true);
    assert.equal(await page.locator('#page-search').evaluate(e=>e.selectionStart),query.length);
    assert.ok(await page.locator('mark').count()>0);
    await page.reload();await waitQuery(page,query);
    assert.equal(await page.locator('#page-search').inputValue(),query);
    await page.locator('#page-search').fill('overdarcht');await waitQuery(page,'overdarcht');
    assert.ok(await page.locator('.post-card').count()>0);assert.ok(await page.locator('.template-card').count()>0);
    await page.locator('[data-action="search-type"][data-id="template"]').click();
    assert.equal(await page.locator('.post-card').count(),0);
    await page.getByRole('combobox',{name:'Filiaal',exact:true}).click();
    await page.getByRole('option',{name:'Jumbo Tilburg',exact:true}).click();
    assert.equal(await page.locator('.knowledge-result').count(),1);
    await page.getByRole('button',{name:'Bekijk template',exact:true}).click();
    await page.locator('.template-preview').waitFor();
    await page.keyboard.press('Escape');
    await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/search-desktop.png',fullPage:true});
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test('Mobile search supports examples, filters, empty state and clear, without overflow',async()=>{
  const {page,context,errors}=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  try{
    await page.getByRole('button',{name:/Producten gaan over datum/}).click();
    await waitQuery(page,'Producten gaan over datum');
    assert.ok(await page.locator('.knowledge-result').count()>0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.getByRole('combobox',{name:'Onderwerp',exact:true}).click();
    await page.getByRole('option',{name:'Klant & service',exact:true}).click();
    await page.getByRole('heading',{name:'Geen resultaten met deze filters.'}).waitFor();
    await page.getByRole('button',{name:'Wis alle filters',exact:true}).click();
    assert.ok(await page.locator('.knowledge-result').count()>0);
    await page.screenshot({path:'test-results/search-mobile.png',fullPage:true});
    await page.locator('#page-search').fill('xyzqv nonexisting');await waitQuery(page,'xyzqv nonexisting');
    assert.equal(await page.locator('.knowledge-result').count(),0);
    await page.getByRole('heading',{name:'Nog geen passende kennis gevonden.'}).waitFor();
    await page.locator('#page-search').fill('');
    await page.getByRole('heading',{name:'Alle kennis begint met een vraag.'}).waitFor();
    assert.equal(await page.locator('#global-search').inputValue(),'');
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test('Header search opens from another page and Back returns without a delayed search',async()=>{
  const {page,context,errors}=await open();
  try{
    await page.locator('.side-nav a[href="#templates"]').click();
    await page.locator('.template-grid').waitFor();
    await page.locator('#global-search').fill('ziekmeldng');await waitQuery(page,'ziekmeldng');
    assert.equal(await page.locator('.knowledge-result').first().getAttribute('data-result'),'p3');
    assert.equal(await page.locator('#global-search').evaluate(e=>e===document.activeElement),true);
    assert.equal(await page.locator('.side-nav a[href="#kennisplein"]').getAttribute('aria-current'),'page');
    assert.equal(await page.locator('#page-search').inputValue(),'ziekmeldng');
    await page.goBack();await page.locator('.template-grid').waitFor();
    assert.match(page.url(),/#templates$/);
    await page.locator('#global-search').fill('overdracht');
    await page.locator('.side-nav a[href="#filialen"]').click();
    await page.locator('.branch-grid').waitFor();
    // Give the old debounce enough time to fire if navigation failed to cancel it.
    await page.waitForTimeout(350);
    assert.match(page.url(),/#filialen$/);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
let browser;
before(async()=>{browser=await chromium.launch({channel:'chrome',headless:true});});
after(async()=>{await browser?.close();});
async function open(options={}){
  const context=await browser.newContext({viewport:{width:1440,height:1000},...options});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/**',r=>r.fulfill({status:404,body:'Local dropdown test'}));
  await page.goto('http://localhost:4173');
  await page.getByRole('combobox',{name:'Sorteer bijdragen',exact:true}).waitFor();
  return {page,context,errors};
}
test('Profile dropdown uses Jumbo options and submits the selected value',async()=>{
  const {page,context,errors}=await open();
  try{
    assert.ok(await page.evaluate(()=>typeof window.gsap?.to==='function'));
    await page.getByRole('button',{name:'Jouw profiel aanpassen',exact:true}).click();
    const role=page.getByRole('combobox',{name:'Jouw rol',exact:true});
    await role.click();
    assert.equal(await role.getAttribute('aria-expanded'),'true');
    assert.equal(await page.getByRole('option').count(),5);
    assert.equal(await page.getByRole('option',{name:'Vulploegleider',exact:true}).getAttribute('aria-selected'),'true');
    await page.setViewportSize({width:390,height:844});
    await page.waitForFunction(()=>{const r=document.querySelector('#profile-role-listbox')?.getBoundingClientRect();return r&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;});
    await page.setViewportSize({width:1440,height:1000});
    await page.getByRole('option',{name:'Filiaalmanager',exact:true}).click();
    assert.equal(await page.locator('#profile-role').inputValue(),'Filiaalmanager');
    assert.match(await role.textContent(),/Filiaalmanager/);
    await page.getByRole('button',{name:'Profiel opslaan',exact:true}).click();
    await page.reload();
    await page.getByRole('button',{name:'Jouw profiel aanpassen',exact:true}).click();
    assert.equal(await page.locator('#profile-role').inputValue(),'Filiaalmanager');
    assert.equal(await page.locator('.modal select').evaluateAll(els=>els.every(el=>el.hidden)),true);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});
test('Keyboard navigation, typeahead and Escape preserve dialog and selection',async()=>{
  const {page,context,errors}=await open();
  try{
    await page.getByRole('button',{name:'Jouw profiel aanpassen',exact:true}).click();
    const role=page.getByRole('combobox',{name:'Jouw rol',exact:true});
    await role.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.locator('#profile-role').inputValue(),'Vulploegleider');
    await page.keyboard.press('Escape');
    assert.equal(await role.getAttribute('aria-expanded'),'false');
    assert.equal(await page.getByRole('dialog').count(),1);
    assert.equal(await role.evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('h');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#profile-role').inputValue(),'Hoofdkantoor');
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#profile-role').inputValue(),'Teamleider');
    assert.equal(await page.getByRole('button',{name:'Annuleren',exact:true}).evaluate(el=>el===document.activeElement),true);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});
test('Sort and topic dropdowns rerender results and restore keyboard focus',async()=>{
  const {page,context,errors}=await open();
  try{
    const sort=page.getByRole('combobox',{name:'Sorteer bijdragen',exact:true});
    await sort.click();
    await page.getByRole('option',{name:'Onbeantwoord',exact:true}).click();
    assert.equal(await page.locator('.post-card').count(),3);
    assert.equal(await sort.evaluate(el=>el===document.activeElement),true);
    await sort.click();await page.getByRole('option',{name:'Populair',exact:true}).click();
    const topic=page.getByRole('combobox',{name:'Filter op onderwerp',exact:true});
    await topic.click();await page.getByRole('option',{name:'Team & inwerken',exact:true}).click();
    assert.equal(await page.locator('.post-card').count(),5);
    assert.equal(await topic.evaluate(el=>el===document.activeElement),true);
    await topic.click();
    await page.getByRole('heading',{name:'Voor jou op de vloer',exact:false}).click();
    assert.equal(await topic.getAttribute('aria-expanded'),'false');
    assert.equal(await page.locator('#category-select').inputValue(),'team');
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});
test('Mobile menu fits the viewport, scrolls long options and flips near an edge',async()=>{
  const {page,context,errors}=await open({viewport:{width:320,height:700},isMobile:true,hasTouch:true});
  try{
    await page.getByRole('button',{name:'Jouw profiel aanpassen',exact:true}).click();
    const branch=page.getByRole('combobox',{name:'Jouw filiaal',exact:true});
    await branch.click();
    const menu=page.getByRole('listbox',{name:'Jouw filiaal',exact:true});
    const fits=await menu.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;});
    assert.equal(fits,true);
    await page.getByRole('option',{name:'Jumbo Maastricht · Wyck',exact:true}).scrollIntoViewIfNeeded();
    await page.getByRole('option',{name:'Jumbo Maastricht · Wyck',exact:true}).click();
    assert.equal(await page.locator('#profile-branch').inputValue(),'maastricht');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.getByRole('button',{name:'Venster sluiten',exact:true}).click();
    await page.getByRole('combobox',{name:'Sorteer bijdragen',exact:true}).evaluate(el=>{scrollTo(0,scrollY+el.getBoundingClientRect().top-570);});
    await page.getByRole('combobox',{name:'Sorteer bijdragen',exact:true}).click();
    const sortMenu=page.getByRole('listbox',{name:'Sorteer bijdragen',exact:true});
    assert.equal(await sortMenu.getAttribute('data-side'),'top');
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});
test('Reduced-motion preference disables GSAP entrance tweens',async()=>{
  const {page,context,errors}=await open({reducedMotion:'reduce'});
  try{
    await page.getByRole('combobox',{name:'Sorteer bijdragen',exact:true}).click();
    assert.equal(await page.getByRole('listbox',{name:'Sorteer bijdragen',exact:true}).evaluate(el=>window.gsap.isTweening(el)),false);
    await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'Jouw profiel aanpassen',exact:true}).click();
    assert.equal(await page.getByRole('dialog').evaluate(el=>window.gsap.isTweening(el)),false);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

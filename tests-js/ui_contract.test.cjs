/* Deterministic DOM-event smoke harness for the Academy controls.
 * It is NOT a real browser layout or click-through test: Chromium navigation is
 * blocked by the host's administrator policy. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'web/index.html'),'utf8');
class FakeNode {
  constructor(tag='div',id=''){
    this.tagName=tag.toUpperCase();this.id=id;this.children=[];this.parentElement=null;
    this.listeners={};this.attributes={};this.dataset={};this.style={};this._text='';this.value='';this.checked=false;this.disabled=false;this.hidden=false;this.className='';
    const that=this;this.classList={contains:c=>new Set(that.className.split(/\s+/)).has(c),add:c=>{that.className=[...new Set([...that.className.split(/\s+/),c])].filter(Boolean).join(' ')},remove:c=>{that.className=that.className.split(/\s+/).filter(x=>x&&x!==c).join(' ')},toggle:(c,force)=>{
      const found=that.className.split(/\s+/).includes(c),add=force===undefined?!found:force;
      if(add)this.classList.add(c);else this.classList.remove(c);return add;
    }};
  }
  get textContent(){return this._text+this.children.map(x=>x.textContent||'').join('');}
  set textContent(v){this._text=String(v);this.children=[];}
  get firstElementChild(){return this.children[0]||null;}
  addEventListener(type,fn){(this.listeners[type]||=[]).push(fn)}
  fire(type,extra={}){for(const fn of this.listeners[type]||[])fn({target:this,preventDefault(){},key:'',...extra})}
  click(){this.fire('click')}
  append(...c){for(const v of c){if(v!==null){if(typeof v==='string'){const e=new FakeNode('span');e.textContent=v;c=v;}this.children.push(v);if(typeof v==='object')v.parentElement=this;}}}
  replaceChildren(...args){this.children=[];this.append(...args)}
  remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this)}
  setAttribute(k,v){this.attributes[k]=String(v)}
  getAttribute(k){return this.attributes[k]||null}
  getBoundingClientRect(){return {width:440,height:210,top:0}}
  scrollIntoView(){}
  focus(){}
  querySelectorAll(q){if(q!=='button')return [];const walk=n=>n.children.flatMap(c=>[...(c.tagName==='BUTTON'?[c]:[]),...walk(c)]);return walk(this)}
  getContext(){return {setTransform(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillText(){},fillRect(){},arc(){},fill(){},closePath(){},save(){},restore(){}}}
}
function runHarness(){
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(x=>x[1]),byId=new Map(ids.map(id=>[id,new FakeNode('div',id)]));
 for(const name of ['metric-true','metric-pred','class-true','class-score','assistant-input','adv-search','issue-search','component-search'])byId.get(name).tagName='TEXTAREA';
 const set=(key,val)=>{const el=byId.get(key);assert.ok(el,`missing ${key}`);el.value=val;};
 for(const [key,v] of Object.entries({'adv-task':'all','issue-risk':'all','advisor-goal':'new_battery','advisor-task':'soc','advisor-cells':'8','advisor-cycles':'5','chrono-n':'2000','chrono-w':'64','chrono-gap':'64','code-model':'rdb_attn_bilstm','component-group':'all','metric-task':'soc','metric-true':'0.95,0.78,0.51,0.25,0.05','metric-pred':'0.92,0.80,0.55,0.22,0.10','class-true':'0,1,1,0,1,0,0,1','class-score':'0.1,0.9,0.7,0.3,0.4,0.6,0.2,0.8','class-threshold':'0.5'}))set(key,v);
 const selectorNodes={};
 const attrs=[...html.matchAll(/<button\b([^>]+)>/g)].map((match,index)=>{
   const s=match[1],id=s.match(/\sid="([^"]+)"/)?.[1];const el=id?byId.get(id):new FakeNode('button','button-'+index);el.tagName='BUTTON';
   for(const mm of s.matchAll(/\sdata-([a-z-]+)="([^"]+)"/g)){
     const key=mm[1].replace(/-([a-z])/g,(_,l)=>l.toUpperCase());el.dataset[key]=mm[2];
     (selectorNodes[mm[1]]||=[]).push(el);
   }
   return el;
 });
 const winListeners={};let ready=null;
 const doc={documentElement:{lang:'zh'},body:new FakeNode('body','body'),getElementById:id=>byId.get(id)||null,
  createElement:tag=>new FakeNode(tag),addEventListener:(type,fn)=>{if(type==='DOMContentLoaded')ready=fn;},
  querySelectorAll:(q)=>{
    if(q.match(/^\[data-([a-z-]+)\]$/))return selectorNodes[q.match(/^\[data-([a-z-]+)\]$/)[1]]||[];
    if(q.startsWith('.model-tab'))return [];
    return [];
  },querySelector:()=>null};
 const win={document:doc,devicePixelRatio:1,isSecureContext:true,CellModelCode:null,
  addEventListener:(type,fn)=>{(winListeners[type]||=[]).push(fn)},dispatchEvent:event=>{for(const fn of winListeners[event.type]||[])fn(event)}};
 const ctx={window:win,document:doc,matchMedia:()=>({matches:true}),getComputedStyle:()=>({getPropertyValue:()=>''}),
   AbortController,URL,Number,String,Math,JSON,Array,Set,Map,Error,WeakMap,console,setTimeout,clearTimeout,
   fetch:async()=>{throw new Error('offline fixture')},navigator:{clipboard:{writeText:async()=>{}}},CustomEvent:class {constructor(type,opts={}){this.type=type;this.detail=opts.detail||{}}}};
 for(const filename of ['core.js','models.js','catalog.generated.js','academy-core.js','academy-data.js','model-code.generated.js','academy-ui.js']){
   const code=fs.readFileSync(path.join(ROOT,'web/assets',filename),'utf8');vm.runInNewContext(code,ctx,{filename,timeout:2000});
 }
 assert.ok(ready,'Academy did not register DOMContentLoaded handler');ready();
 return {ids,buttons:attrs,byId,ctx,win,selectorNodes,set};
}
function txt(v,id){return v.byId.get(id).textContent}
// Each test gets its own window state to avoid contamination.
test('Academy initializes and all declared direct control IDs are bound',async()=>{
 const v=runHarness();const source=fs.readFileSync(path.join(ROOT,'web/assets/academy-ui.js'),'utf8');
 const called=[...source.matchAll(/\bon\('([^']+)'\s*,\s*'([^']+)'/g)];
 assert.ok(called.length>=20);
 for(const [,id,event] of called){assert.ok(v.byId.get(id),`Missing ${id}`);assert.ok(v.byId.get(id).listeners[event]?.length,`Missing handler ${id}.${event}`);}
 assert.equal(v.byId.get('assistant-panel').hidden,false,'fake default hidden false, toggled later');
 assert.equal(v.byId.get('academy-roadmap').children.length,4);
 await new Promise(resolve=>setTimeout(resolve,0)); // wait for the intentional offline-catalog fallback
 assert.ok(v.byId.get('adv-grid').children.length>0);
 assert.equal(v.byId.get('component-grid').children.length,25);
});
test('metrics calculator click changes real numeric output and classification tabs',()=>{
 const v=runHarness();
 v.byId.get('metric-calculate').click();assert.ok(v.byId.get('regression-output').children.length>=10);
 v.set('metric-pred','0.95, 0.78, 0.51, 0.25, 0.05');v.byId.get('metric-calculate').click();
 assert.ok(v.byId.get('regression-output').children.some(e=>e.textContent.includes('0.0000')));
 const c=v.selectorNodes['metric-type'];assert.equal(c.length,2);c[1].click();assert.equal(v.byId.get('classification-lab').hidden,false);
 v.byId.get('class-calculate').click();assert.equal(v.byId.get('confusion-grid').children.length,4);
 v.byId.get('class-threshold').value='0.9';v.byId.get('class-threshold').fire('input');assert.ok(txt(v,'class-threshold-value').includes('0.90'));
});
test('assistant opens in its own in-flow panel, answers presets and can close/hide',()=>{
 const v=runHarness();v.byId.get('mascot-toggle').click();assert.equal(v.byId.get('assistant-panel').hidden,false);
 const first=v.byId.get('assistant-log').children.length;
 v.selectorNodes['ask'][0].click();assert.ok(v.byId.get('assistant-log').children.length>first);
 v.set('assistant-input','dropout');v.byId.get('assistant-form').fire('submit');assert.ok(txt(v,'assistant-log').includes('Dropout'));
 v.byId.get('assistant-close').click();assert.equal(v.byId.get('assistant-panel').hidden,true);
 v.byId.get('assistant-header').click();assert.equal(v.byId.get('assistant-panel').hidden,false);
 v.byId.get('assistant-hide').click();assert.equal(v.byId.get('mascot-dock').hidden,true);
});
test('source code tabs, issue clinic, chronological controls and quiz buttons respond',()=>{
 const v=runHarness();
 assert.ok(txt(v,'model-source-code').length>10);v.selectorNodes['code-tab'][1].click();assert.ok(txt(v,'model-source-code').length>10);
 v.set('code-model','gru');v.byId.get('code-model').fire('change');assert.ok(txt(v,'code-model-summary').includes('门控'));
 v.byId.get('chrono-apply').click();assert.ok(txt(v,'chrono-warning').includes('可用窗口'));
 v.byId.get('advisor-evaluate').click();assert.ok(txt(v,'advisor-title').length>5);
 v.byId.get('issue-search').fire('input');assert.ok(v.byId.get('issue-grid').children.length>=14);
 v.byId.get('component-search').fire('input');assert.ok(v.byId.get('component-grid').children.length===25);
 assert.ok(v.byId.get('quiz-options').children.length>2);v.byId.get('quiz-options').children[0].click();v.byId.get('quiz-check').click();assert.equal(v.byId.get('quiz-next').disabled,false);
 v.byId.get('quiz-next').click();assert.ok(txt(v,'quiz-progress-text').includes('02'));
 v.byId.get('quiz-reset').click();assert.ok(txt(v,'quiz-progress-text').includes('01'));
});

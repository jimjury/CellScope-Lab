const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../web/assets/i18n.js'),'utf8');
function text(value,parent){return {nodeType:3,data:value,parentElement:parent}}
function element(tag,attrs={},children=[]){const obj={nodeType:1,tagName:tag.toUpperCase(),childNodes:[],attributes:{...attrs},
  getAttribute(k){return this.attributes[k]||null},setAttribute(k,v){this.attributes[k]=String(v)}};
 for(const c of children){const node=typeof c==='string'?text(c,obj):c;node.parentElement=obj;obj.childNodes.push(node);}return obj;}
function fake(){
 const nav=element('a',{href:'./guide.html'},['使用指南']);
 const opt=element('option',{},['SOC（0–1）']);
 const input=element('input',{placeholder:'搜索模型'});
 const section=element('span',{},['研究总览']);
 const body=element('body',{},[nav,opt,input,section]);
 const select={value:'zh',handlers:{},addEventListener(e,fn){this.handlers[e]=fn}};
 let ready=null;let emitted=[];
 const document={body,documentElement:{lang:'zh'},title:'',addEventListener(e,fn){if(e==='DOMContentLoaded')ready=fn},getElementById(id){return id==='language-select'?select:null},querySelector(q){return q==='.side-links a[href^="./guide"]'?nav:null}};
 const window={dispatchEvent(e){emitted.push(e.type)}};
 const ctx={window,document,Map,WeakMap,Set,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},MutationObserver:class{observe(){}},console};
 vm.runInNewContext(source,ctx,{filename:'i18n.js'});ready();
 return {nav,opt,input,section,select,document,window,emitted};
}
test('language selection translates actual DOM nodes and links and is reversible',()=>{
 const d=fake();assert.equal(d.section.childNodes[0].data,'研究总览');
 d.window.CellLanguage.set('en');
 assert.equal(d.section.childNodes[0].data,'Overview');
 assert.equal(d.opt.childNodes[0].data,'SOC (0–1)');
 assert.equal(d.input.getAttribute('placeholder'),'Search Models');
 assert.equal(d.nav.getAttribute('href'),'./guide.en.html');
 assert.equal(d.document.documentElement.lang,'en');
 assert.ok(d.emitted.includes('cellscope:langchange'));
 d.window.CellLanguage.set('zh');
 assert.equal(d.section.childNodes[0].data,'研究总览');
 assert.equal(d.opt.childNodes[0].data,'SOC（0–1）');
 assert.equal(d.nav.getAttribute('href'),'./guide.html');
 assert.equal(d.document.documentElement.lang,'zh');
});

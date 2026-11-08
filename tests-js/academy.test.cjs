const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const A=require('../web/assets/academy-core.js');
const src=fs.readFileSync(path.join(__dirname,'../cellscope/models.py'),'utf8');
const modelJS=fs.readFileSync(path.join(__dirname,'../web/assets/model-code.generated.js'),'utf8');
const modelCode=JSON.parse(modelJS.replace(/^.*?window.CellModelCode = /s,'').trim().replace(/;\s*$/,''));
const page=fs.readFileSync(path.join(__dirname,'../web/index.html'),'utf8');

test('regr: exact MAE RMSE MSE bias, R2 and MAPE on known numbers',()=>{
  const m=A.regression([1,2,3],[1,4,2]);
  assert.equal(m.n,3);assert.equal(m.mae,1);assert.equal(m.mse,5/3);
  assert.ok(Math.abs(m.rmse-Math.sqrt(5/3))<1e-12);
  assert.ok(Math.abs(m.bias-1/3)<1e-12);assert.equal(m.r2,-1.5);
  assert.ok(Math.abs(m.mape-(0+100+100/3)/3)<1e-10);
});
test('regr: near-zero MAPE is excluded and count reported; constant R2 undefined',()=>{
  const m=A.regression([0,0,0],[0.1,.2,.3]);assert.equal(m.mape,null);
  assert.equal(m.mape_eligible,0);assert.equal(m.r2,null);
  assert.equal(m.mae,.20000000000000004);
});
test('regr: reject mismatched, empty and nonfinite vectors',()=>{
  assert.throws(()=>A.regression([1],[1,2]),/Equal nonempty/);
  assert.throws(()=>A.regression([],[]),/Equal nonempty/);
  assert.throws(()=>A.regression([1],[Infinity]),/Equal nonempty/);
});
test('parse numbers: supports separators and exponent but blocks NaN and unsafe input',()=>{
  assert.deepEqual(A.parseNumbers('0.1， 1e-2; -.3'),[.1,.01,-.3]);
  assert.throws(()=>A.parseNumbers('0.1, NaN'),/Only finite/);
  assert.throws(()=>A.parseNumbers('1e309'),/Only finite/);
  assert.throws(()=>A.parseNumbers('1; __proto__'),/Only finite/);
});
test('binary: perfect classification metrics including AUC',()=>{
  const m=A.binary([0,1,0,1],[.1,.9,.2,.8]);
  assert.deepEqual([m.tp,m.tn,m.fp,m.fn],[2,2,0,0]);
  for(const k of ['accuracy','precision','recall','specificity','f1','balancedAccuracy','mcc','auc'])assert.equal(m[k],1,k);
});
test('binary: ROC AUC uses ranking independent of threshold, tie counts one half',()=>{
  const y=[0,1,0,1],s=[.5,.5,.7,.7];
  assert.equal(A.binary(y,s,.1).auc,.5);assert.equal(A.binary(y,s,.95).auc,.5);
});
test('binary: undefined AUC on single-class data and undefined precision on zero predicted positives',()=>{
  assert.equal(A.binary([0,0,0],[.1,.2,.3]).auc,null);
  assert.equal(A.binary([0,1],[.1,.2],.5).precision,null);
  assert.throws(()=>A.binary([0,2],[.1,.2]),/Binary/);
});
test('time partitions: disjoint raw indices and label-local windows',()=>{
  const p=A.timePartitions(2000,{train:.7,val:.15,window:64,gap:64});
  const [tr,g1,va,g2,te]=p.parts;
  assert.deepEqual([tr.start,tr.end,va.start,va.end,te.start,te.end],[0,1400,1464,1700,1764,2000]);
  assert.deepEqual([tr.samples,va.samples,te.samples],[1336,172,172]);
  assert.equal(p.totalUsable,1680);
  for(let i=0;i<p.parts.length-1;i++)assert.equal(p.parts[i].end,p.parts[i+1].start);
  assert.deepEqual([g1.end-g1.start,g2.end-g2.start],[64,64]);
});
test('time partition: long purge reports empty fold, never negative samples',()=>{
  const p=A.timePartitions(100,{train:.65,val:.15,window:64,gap:30});
  assert.ok(p.warnings.length);assert.ok(p.parts.every(t=>t.samples>=0));
});
test('split adviser differentiates unseen cells, future series, group holdout and CLI limits',()=>{
  assert.equal(A.chooseSplit({goal:'new_battery'}).unit,'battery');
  assert.equal(A.chooseSplit({goal:'future'}).unit,'time');
  assert.ok(A.chooseSplit({task:'rul',goal:'new_cycle'}).warnings.some(s=>s.includes('RUL')));
  assert.ok(A.chooseSplit({task:'soc',goal:'limited',batteryCount:2}).warnings.length>0);
  assert.throws(()=>A.chooseSplit({goal:'future',batteryCount:-3}),/Invalid/);
});
test('22 source excerpts correspond to the actual Python model registry',()=>{
  const ids=Object.keys(modelCode.models);assert.equal(ids.length,22);
  for(const [id,d] of Object.entries(modelCode.models)){
    assert.ok(d.build.length>15,id);assert.ok(d.forward.length>10,id);
    assert.equal(d.source,'cellscope/models.py');
    assert.ok(src.includes(id),`original source missing model ${id}`);
  }
  const crypto=require('node:crypto');assert.equal(modelCode.sha256,crypto.createHash('sha256').update(src).digest('hex'));
});
test('main page carries accessible responsive mascot, two languages and no remote executable scripts',()=>{
  for(const id of ['mascot-toggle','assistant-panel','assistant-form','language-select','adv-grid','model-source-code','regression-output','class-output','quiz-options'])assert.ok(page.includes(`id="${id}"`));
  assert.ok(page.includes('<body class="light">'));
  assert.ok(page.includes('aria-expanded="false"'));
  const scripts=[...page.matchAll(/<script[^>]+src="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(scripts.length,10);assert.ok(scripts.every(s=>s.startsWith('./assets/')));
});
test('curated educational catalog spans all 4 learning phases and 16 known time-series issues',()=>{
  const data=fs.readFileSync(path.join(__dirname,'../web/assets/academy-data.js'),'utf8');
  for(const token of ['Data foundations','Features and models','Evaluation and evidence','Optimization and robustness','Right-censoring','Overlapping-window leakage'])assert.ok(data.includes(token));
});

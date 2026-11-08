const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const Core=require('../web/assets/core.js');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../web/assets/models.js'),'utf8'),context);
const Designs=context.window.CellModels;

test('22 executable models have 22 unique architecture diagrams',()=>{
  assert.equal(Core.MODELS.length,22);
  assert.equal(Designs.designs.length,22);
  assert.deepEqual([...Core.MODELS].sort(),Array.from(Designs.designs,d=>d.id).sort());
});
test('all architecture diagrams have coherent five-part stages',()=>{
  for(const m of Designs.designs){
    assert.ok(m.name.length && m.desc.length && m.tags.length && m.family.length,m.id);
    for(const task of ['soc','soh']){
      const w=64,f=task==='soc'?3:5;
      const rows=Designs.stages(m.id,w,task);
      assert.ok(rows.length>=3,m.id);
      assert.ok(rows.every(r=>r.length===5),m.id);
      assert.match(rows.at(-1)[2],/B × 1/);
    }
  }
});
test('all 22 model names export executable JSON configurations',()=>{
  for(const m of Core.MODELS){
    const c=Core.experimentConfig({task:'soc',model:m,window:64,seed:42});
    assert.equal(c.model,m);
    assert.equal(c.train.n_estimators,80);
    assert.equal(c.train.n_neighbors,5);
  }
});

test('compare report validation rejects fake and accepts machine result',()=>{
  const x={schema_version:'cellscope-comparison-v1',task:'soc',source_sha256:'a'.repeat(64),models:[{model:'ridge',val_rmse:.1,test_rmse:.2,test_mae:.1,test_n:23}]};
  assert.equal(Core.validComparison(x),true);
  assert.equal(Core.validComparison({...x,models:[...x.models,...x.models]}),false);
  assert.equal(Core.validComparison({...x,task:'other'}),false);
});

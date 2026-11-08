/* CellScope Academy: deterministic, dependency-free teaching calculators.
   These calculations run on the visitor's inputs, not on fabricated benchmarks. */
(function(root){
'use strict';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const ratio=(a,b)=>b===0?null:a/b;
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
function parseNumbers(raw){
  const tokens=String(raw).trim().split(/[\s,;，；]+/).filter(Boolean);
  if(!tokens.length||tokens.length>10000)throw Error('Provide 1–10,000 finite numbers');
  const out=tokens.map(Number);
  if(out.some((v,i)=>!finite(v)||!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(tokens[i])))throw Error('Only finite numeric values allowed');
  return out;
}
function regression(y,p,{zeroTolerance=1e-8}={}){
  if(!Array.isArray(y)||!Array.isArray(p)||!y.length||y.length!==p.length||y.some(v=>!finite(v))||p.some(v=>!finite(v)))throw Error('Equal nonempty finite vectors required');
  const errors=p.map((v,i)=>v-y[i]), n=y.length;
  const abs=errors.map(Math.abs), mse=mean(errors.map(e=>e*e)), avg=mean(y);
  const varianceSum=y.reduce((a,v)=>a+(v-avg)**2,0);
  const eligible=y.map((v,i)=>[v,i]).filter(([v])=>Math.abs(v)>zeroTolerance);
  const ape=eligible.map(([v,i])=>Math.abs(errors[i]/v)*100);
  const smape=errors.map((e,i)=>Math.abs(y[i])+Math.abs(p[i])>zeroTolerance?200*Math.abs(e)/(Math.abs(y[i])+Math.abs(p[i])):null).filter(finite);
  const sorted=[...abs].sort((a,b)=>a-b);
  return {n,mse,rmse:Math.sqrt(mse),mae:mean(abs),bias:mean(errors),maxae:Math.max(...abs),medae:n%2?sorted[(n-1)/2]:(sorted[n/2-1]+sorted[n/2])/2,
    r2:varianceSum>0?1-errors.reduce((a,e)=>a+e*e,0)/varianceSum:null,
    nrmse_range:Math.max(...y)-Math.min(...y)>0?Math.sqrt(mse)/(Math.max(...y)-Math.min(...y)):null,
    mape:ape.length?mean(ape):null,mape_eligible:ape.length,smape:smape.length?mean(smape):null,smape_eligible:smape.length};
}
function binary(labels,scores,threshold=.5){
  if(!Array.isArray(labels)||!Array.isArray(scores)||labels.length!==scores.length||!labels.length||labels.some(y=>y!==0&&y!==1)||scores.some(s=>!finite(s))||!finite(threshold))throw Error('Binary 0/1 labels and finite scores required');
  let tp=0,tn=0,fp=0,fn=0;
  labels.forEach((y,i)=>{const pred=scores[i]>=threshold?1:0;if(y===1&&pred===1)tp++;else if(y===1)fn++;else if(pred===1)fp++;else tn++;});
  const precision=ratio(tp,tp+fp),recall=ratio(tp,tp+fn),specificity=ratio(tn,tn+fp),accuracy=(tp+tn)/labels.length,
    f1=ratio(2*tp,2*tp+fp+fn), balancedAccuracy=recall===null||specificity===null?null:(recall+specificity)/2,
    mccDen=Math.sqrt((tp+fp)*(tp+fn)*(tn+fp)*(tn+fn)),mcc=ratio(tp*tn-fp*fn,mccDen);
  const positives=labels.flatMap((v,i)=>v===1?[scores[i]]:[]),negatives=labels.flatMap((v,i)=>v===0?[scores[i]]:[]);
  let auc=null;
  if(positives.length&&negatives.length){let wins=0;for(const a of positives)for(const b of negatives)wins+=a>b?1:a===b?.5:0;auc=wins/(positives.length*negatives.length);}
  return {n:labels.length,tp,tn,fp,fn,precision,recall,specificity,accuracy,f1,balancedAccuracy,mcc,auc,threshold};
}
function timePartitions(n,{train=.7,val=.15,window=64,gap=64}={}){
  if(!Number.isInteger(n)||n<3||!finite(train)||!finite(val)||!Number.isInteger(window)||window<1||!Number.isInteger(gap)||gap<0||train<=0||val<=0||train+val>=1)throw Error('Invalid chronological split');
  // Split original raw samples FIRST; windows are formed separately inside each segment.
  const t=Math.floor(n*train),v=Math.floor(n*(train+val));
  const pieces=[
    {name:'train',start:0,end:t},
    {name:'purge',start:t,end:Math.min(v,t+gap)},
    {name:'val',start:Math.min(v,t+gap),end:v},
    {name:'purge',start:v,end:Math.min(n,v+gap)},
    {name:'test',start:Math.min(n,v+gap),end:n}
  ];
  const parts=pieces.map(p=>({...p,samples:p.name==='purge'?0:Math.max(0,p.end-p.start-window)}));
  const warnings=[];
  if(parts.some(p=>p.name!=='purge'&&p.samples===0))warnings.push('One or more partitions contain no usable windows');
  if(gap===0)warnings.push('No embargo: ensure no cross-partition features/labels and no delayed leakage');
  return {parts,warnings,totalUsable:parts.reduce((a,p)=>a+p.samples,0),n};
}
function chooseSplit({task='soc',goal='new_battery',batteryCount=8,cycleCount=4}={}){
  if(!['soc','soh','rul','safety'].includes(task)||!Number.isInteger(batteryCount)||!Number.isInteger(cycleCount)||batteryCount<1||cycleCount<1)throw Error('Invalid research scenario');
  const choices={new_battery:['battery','Battery-group holdout / GroupKFold','All cycles from a cell stay together; evaluate unseen cell IDs'],future:['time','Chronological holdout + purge','Only past records train; preserve order, group boundaries and prediction horizon'],new_cycle:['cycle','Leave-one-cycle-out (within cell)','Assesses unseen cycles on known cells, not transfer to unseen batteries'],new_condition:['condition','Leave-one-condition-out','Hold out a complete protocol or temperature; group identity audit remains essential'],limited:['lobo','Leave-one-battery-out','Rotate the held-out battery; keep separate validation inside training batteries']};
  if(!choices[goal])throw Error('Unknown scenario');
  const [unit,title,rationale]=choices[goal], warnings=[];
  if(['battery','lobo'].includes(unit)&&batteryCount<3)warnings.push('At least three independent batteries are recommended for separate train/validation/test units');
  if(unit==='cycle'&&cycleCount<3)warnings.push('Few cycles: high variance and dependent samples');
  if(task==='rul'&&unit==='cycle')warnings.push('RUL / full-life claims require full-cell trajectories and observed EOL; avoid dividing one life across sets');
  if(unit==='time')warnings.push('Only supports forecasting a known series; not an independent-battery generalization claim');
  if(unit==='condition')warnings.push('A temperature/protocol holdout is not equivalent to an independent-cell holdout unless cell IDs are also disjoint');
  if(unit!=='battery'&&unit!=='cycle')warnings.push('Current CLI exports battery/cycle splits only; this is an educational recommendation, not a runnable mode');
  return {unit,title,rationale,warnings};
}
const exports={parseNumbers,regression,binary,timePartitions,chooseSplit};
if(typeof module!=='undefined'&&module.exports)module.exports=exports;
root.CellAcademyCore=exports;
})(typeof window!=='undefined'?window:globalThis);

/* CellScope Academy v0.4 — original offline-first interactive learning UI.
   Educational advisor: rule/template-based, NOT a generative AI or diagnosis service.
   Every dynamic string is rendered as textContent; no user input becomes HTML. */
(function(root){
'use strict';
const Core=root.CellAcademyCore, Data=root.CellAcademyData, Sources=root.CellModelCode;
if(!Core||!Data||!Sources)throw Error('CellScope Academy dependencies are missing');
const $=id=>document.getElementById(id), en=()=>document.documentElement.lang==='en';
const tx=(zh,eng)=>en()?eng:zh;
const loc=obj=>obj?(en()?obj.en:obj.zh):'';
const el=(name,text,cls)=>{const e=document.createElement(name);if(text!==undefined&&text!==null)e.textContent=String(text);if(cls)e.className=cls;return e;};
const txt=(id,val)=>{const p=$(id);if(p)p.textContent=String(val);};
const on=(id,type,fn)=>{const e=$(id);if(!e)throw Error('Missing control '+id);e.addEventListener(type,fn);};
const safeLink=u=>{try{const a=new URL(u);return a.protocol==='https:'?a.href:null;}catch{return null;}};
const fmt=(x,d=4)=>x===null||!Number.isFinite(x)?'N/A':Number(x).toFixed(d);
let stageIndex=0, activeIssue='gaps', activeComp='relu', selectedCode='rdb_attn_bilstm', codeTab='build';
let metricMode='regression', quizIndex=0, quizChoice=null, quizChecked=false, quizScore=0;
let advDB=[],advPapers=[],advReady=false,advLimit=18,advMode='offline',assistantVisible=false;
function scrollToId(id){const e=$(id);if(e)e.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}

function academyRender(){
  const roadmap=$('academy-roadmap');roadmap.replaceChildren();
  Data.stages.forEach((part,i)=>{
    const button=el('button',null,'roadmap-step'+(i===stageIndex?' selected':''));button.type='button';button.setAttribute('role','tab');button.setAttribute('aria-selected',String(i===stageIndex));button.dataset.stage=String(i);
    button.append(el('span',`0${i+1} / ${part.tag}`,'roadmap-index'),el('strong',loc(part.name)),el('small',loc(part.lead)));
    button.addEventListener('click',()=>{stageIndex=i;academyRender();});roadmap.append(button);
  });
  const p=Data.stages[stageIndex];txt('academy-stage-tag',`PART ${p.part} / ${p.tag}`);txt('academy-stage-title',loc(p.name));txt('academy-stage-lead',loc(p.lead));
  const holder=$('academy-lessons');holder.replaceChildren();p.lessons.forEach((entry,i)=>{
    const b=el('button',null,'lesson-card');b.type='button';b.append(el('span',String(i+1).padStart(2,'0'),'lesson-index'),el('strong',loc(entry.name)),el('span','↗','lesson-more'));
    b.addEventListener('click',()=>{holder.querySelectorAll('button').forEach(x=>x.classList.toggle('selected',x===b));txt('academy-feedback',loc(entry.desc));});holder.append(b);
  });
  txt('academy-feedback',tx('选择课程卡片，了解它在真实电池实验中的作用与边界。','Choose a lesson to see its scientific rationale and limits.'));
}

// Non-destructive linked view of the author's separate ADV·BATTERY catalog.
const ADV='https://raw.githubusercontent.com/jimjury/ADV-BATTERY-Dataset-Collection/main/data/';
function fallbackADV(){
  return (root.CELLSCOPE_CATALOG||[]).map(d=>({id:d.id,name_zh:d.name,name_en:d.name,chemistry:d.chemistry,resource_type:d.type,year:null,institution:'CellScope curated source',research_tags:d.focus,description_zh:d.notes,source_url:d.source,access_url:d.source,license_as_recorded:d.license,related_paper_ids:[],download_catalog_status:'not_verified'}));
}
async function loadAdv(){
  txt('adv-status',tx('正在读取 ADV·BATTERY 公共目录…','Loading public ADV·BATTERY catalog…'));
  const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),7000);
  try{
    const urls=['datasets.json','papers.json'];
    const data=await Promise.all(urls.map(async f=>{
      const response=await fetch(ADV+f,{mode:'cors',cache:'no-store',signal:ctrl.signal});
      if(!response.ok)throw Error('HTTP '+response.status+' '+f);
      const body=await response.json();if(!Array.isArray(body))throw Error('Catalog is not an array');return body;
    }));
    const valid=data[0].filter(d=>d&&typeof d.id==='string'&&typeof d.name_zh==='string'&&safeLink(d.source_url||d.access_url||''));
    if(valid.length<30)throw Error('Too few usable entries');
    advDB=valid;advPapers=data[1].filter(d=>d&&typeof d.id==='string');advReady=true;advMode='live';
    txt('adv-status',tx(`已连接主目录：${advDB.length} 条资源，${advPapers.length} 条文献/目录记录。数据目录不等于已下载数据。`,`Live index connected: ${advDB.length} resources, ${advPapers.length} literature/catalog records. Catalog is not downloadable measurements.`));
  }catch(error){
    advDB=fallbackADV();advPapers=[];advMode='offline';advReady=true;
    txt('adv-status',tx(`当前未能联网读取 ADV 目录（${error.name==='AbortError'?'连接超时':'连接被拒绝或离线'}）。现展示 ${advDB.length} 条内置来源。点击“刷新”可重试；完整目录见原仓库。`,`ADV index unavailable (${error.name==='AbortError'?'timeout':'offline/blocked'}). Showing ${advDB.length} curated fallback sources. Use Refresh or visit ADV for full catalog.`));
  }finally{clearTimeout(timeout);advLimit=18;renderAdv();}
}
function renderAdv(){
  if(!advReady)return;
  const query=$('adv-search').value.trim().toLowerCase(),tag=$('adv-task').value;
  const selected=advDB.filter(d=>(tag==='all'||(Array.isArray(d.research_tags)&&d.research_tags.some(v=>String(v).toUpperCase()===tag)))&&
    [d.name_zh,d.name_en,d.chemistry,d.institution,d.description_zh,(d.research_tags||[]).join(' ')].join(' ').toLowerCase().includes(query));
  const stats=$('adv-stats');stats.replaceChildren();
  [[advDB.length,tx('目录资源','Index resources')],[advPapers.length,tx('关联论文目录','Paper entries')],[selected.length,tx('当前匹配','Matching records')]].forEach(([value,label])=>{
    const node=el('div',null,'adv-stat');node.append(el('strong',value),el('small',label));stats.append(node);
  });
  const parent=$('adv-grid');parent.replaceChildren();selected.slice(0,advLimit).forEach(d=>{
    const button=el('button',null,'adv-card');button.type='button';const caption=[(d.research_tags||[]).slice(0,3).join(' · ')||'SOURCE',d.year||'—'].join(' / ');
    button.append(el('span',caption,'adv-caption'),el('h3',en()?(d.name_en||d.name_zh):d.name_zh),el('p',[d.institution,d.chemistry].filter(Boolean).join(' · ')),el('span',tx('来源 / 文献 ↗','Source / Papers ↗'),'adv-open'));
    button.addEventListener('click',()=>showAdv(d));parent.append(button);
  });
  if(selected.length>advLimit){const more=el('button',tx(`加载更多（余下 ${selected.length-advLimit} 条）`,`Load more (${selected.length-advLimit} left)`),'outline-btn adv-more');more.type='button';more.addEventListener('click',()=>{advLimit+=18;renderAdv();});parent.append(more);}
  if(!selected.length)parent.append(el('p',tx('没有匹配的资源。试试更宽泛的关键词或任务筛选。','No matching resources. Try a broader query.'),'foot-status'));
}
function showAdv(d){
  const holder=$('adv-detail-body');holder.replaceChildren();txt('adv-detail-title',en()?(d.name_en||d.name_zh):d.name_zh);
  const items=[['ID',d.id],[tx('机构','Institution'),d.institution],[tx('电池体系','Chemistry'),d.chemistry],[tx('年份','Year'),d.year],[tx('研究标签','Tags'),(d.research_tags||[]).join(' / ')],
    [tx('数据格式','Formats'),(d.formats||[]).join(', ')],[tx('实验条件','Test conditions'),d.test_conditions_note],[tx('资源许可（仅目录记录）','License (catalog statement)'),d.license_as_recorded],[tx('链接状态','Link verification'),d.download_catalog_status],[tx('内容介绍','Description'),en()?d.description_en||d.description_zh:d.description_zh]];
  const dl=el('dl',null,'adv-dl');for(const [label,value] of items){if(value===undefined||value===null||value==='')continue;dl.append(el('dt',label),el('dd',value));}holder.append(dl);
  const links=el('div',null,'adv-links');for(const [caption,url] of [[tx('官方来源','Original provider'),d.source_url],[tx('访问入口','Access / download'),d.access_url]]){
    const u=safeLink(url);if(!u)continue;const a=el('a',caption+' ↗','outline-btn');a.href=u;a.rel='noopener noreferrer';a.target='_blank';links.append(a);
  }holder.append(links);
  const paperTitle=el('h4',tx('相关论文与目录项','Related papers / records'));holder.append(paperTitle);
  const paperIds=new Set(d.related_paper_ids||[]),matched=advPapers.filter(p=>paperIds.has(p.id)||(p.linked_dataset_ids||[]).includes(d.id));
  const listing=el('ul',null,'adv-paper-list');matched.slice(0,12).forEach(p=>{
    const li=el('li'),url=safeLink(p.url);if(url){const a=el('a',p.title);a.href=url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);}else li.textContent=p.title;listing.append(li);
  });if(!matched.length)listing.append(el('li',tx('此条目没有可核对的已配对论文；请到原仓库查看。','No verified paper link in this index; inspect the original catalog.')));holder.append(listing);
  $('adv-detail').hidden=false;$('adv-detail').scrollIntoView({block:'nearest',behavior:'smooth'});
}

function renderIssues(){
  const q=$('issue-search').value.trim().toLowerCase(),r=$('issue-risk').value;
  const holder=$('issue-grid');holder.replaceChildren();
  Data.issues.filter(i=>(r==='all'||i.risk===r)&&[loc(i.name),loc(i.cause),loc(i.fix)].join(' ').toLowerCase().includes(q)).forEach((i,k)=>{
    const b=el('button',null,'issue-card'+(activeIssue===i.id?' selected':''));b.type='button';b.setAttribute('aria-pressed',String(activeIssue===i.id));b.append(el('span',i.risk==='high'?tx('需重点检查','HIGH PRIORITY'):tx('常见问题','COMMON'),'issue-risk'),el('strong',loc(i.name)),el('small',tx('症状 / 原因 / 修复建议 ↗','Symptom / cause / repair ↗')));b.addEventListener('click',()=>{activeIssue=i.id;renderIssues();renderIssueDetail(i);});holder.append(b);
  });
  const issue=Data.issues.find(i=>i.id===activeIssue)||Data.issues[0];renderIssueDetail(issue);
}
function renderIssueDetail(item){txt('issue-name',loc(item.name));txt('issue-cause',loc(item.cause));txt('issue-fix',loc(item.fix));}

function renderAdvisor(){
  try{const task=$('advisor-task').value,goal=$('advisor-goal').value,batteryCount=Number($('advisor-cells').value),cycleCount=Number($('advisor-cycles').value);
    const v=Core.chooseSplit({task,goal,batteryCount,cycleCount});
    const zh={battery:['电芯级分组留出 / GroupKFold','同一电芯的全部循环应处于一个集合；用独立 cell_id 检查泛化能力。'],time:['时间前向切分＋边界隔离','训练只看过去；先切分原始时间，再在各自分区构建窗口，禁止跨边界特征和标签泄漏。'],cycle:['同一电芯下留一循环','用于研究已知电芯新循环；不能将其称为新电芯独立测试。'],condition:['留一完整温度/驾驶工况','目标工况必须整体留出；若源目标电芯相同，还需单独披露电芯依赖性。'],lobo:['逐个留一电芯（LOBO）','每轮完整留出一个电芯，训练侧需要独立验证，而不是利用留出电芯选超参数。']};
    txt('advisor-title',tx(zh[v.unit]?.[0]||v.title,v.title));txt('advisor-rationale',tx(zh[v.unit]?.[1]||v.rationale,v.rationale));
    const ul=$('advisor-warnings');ul.replaceChildren();v.warnings.forEach(w=>{const cn=w.includes('At least three')?'少于三个独立电芯时，很难同时构成互斥训练、验证和测试集合。':w.includes('Few cycles')?'循环数过少，留一循环的方差可能很大。':w.includes('RUL')?'完整 RUL 寿命泛化必须按完整电芯轨迹划分，且确认真实 EOL。':w.includes('Only supports forecasting')?'时间前向实验只能证明已知系列的未来预测，不证明未知电芯泛化。':w.includes('temperature/protocol')?'跨工况和温度留出仍需审计电芯是否重复。':w.includes('Current CLI')?'当前 CLI 只有电池级与循环级划分；这个方案属于教学建议。':w;ul.append(el('li',tx(cn,w)));});
    if(!v.warnings.length)ul.append(el('li',tx('此方案仍需核验分组身份、标签定义和推理时可用信息。','Still audit cell IDs, labels and feature observability.')));
    txt('advisor-cli-note',v.unit==='battery'||v.unit==='cycle'?tx('✓ 可参考当前 CLI 的同名划分，但仍须核对具体实验对象。','CLI supports this named unit; audit your actual protocol.'):
      tx('注意：这是科研划分建议，当前 CLI 不支持一键运行此模式。','Educational recommendation only: this split is not directly runnable by the current CLI.'));
  }catch(error){txt('advisor-title',tx('输入有误','Invalid scenario'));txt('advisor-rationale',error.message);$('advisor-warnings').replaceChildren();}
}
function renderChrono(){
  try{
    const n=Number($('chrono-n').value),window=Number($('chrono-w').value),gap=Number($('chrono-gap').value);
    const p=Core.timePartitions(n,{train:.7,val:.15,window,gap});const bar=$('chrono-bar');bar.replaceChildren();
    p.parts.filter(x=>x.end>x.start).forEach((s,i)=>{const block=el('div',s.name==='purge'?'∥':s.name.toUpperCase(),'chrono-segment '+s.name);block.style.flex=`${s.end-s.start} 1 0px`;block.title=`${s.name}: [${s.start}, ${s.end})`;bar.append(block);});
    const stats=$('chrono-stats');stats.replaceChildren();['train','val','test'].forEach(k=>{
      const part=p.parts.find(v=>v.name===k);const box=el('div',null,'chrono-stat');box.append(el('b',part.samples),el('span',`${k.toUpperCase()} ${tx('可用样本','valid windows')}`));stats.append(box);
    });txt('chrono-warning',p.warnings.length?p.warnings.join(' / '):tx(`总计 ${p.totalUsable} 个可用窗口（预测下一个时刻）。先切分，再造窗；没有跨边界复用。`,`Total ${p.totalUsable} valid next-step windows. Partition first, window second.`));
    $('chrono-warning').classList.toggle('warning',p.warnings.length>0);
  }catch(error){txt('chrono-warning',error.message);$('chrono-bar').replaceChildren();$('chrono-stats').replaceChildren();}
}

const codeGuides={
 mean:['均值回归只记录训练目标平均数；用于检测是否至少超过常数基线。','The mean predictor stores only the mean training label; start with a sanity baseline.'],
 linear:['对窗口张量展平后进行线性最小二乘；解释系数前应关注强相关特征。','Flattens windows for ordinary linear regression; correlated inputs complicate coefficient interpretation.'],
 ridge:['L2 惩罚抑制高维滑窗特征系数，正则强度由训练侧验证确定。','L2-regularized regression stabilizes high-dimensional windows; tune strength on validation.'],
 elasticnet:['同时采用 L1/L2 正则以收缩系数；不等于已得到可解释的因果特征。','Combines L1 and L2 shrinkage; selected coefficients are not causal explanations.'],
 knn:['在归一化特征空间检索相邻训练样本，可能受样本密度与维度影响。','Retrieves nearby train samples in normalized space; watch high-dimensional distance effects.'],
 svr:['核方法拟合非线性关系；惩罚系数 C 与误差带参数依赖特征尺度。','Kernel SVR captures nonlinear relationships, sensitive to feature scaling and C/epsilon.'],
 random_forest:['多棵自助采样树投票/平均，可作为非线性基线。','An ensemble of bagged trees predicts by averaging, a useful nonlinear baseline.'],
 extra_trees:['极随机树引入更随机的分裂，常用作树模型消融对照。','Extremely randomized trees provide a different variance-bias tradeoff.'],
 hist_gbdt:['直方图梯度提升树迭代拟合残差，注意树深与迭代预算。','Histogram gradient boosting fits residuals iteratively; track depth and iteration budget.'],
 mlp:['展平窗口后通过全连接层回归；时间顺序不再由网络显式建模。','Fully connected network on flattened windows; temporal order is not explicitly encoded.'],
 cnn:['一维卷积提取短时变化，再经聚合和回归头预测。','Temporal Conv1d encodes local waveform features before pooling and regression.'],
 gru:['单向门控循环单元依次处理历史输入，最后隐状态进入回归头。','A gated recurrent encoder processes observed history and predicts from its final state.'],
 lstm:['LSTM 的输入/遗忘/输出门管理记忆状态，基于已知历史预测。','LSTM gates manage recurrent state; prediction uses only the observed history.'],
 bigru:['BiGRU 在已知的历史窗口内双向编码，不可以访问目标时刻之后的数据。','Bidirectional GRU reads the available history window only, not future target observations.'],
 bilstm:['BiLSTM 使用两个方向的历史窗口表示；需严格保证窗口截止时刻。','Bidirectional LSTM processes the known history; the window must stop before prediction time.'],
 transformer:['时序位置编码配合自注意力对窗口中不同时间点聚合信息。','Position-aware self-attention combines the observed window before regression.'],
 dlinear:['分别提取趋势与残差并线性投影，检验复杂网络是否真正必要。','Separates trend and residual, then applies linear projections as an efficient baseline.'],
 tcn:['膨胀卷积扩展历史感受野，修剪右侧填充避免未来污染。','Dilated temporal convolutions expand receptive field, with causal cropping.'],
 cnn_gru:['CNN 提取局部变化后交给 GRU 汇总序列动态，适合做模块消融。','CNN extracts local features then GRU summarizes sequence dynamics; compare individual blocks.'],
 patchtst_lite:['以局部 Patch 作为 Token 进行注意力建模；这是简化变体，不是论文严格复现。','Patch tokens with self-attention; a reduced implementation, not exact PatchTST reproduction.'],
 itransformer_lite:['把特征通道视为 token，建模通道间依赖；仅为 iTransformer 启发版。','Treats feature channels as tokens; a simplified iTransformer-inspired architecture.'],
 rdb_attn_bilstm:['深度可分离残差卷积＋BiLSTM＋单头注意力；逐层检查维度/残差分支。','Depthwise residual convolution, BiLSTM and attention; audit tensor and residual shapes.']
};
const tabGuides={
 build:['构造：检查实际 Python 模块声明、卷积核/隐藏维度、参数与层连接。','Construction: inspect the actual layers, kernel sizes, hidden widths and connections.'],
 forward:['前向：追踪 B×W×F 输入到预测张量的流动，检查转置、聚合与因果时间边界。','Forward: trace B×W×F through transpose, aggregation and output without future access.'],
 training:['训练：识别随机种子、反向传播、优化器和验证权重选择。所有模型共用训练接口，片段需在完整源码中理解。','Training: inspect seeds, backprop, optimizer and validation checkpoint selection; use the full source for context.']
};

function renderCode(){
  const info=Sources.models[selectedCode];if(!info)return;
  $('code-model').value=selectedCode;
  const d=root.CellModels?.map?.[selectedCode];txt('code-title',d?.name||selectedCode);
  txt('code-model-summary',(codeGuides[selectedCode]||[])[en()?1:0]||d?.desc||info.notes[0]);txt('code-model-caveat',tx('源码只是训练代码节选，需结合完整文件、数据协议与运行环境。',info.notes.join(' ')));
  const code=codeTab==='training'?Sources.training:info[codeTab];txt('model-source-code',code);txt('code-tab-explain',(tabGuides[codeTab]||tabGuides.build)[en()?1:0]);
  txt('code-status',tx(`来自 ${info.source} 的真实片段，源码 SHA256 ${Sources.sha256.slice(0,12)}…；上下文省略，不可单独运行。`,`Real excerpt from ${info.source}, source SHA256 ${Sources.sha256.slice(0,12)}…; context omitted, not standalone.`));
  document.querySelectorAll('[data-code-tab]').forEach(b=>{const active=b.dataset.codeTab===codeTab;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));});
}
function setModelForCode(id){if(!Sources.models[id])return;selectedCode=id;renderCode();}

const groupOf=(id)=>['relu','gelu','sigmoid','tanh','softmax','dropout','batchnorm','layernorm'].includes(id)?'activation':
    ['adam','adamw','sgd','weight_decay','early_stop','grad_clip','lr'].includes(id)?'training':
    ['lstm','gru','attention','conv','residual'].includes(id)?'architecture':'analysis';
function renderComponents(){
  const q=$('component-search').value.trim().toLowerCase(),group=$('component-group').value;
  const holder=$('component-grid');holder.replaceChildren();
  Data.components.filter(c=>(group==='all'||groupOf(c.id)===group)&&[c.name,loc(c.desc),loc(c.tip)].join(' ').toLowerCase().includes(q)).forEach(c=>{
    const b=el('button',null,'component-card'+(activeComp===c.id?' selected':''));b.type='button';b.setAttribute('aria-pressed',String(activeComp===c.id));
    b.append(el('span',groupOf(c.id).toUpperCase(),'component-meta'),el('strong',c.name),el('small',loc(c.desc)));b.addEventListener('click',()=>{activeComp=c.id;renderComponents();});holder.append(b);
  });
  const found=Data.components.find(c=>c.id===activeComp)||Data.components[0];
  txt('component-name',found.name);txt('component-desc',loc(found.desc));txt('component-formula',found.formula);txt('component-tip',loc(found.tip));drawActivation(found.id);
}
function drawActivation(id){
  const canvas=$('component-chart'),ctx=canvas.getContext('2d');if(!ctx)return;
  const width=Math.max(260,Math.floor(canvas.getBoundingClientRect().width||420));const h=215,dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=width*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,h);
  const rootStyle=getComputedStyle(document.body),outline=rootStyle.getPropertyValue('--outline')||'#b6ccd6';
  const x0=width/2,y0=h/2,amp=Math.min(38,width/11);
  ctx.strokeStyle=outline;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(20,y0);ctx.lineTo(width-20,y0);ctx.moveTo(x0,10);ctx.lineTo(x0,h-10);ctx.stroke();
  const f={relu:x=>Math.max(0,x),gelu:x=>x*.5*(1+Math.tanh(Math.sqrt(2/Math.PI)*(x+.044715*x**3))),sigmoid:x=>1/(1+Math.exp(-x)),tanh:Math.tanh};
  if(!f[id]){ctx.font='12px sans-serif';ctx.fillStyle=rootStyle.getPropertyValue('--muted')||'#546d7b';ctx.textAlign='center';ctx.fillText(tx('此概念以公式与说明为主','Formula and explanation view'),width/2,y0+42);return;}
  ctx.strokeStyle='#0e817a';ctx.lineWidth=3;ctx.beginPath();for(let px=20;px<width-20;px++){
    const x=(px-x0)/amp,y=y0-f[id](x)*amp;if(px===20)ctx.moveTo(px,y);else ctx.lineTo(px,y);
  }ctx.stroke();ctx.font='11px sans-serif';ctx.fillStyle=rootStyle.getPropertyValue('--muted')||'#546d7b';ctx.textAlign='left';ctx.fillText('x',width-16,y0-5);ctx.fillText(id.toUpperCase(),16,19);
}

function calcRegression(){
  try{const y=Core.parseNumbers($('metric-true').value),p=Core.parseNumbers($('metric-pred').value),task=$('metric-task').value;
    const m=Core.regression(y,p);const holder=$('regression-output');holder.replaceChildren();
    const labels=[['MAE',m.mae],['RMSE',m.rmse],['MSE',m.mse],['R²',m.r2],['BIAS',m.bias],['Median AE',m.medae],['MAX |ERROR|',m.maxae],['NRMSE (range)',m.nrmse_range],['MAPE (%)',m.mape],['SMAPE (%)',m.smape]];
    if(task==='soc'){
      const lowIdx=y.flatMap((v,i)=>v<=0.2?[i]:[]);
      const low=lowIdx.length?Core.regression(lowIdx.map(i=>y[i]),lowIdx.map(i=>p[i])):null;
      labels.push([`Low SOC RMSE (N=${lowIdx.length})`,low?.rmse??null]);
      labels.push(['Low SOC MAE',low?.mae??null]);
    }
    labels.forEach(([name,val])=>{const e=el('div',null,'score-card');e.append(el('small',name),el('strong',fmt(val,4)));holder.append(e);});
    const units=task==='rul'?tx('循环数（若标签为循环）','cycles (if labeled cycles)'):tx('比例值；×100 得百分比点 pp','fractions; ×100 gives percentage points (pp)');
    txt('regression-explain',tx(`样本 ${m.n} 条。误差单位：${units}。MAPE 排除 |真实值|≤1e-8 的 ${m.n-m.mape_eligible} 项；有效项 ${m.mape_eligible}/${m.n}。常数目标的 R² 不定义。`,`N=${m.n}. Error units: ${units}. MAPE excludes ${m.n-m.mape_eligible} near-zero targets; eligible ${m.mape_eligible}/${m.n}. R² undefined for constant truth.`));
    $('regression-explain').classList.remove('warning');
  }catch(error){$('regression-output').replaceChildren();txt('regression-explain',tx('输入错误：','Invalid input: ')+error.message);$('regression-explain').classList.add('warning');}
}
function calcClass(){
  try{const labels=Core.parseNumbers($('class-true').value),scores=Core.parseNumbers($('class-score').value);
    if(scores.some(x=>x<0||x>1))throw Error('Scores must be in [0, 1]');
    const threshold=Number($('class-threshold').value);const m=Core.binary(labels,scores,threshold);
    txt('class-threshold-value',threshold.toFixed(2));const holder=$('class-output');holder.replaceChildren();
    [['Accuracy',m.accuracy],['Precision',m.precision],['Recall',m.recall],['Specificity',m.specificity],['F1',m.f1],['Balanced Acc',m.balancedAccuracy],['MCC',m.mcc],['ROC-AUC',m.auc]].forEach(([name,val])=>{
      const e=el('div',null,'score-card');e.append(el('small',name),el('strong',fmt(val,3)));holder.append(e);
    });
    const cf=$('confusion-grid');cf.replaceChildren();[['TP',m.tp],['FN',m.fn],['FP',m.fp],['TN',m.tn]].forEach(([name,num])=>{const card=el('div',null,'confusion-cell '+name.toLowerCase());card.append(el('small',name),el('strong',num));cf.append(card);});
    txt('class-explain',tx(`阈值 ${threshold.toFixed(2)}。ROC-AUC ${m.auc===null?'未定义（需同时有正负例）':'使用连续评分进行排序计算，不随阈值改变'}。Precision/Recall/F1 在分母为 0 时显示 N/A。`,`Threshold ${threshold.toFixed(2)}. AUC ${m.auc===null?'undefined (both classes required)':'is ranked from continuous scores, independent of threshold'}. Undefined precision/recall/F1 show N/A.`));
    $('class-explain').classList.remove('warning');
  }catch(error){$('class-output').replaceChildren();$('confusion-grid').replaceChildren();txt('class-explain',tx('输入错误：','Invalid input: ')+error.message);$('class-explain').classList.add('warning');}
}
function setMetricMode(m){metricMode=m;$('regression-lab').hidden=m!=='regression';$('classification-lab').hidden=m!=='classification';
  document.querySelectorAll('[data-metric-type]').forEach(b=>{const active=b.dataset.metricType===m;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));});}

function renderQuiz(){
  const q=Data.quizzes[quizIndex];const total=Data.quizzes.length;
  txt('quiz-progress-text',`${String(quizIndex+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`);
  $('quiz-progress-bar').style.width=`${(quizIndex+1)/total*100}%`;
  txt('quiz-score',tx(`${quizScore} 正确`,`${quizScore} correct`));txt('quiz-question',loc(q.q));
  const holder=$('quiz-options');holder.replaceChildren();q.opts.forEach((v,i)=>{
    const b=el('button',loc(v),'quiz-option'+(quizChoice===i?' selected':''));b.type='button';b.disabled=quizChecked;b.setAttribute('aria-pressed',String(quizChoice===i));
    if(quizChecked){if(i===q.answer)b.classList.add('correct');else if(i===quizChoice)b.classList.add('wrong');}
    b.addEventListener('click',()=>{if(!quizChecked){quizChoice=i;renderQuiz();}});holder.append(b);
  });
  $('quiz-check').disabled=quizChecked||quizChoice===null;
  $('quiz-next').disabled=!quizChecked;
  txt('quiz-next',quizIndex===total-1?tx('查看完成情况 ↗','Finish ↗'):tx('下一题 →','Next →'));
  txt('quiz-feedback',quizChecked?(quizChoice===q.answer?tx('回答正确。','Correct. '):tx('还需要注意：','Review: '))+loc(q.why):
    tx('请选择一个选项后，点击“检查答案”获取解释。','Select one answer, then check for an explanation.'));
}
function initQuiz(){
  on('quiz-check','click',()=>{if(quizChecked||quizChoice===null)return;quizChecked=true;if(quizChoice===Data.quizzes[quizIndex].answer)quizScore++;renderQuiz();});
  on('quiz-next','click',()=>{if(!quizChecked)return;if(quizIndex>=Data.quizzes.length-1){
      txt('quiz-feedback',tx(`完成！共答对 ${quizScore}/${Data.quizzes.length}。可重新开始，或返回学习路线。`,`Complete: ${quizScore}/${Data.quizzes.length}. Restart or revisit the academy.`));$('quiz-next').disabled=true;return;
    }quizIndex++;quizChoice=null;quizChecked=false;renderQuiz();});
  on('quiz-reset','click',()=>{quizIndex=0;quizChoice=null;quizChecked=false;quizScore=0;renderQuiz();});renderQuiz();
}

const canned={
  split:{zh:'先界定部署目标：新电池用电芯分组，已知电池未来预测用时间前向＋必要的边界隔离；同一电芯留一循环不等于独立电芯测试。',en:'Define deployment first: unseen cells require cell-group splits; future on a known cell needs chronological holdout and boundary hygiene. Leave-one-cycle-out is not leave-one-cell-out.',id:'split-lab'},
  metric:{zh:'SOC/SOH/RUL 是回归：优先 RMSE、MAE、Bias、R²，低 SOC 单独报告；分类故障才用 Precision、Recall、F1、ROC-AUC。',en:'SOC/SOH/RUL are regression: use RMSE, MAE, bias, R² and low-SOC subsets. Precision/recall/F1/AUC are for fault classification.',id:'metrics'},
  missing:{zh:'先量化缺失率与最长缺口，分清真缺失和采样频率变化；长时间断点必须分段，禁止跨缺口造窗口；不能为画出光滑曲线而删除真实瞬态。',en:'Quantify missing rates and gaps, separate real gaps from sampling changes; segment long gaps, never build windows across them; do not erase genuine pulses just to smooth plots.',id:'quality'},
  code:{zh:'选择模型后查看当前仓库真实源码提取的构建/前向/训练片段；对照形状和模块说明，并点击链接查看完整 Python。',en:'Pick a model to inspect actual source excerpts for construction, forward pass and training; compare shapes, then open the complete Python file.',id:'model-code'},
  leakage:{zh:'先按电池/时间段划分原始序列，再在各自分区造窗；MinMax、插补、特征选择与 PCA 只能在训练折 fit，测试不得参与选模型或 epoch。',en:'Split raw records by cell/time before windowing. Fit MinMax, imputation, selection and PCA on train only. Never select the model or epoch on test.',id:'split-lab'},
  resources:{zh:'你维护的 ADV·BATTERY 是来源目录（非原始数据托管）。资源图谱会在线读取公开索引、关联论文与来源链接，离线提供备用来源卡片。',en:'Your ADV·BATTERY is a provenance catalog, not raw dataset hosting. The atlas fetches the public index and paper links, with curated offline fallback.',id:'adv-atlas'},
  dropout:{zh:'Dropout 在训练中按概率随机屏蔽激活并缩放，eval() 时关闭。单层 PyTorch RNN 的内部 dropout 参数通常不会生效，要检查实际结构与层数。',en:'Dropout masks activations during training and is disabled by eval(). In PyTorch, internal recurrent dropout generally has no effect on a single-layer RNN.',id:'components'},
  soc:{zh:'SOC 需先定义容量口径、时间边界与预测标签位置。当前示例是 64 步 V/I/T 预测第 65 步，注意离线标注与在线可观测量的区别。',en:'Define capacity denominator, timestamp boundary and target alignment first. Here 64 V/I/T points predict the 65th SOC; distinguish offline labels from online-observable features.',id:'pipeline'}
};
function writeChat(text,who='assistant',linkId=null){const log=$('assistant-log'),m=el('div',null,'guide-message '+who);m.append(el('small',who==='assistant'?'✦ Volt':'You'),el('p',text));
  if(who==='assistant'&&linkId){const a=el('a',tx('跳转相关知识 ↗','Open related lesson ↗'));a.href='#'+linkId;m.append(a);}
  log.append(m);while(log.children.length>10)log.firstElementChild.remove();log.scrollTop=log.scrollHeight;
}
function askPreset(key){const v=canned[key];if(!v)return;writeChat(tx({split:'怎么选择划分？',metric:'回归和分类指标？',missing:'缺失时间点怎么办？',code:'怎么看模型源码？',leakage:'如何防泄漏？',resources:'资源目录在哪？',dropout:'Dropout 怎么使用？',soc:'SOC 的预测窗口是什么？'}[key]||key,
  {split:'Which split?',metric:'Regression vs classification?',missing:'What about gaps?',code:'Explain model code',leakage:'Prevent leakage',resources:'Where are datasets?',dropout:'Explain dropout',soc:'Explain SOC window'}[key]||key),'user');writeChat(en()?v.en:v.zh,'assistant',v.id);}
function askFree(text){
  const q=text.trim();if(!q)return;writeChat(q,'user');let key=null;
  if(/dropout|丢弃|随机失活/i.test(q))key='dropout';
  else if(/rmse|mae|f1|auc|precision|recall|指标|评价/i.test(q))key='metric';
  else if(/泄漏|leak|normalize|归一化|标准化/i.test(q))key='leakage';
  else if(/划分|留一|cross.validation|holdout|split|time.series.split/i.test(q))key='split';
  else if(/缺失|nan|异常|时间|采样|插值|outlier|gap/i.test(q))key='missing';
  else if(/数据集|dataset|论文|资源/i.test(q))key='resources';
  else if(/代码|模型|torch|lstm|gru|cnn|attention|激活|relu|softmax|优化/i.test(q))key='code';
  else if(/soc|soh|rul/i.test(q))key='soc';
  if(key){const v=canned[key];writeChat(en()?v.en:v.zh,'assistant',v.id);}
  else writeChat(tx('我是离线知识模板助手，不能像在线大模型自由回答。试试：SOC、留一法、缺失值、Dropout、RMSE、数据泄漏、源码。','I am a fixed offline knowledge helper, not an open-ended LLM. Try: SOC, split, missing, Dropout, RMSE, leakage, code.'),'assistant','academy');
}
function toggleAssistant(open){assistantVisible=open;$('assistant-panel').hidden=!open;$('mascot-toggle').setAttribute('aria-expanded',String(open));
  if(open){scrollToId('assistant-panel');$('assistant-input').focus({preventScroll:true});}else ($('mascot-dock').hidden?$('assistant-header'):$('mascot-toggle')).focus({preventScroll:true});}
function initAssistant(){
  writeChat(tx('欢迎来到 CellScope Academy！我可以帮你找到正确的学习卡片、模型源码或实验指标。固定模板不会把你输入的内容发送到外部服务。','Welcome to CellScope Academy! I can point to lessons, source code and evaluation concepts. Your typed questions stay in the browser.'),'assistant');
  on('mascot-toggle','click',()=>toggleAssistant(!assistantVisible));on('assistant-header','click',()=>toggleAssistant(!assistantVisible));on('assistant-close','click',()=>toggleAssistant(false));
  on('assistant-hide','click',()=>{toggleAssistant(false);$('mascot-dock').hidden=true;});
  document.querySelectorAll('[data-ask]').forEach(b=>b.addEventListener('click',()=>askPreset(b.dataset.ask)));
  on('assistant-form','submit',e=>{e.preventDefault();const q=$('assistant-input').value;askFree(q);$('assistant-input').value='';});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&assistantVisible)toggleAssistant(false);});
}

function redraw(){academyRender();renderAdv();renderIssues();renderAdvisor();renderChrono();renderCode();renderComponents();setMetricMode(metricMode);calcRegression();calcClass();renderQuiz();}
function init(){
  academyRender();
  ['adv-search','adv-task'].forEach(id=>on(id,id==='adv-search'?'input':'change',()=>{advLimit=18;renderAdv();}));
  on('adv-reload','click',loadAdv);on('adv-detail-close','click',()=>{$('adv-detail').hidden=true;});loadAdv();
  on('issue-search','input',renderIssues);on('issue-risk','change',renderIssues);renderIssues();
  ['advisor-task','advisor-goal','advisor-cells','advisor-cycles'].forEach(id=>on(id,'change',renderAdvisor));on('advisor-evaluate','click',renderAdvisor);renderAdvisor();
  ['chrono-n','chrono-w','chrono-gap'].forEach(id=>on(id,'change',renderChrono));on('chrono-apply','click',renderChrono);renderChrono();
  const menu=$('code-model');root.CellCore.MODELS.forEach(id=>{const option=el('option',root.CellModels.map[id]?.name||id);option.value=id;menu.append(option);});
  on('code-model','change',()=>{selectedCode=$('code-model').value;renderCode();});
  document.querySelectorAll('[data-code-tab]').forEach(b=>b.addEventListener('click',()=>{codeTab=b.dataset.codeTab;renderCode();}));
  on('code-copy','click',async()=>{try{
    const text=$('model-source-code').textContent;
    if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(text);
    else{const tmp=el('textarea');tmp.value=text;document.body.append(tmp);tmp.select();if(!document.execCommand('copy'))throw Error('Clipboard unavailable');tmp.remove();}
    txt('code-status',tx('已复制当前源码片段。','Copied current source excerpt.'));
  }catch(error){txt('code-status',tx('复制失败，可手动选择代码：','Copy failed; select the code manually: ')+error.message);}});
  on('code-jump','click',()=>{const model=root.document.querySelector('.model-tab[data-model="'+selectedCode+'"]');model?.click();scrollToId('models');});
  window.addEventListener('cellscope:modelchange',e=>setModelForCode(e.detail?.id));renderCode();
  on('component-search','input',renderComponents);on('component-group','change',renderComponents);renderComponents();
  document.querySelectorAll('[data-metric-type]').forEach(b=>b.addEventListener('click',()=>setMetricMode(b.dataset.metricType)));
  on('metric-task','change',()=>{
    if($('metric-task').value==='rul'){$('metric-true').value='300, 240, 180, 120, 60';$('metric-pred').value='320, 230, 190, 100, 75';}
    else{$('metric-true').value='0.95, 0.78, 0.51, 0.25, 0.05';$('metric-pred').value='0.92, 0.80, 0.55, 0.22, 0.10';}
    calcRegression();});
  on('metric-calculate','click',calcRegression);on('class-calculate','click',calcClass);on('class-threshold','input',calcClass);calcRegression();calcClass();
  initQuiz();initAssistant();window.addEventListener('cellscope:langchange',redraw);window.addEventListener('resize',()=>drawActivation(activeComp));window.addEventListener('cellscope:themechange',()=>drawActivation(activeComp));
}
document.addEventListener('DOMContentLoaded',init);
root.CellAcademyUI={redraw,askPreset,loadAdv};
})(window);

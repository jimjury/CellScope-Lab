/* Lightweight reversible Chinese ↔ English localization. Original strings are
   retained per text node; content is never injected as HTML. */
(function(root){
'use strict';
const pairs = `
跳转主内容|||Skip to main content
研究总览|||Overview
数据图谱|||Dataset Atlas
系统学习路径|||Learning Path
ADV 资源联动|||ADV Research Index
预处理实验室|||Preprocessing Lab
时序问题诊所|||Time-Series Clinic
数据划分审计|||Split Integrity
划分决策工坊|||Split Adviser
模型动态剧场|||Model Observatory
22 模型源码阅读|||22 Source Excerpts
神经网络百科|||Neural Knowledge Base
实验配置台|||Experiment Builder
结果分析室|||Results & Evidence
指标计算实验室|||Metrics Playground
知识挑战|||Knowledge Challenge
使用指南|||User Guide
本地优先 · 可复现 · 无需云服务|||Offline-first · Reproducible · No cloud required
Hi，我是 Volt！|||Hi, I'm Volt!
固定知识模板与关键词检索 · 不连接大模型 · 不会上传你的输入|||Offline template answers and keyword search · No LLM · No uploads
如何选择数据划分？|||How should I split data?
RMSE 与 F1 的区别？|||RMSE vs F1?
缺失时间点怎么办？|||Missing timestamps?
怎么看模型代码？|||Explain model code?
怎样防止数据泄漏？|||How to prevent leakage?
数据源在哪里？|||Where are datasets?
发送 ↗|||Send ↗
隐藏小精灵|||Hide mascot
问问 Volt ✦|||Ask Volt ✦
◌ 不会遮挡网页：展开面板占据文档中的独立区域|||◌ Opens inline, without covering page content
关键词检索 / Ask a learning question|||Keyword search / Ask a learning question
一条可审计的实验链路|||An auditable experiment from start to finish
研究任务|||Research Task
把电池 AI 研究|||Make battery AI
变得可视、可验、可复现。|||visible, verifiable and reproducible.
从原始曲线到可信结论。统一探索 SOC / SOH / RUL 数据、模型结构、预处理、分组划分与实验结果，而不再依赖不透明的脚本堆叠。|||From raw signals to defensible conclusions: explore SOC, SOH, RUL, model architecture, preprocessing, splits and evaluation in one transparent environment.
开始系统学习|||Start Learning
交互计算指标|||Calculate Metrics
探索模型结构|||Explore Models
查看数据处理|||Explore Preprocessing
演示数据为合成生成 · 不代表公开数据集实测性能|||Synthetic demonstration only · Not performance measured on public datasets
任务 → 数据 → 划分 → 模型 → 指标 → 验证，六步构建可信电池 AI 实验|||Task → Data → Split → Model → Metrics → Validation: six steps toward a sound battery AI experiment
查看学习路线 ↗|||See learning path ↗
包含可训练实现|||Runnable implementations included
来源指引 · 不镜像数据|||Source references · No dataset mirroring
来源审计 / 无泄漏|||Provenance / leakage guard
识别数据来源|||Identify data sources
化学体系、测试协议、采样与标签定义|||Chemistry, protocols, sampling and target definitions
可追溯预处理|||Auditable preprocessing
相位筛选、降采样、窗口对齐、标准化|||Phase selection, downsampling, window alignment and scaling
分组隔离、泄漏预警、固定随机种子|||Group isolation, leakage alerts and deterministic seeds
模型与结果闭环|||Model-to-evidence workflow
形状追踪、配置导出、真实指标回读|||Shape auditing, config export and measured metrics
电池 AI 系统学习学院|||Battery AI Research Academy
以你提供的四张教学图为起点，按研究逻辑组织课程。不是把术语塞进大列表，而是解释何时使用、为什么使用、什么情况下不适合。|||Inspired by the four supplied learning infographics: master why each method is used, when it applies and where it fails.
数据准备与预处理|||Data Foundations & Preprocessing
选择课程卡片了解学习目标、要点和科研注意事项。|||Choose a lesson to explore its use and limitations.
一个关键区分|||One crucial distinction
研究同一条时间序列的未来 ≠ 评估一个新电池；SOC/SOH/RUL 连续值估计 ≠ 故障分类。后续交互模块以这个边界组织方法。|||Predicting the future of one known sequence is not evaluating an unseen cell. Continuous SOC/SOH/RUL estimates are not fault classification.
ADV·BATTERY 开放资源图谱|||ADV·BATTERY Research Atlas
联动你维护的独立资源仓库，按任务、化学体系和关键词查找数据，查看关联论文与原始来源。在线读取的是公开目录，不包含原始测量文件。|||Explore the independent public resource index by task, chemistry and keywords. See source and linked papers; the catalog contains no measurement datasets.
数据资源、论文与研究问题 · 一处联动|||Datasets, papers and research questions connected
优先读取 ADV·BATTERY 主仓库公开目录；离线时展示当前项目自带的备用资源卡，避免把“无法连接”误当作“目录只有十余项”。|||Fetch the full public ADV index when online; show an explicit curated fallback offline, never mislabeling the fallback as the full index.
打开原资源工作台 ↗|||Open Original ADV Atlas ↗
全部任务|||All tasks
故障与安全|||Safety & Faults
↻ 刷新公开目录|||↻ Refresh Public Index
尝试读取原始 ADV 目录…|||Connecting to ADV catalog…
资源详情|||Resource Details
资源来源、许可和可下载性均须以原始机构页面核对；数据目录没有自动授予第三方数据的再发布权。本页并不声称每个外链已实时通过验证。|||Always verify source, license and download status at the original provider. Catalog entries do not grant redistribution rights; not every link is live-verified.
时序问题诊所|||Time-Series Data Clinic
16 类常见问题：时间戳、缺失、容量复位、充放电相位、重采样、低 SOC、泄漏、RUL 删失等。每张卡都对应可操作的排查和处理规则。|||16 common issues: time ordering, gaps, capacity resets, charge phases, resampling, low-SOC bias, leakage and censored RUL; each card offers a scientific repair rule.
风险|||Risk
全部|||All
重点|||High priority
常见|||Common
点击问题卡片查看建议|||Choose an issue card for guidance
不同任务有不同的处理约束。|||Different tasks need different rules.
为什么发生 / Why it matters|||Why it matters
解决方案 / Actionable fix|||Actionable solution
先核验数据来源和标签。|||Check the source and target semantics first.
返回系统课程 ↗|||Back to Academy ↗
数据划分决策工坊|||Data Split Decision Lab
先选择你究竟要证明什么，再判断随机划分、时间前向、留一循环、留一电池、留一温度/工况和分组交叉验证哪个才合适。|||Define your scientific claim first; then decide whether to use grouped holdout, chronological split, leave-one-cycle, leave-one-cell, or leave-one-condition validation.
研究目标问诊|||Scientific Claim Adviser
任务类型|||Task Type
SOC 连续估计|||SOC Regression
SOH 健康状态|||SOH State Estimation
RUL 寿命预测|||RUL Forecasting
故障 / 安全分类|||Fault / Safety Classification
你想证明什么？|||What is your claim?
泛化到未见过的新电池|||Generalize to unseen batteries
同一电池/序列预测未来|||Forecast future of a known cell
已知电池下未见循环|||Unseen cycles of known cells
新温度或新驾驶工况|||New temperature / driving protocol
电池很少：逐个电芯留一|||Few cells: leave one cell out
独立电池数|||Number of independent cells
每个电池循环数（约）|||Cycles per cell (approx.)
生成划分建议 ↗|||Recommend a split ↗
查看分组模拟|||View group diagram
电池级分组留出|||Battery-group holdout
同一电池不同循环不能跨越训练和测试集合。|||Cycles from one cell must not appear across train/test.
CLI 当前支持电池级与循环级；其他策略是科研指导，不会被伪装成已实现功能。|||The CLI supports battery- and cycle-level splits. Other designs are educational recommendations, not implemented protocols.
同一时序：时间切分 + 隔离区|||One series: chronological split + purge
原始点数|||Raw sample count
窗口长度|||History Window
边界隔离点数|||Boundary Purge
重算可用窗口|||Recalculate Windows
窗口必须在各自分区内部构建；同一系列的滚动交叉验证用于“向未来预测”，不能替代新电池的独立测试。|||Build windows inside each partition. Forward validation of one series is not a substitute for independent-cell evaluation.
逐模型源码讲解|||Real Model Source Explained
代码段自动从本项目的|||Excerpts are automatically extracted from
提取，说明构造、前向数据流及训练逻辑；展示的是完整源码的片段，不能独立作为训练脚本执行。|||and explain construction, forward flow and training. They are excerpted from complete source and cannot run alone.
选择要理解的模型|||Select a model to study
模型 / Architecture|||Model / Architecture
模型解释|||Model Explanation
从实际源码核对模型行为。|||Validate behavior against actual source.
源码片段不是独立运行脚本。|||An excerpt is not a standalone script.
打开 GitHub 完整源码 ↗|||Open Full GitHub Source ↗
在模型剧场查看结构|||View Architecture ↗
复制代码|||Copy Code
初始化 / 构造|||Initialization
前向传播|||Forward Pass
训练与验证|||Training & Validation
每个片段都可以在完整文件中找到。|||Every excerpt can be located in the source file.
神经网络百科|||Neural Toolkit
激活函数、Dropout、BN / LN、Adam / AdamW、梯度裁剪、卷积、LSTM、注意力、PCA、SHAP、优化搜索等基础知识与科研陷阱。|||Core concepts and caveats for activations, dropout, normalization, optimizers, clipping, CNN, LSTM, attention, PCA, SHAP and hyperparameter search.
知识方向|||Concept Group
激活与归一化|||Activation & Normalization
优化与训练|||Optimization & Training
网络架构|||Architecture
诊断与解释|||Interpretability & Diagnostics
点击知识卡片查看原理。|||Select a concept to understand how it works.
结合验证实验判断适用性。|||Check usefulness on validation data.
可视化只对部分激活函数绘图，其他概念展示文字公式。|||Only supported activations show function curves. Other concepts show explanatory formulas.
指标计算实验室|||Metrics Playground
图片里的 Accuracy、Precision、Recall、F1、AUC 适合故障分类；SOC/SOH/RUL 连续估计需要 MAE、RMSE、R²、Bias 等。动手输入数字，所有指标即时计算，不编造模型性能。|||Accuracy, precision, recall, F1 and AUC apply to fault classification; SOC/SOH/RUL regression needs MAE, RMSE, R² and bias. Enter numbers to calculate real metrics.
◈ SOC / SOH / RUL · 回归|||◈ SOC / SOH / RUL · Regression
◎ 故障与安全 · 分类|||◎ Fault & Safety · Classification
连续值预测误差计算器|||Regression Metrics Calculator
预测任务|||Prediction Task
SOC（0–1）|||SOC (0–1)
SOH（0–1）|||SOH (0–1)
RUL（循环数）|||RUL (Cycles)
真实值 y_true|||Ground Truth y_true
预测值 y_pred|||Predictions y_pred
计算指标 ↗|||Calculate Metrics ↗
数组长度必须相同；SOC/SOH 用 0–1 数值时，RMSE×100 表示百分比点（pp），不是相对百分比。SOC 低值段按真实 SOC≤0.2 筛选，统计独立子集误差和 N；NRMSE 以真实值范围归一化。|||Arrays must have equal length. On 0–1 SOC/SOH labels, RMSE × 100 is percentage points (pp), not relative percent. Low-SOC metrics use true SOC ≤ 0.2 and display sample count; NRMSE divides by the ground-truth range.
mean |y−ŷ| · 对偏差直观|||mean |y−ŷ| · intuitive error scale
√mean(y−ŷ)² · 强调大误差|||√mean(y−ŷ)² · penalizes large errors
1−SSres/SStot · 可为负|||1−SSres/SStot · may be negative
接近 0 时不稳定 · 显示有效项数|||Unstable near zero · eligible count shown
混淆矩阵 + ROC-AUC 计算器|||Confusion Matrix & ROC-AUC Calculator
真实类别（0/1）|||True labels (0/1)
故障风险评分（0–1）|||Fault risk score (0–1)
分类阈值|||Decision threshold
计算分类指标 ↗|||Calculate Classification Metrics ↗
行：真实类别 ｜ 列：预测类别|||Rows: true label ｜ Columns: predicted label
ROC-AUC 基于连续风险评分计算，不能只用某一阈值下的 TP/FP/TN/FN 反推；数据全为同一类时 AUC 不定义。|||ROC-AUC uses continuous scores, not a single confusion matrix. It is undefined when only one class is present.
科研知识挑战|||Research Knowledge Challenge
固定知识题目与理由解释。做完题目，理解真正的任务定义与评估协议，再回到训练平台执行实验。|||Curated questions with explanations. Learn task definitions and evaluation protocols before running experiments.
0 正确|||0 correct
开始知识挑战|||Start the Quiz
选择答案后查看解析。|||Choose an answer to get an explanation.
检查答案|||Check Answer
下一题 →|||Next →
重新开始|||Restart
汇总已知公开来源，区分真实数据资源与本平台导入协议。下载、使用许可和引用请以来源为准。|||Explore public source references, not hosted measurement data. Verify permissions and citations at each provider.
全部来源|||All Sources
寿命 / 衰退|||Aging / Life
跨化学体系|||Multi-chemistry
SOC 协议|||SOC Protocol
数据准备与预处理|||Data Preparation & Preprocessing
原始数据 ≠ 开箱即用实验数据|||Raw data ≠ ready-to-train experiments
参数与口径|||Parameters & Definitions
去除无效记录|||Remove invalid rows
64 → 下一点标签|||64 → next-step target
行抽样步长|||Row decimation step
连续输入长度|||History Window
仅训练拟合归一化|||Train-fitted scaling only
Z-Score（演示）|||Z-score (demo)
Min-Max（演示）|||Min-Max (demo)
不归一化|||No normalization
不插值|||No interpolation
同周期内抽样|||Within-cycle decimation
明确对齐|||Explicit label alignment
时序信号处理|||Time-Series Signal Lab
采样前电压|||Raw voltage
处理后电压|||Processed voltage
输入记录|||Input Rows
输出记录|||Output Rows
有效窗口|||Usable Windows
输入张量|||Input Tensor
真实流程将分组后处理，不跨电池、循环或超时缺口拼接窗口。|||The real pipeline groups first and never joins windows across cells, cycles or long gaps.
窗口在估计什么？|||What is the window predicting?
默认 SOC 任务：64 个连续观测 V / I / T → 第 65 个时间点的 SOC；同一个循环内部滑动，步长为 1。|||Default SOC task: 64 consecutive V/I/T readings predict SOC at time step 65, sliding within a cycle with stride 1.
同一电池的所有循环是否跨越训练、验证与测试集合？交互模拟可以揭示划分单位的区别。|||Do all cycles of one cell stay in a single train/validation/test partition? This interactive diagram demonstrates the difference.
数据集合与身份隔离|||Group Identity Isolation
划分策略|||Split Strategy
独立分组单位|||Grouping Unit
电池级（推荐）|||Battery-level (recommended)
循环级（仅 SOC 示意）|||Cycle-level (SOC illustration)
随机种子|||Random Seed
测试比例|||Test Fraction
这只是 8 个演示电池的划分模拟。实际训练使用固定种子和独立分组，并将组成员写入实验报告。|||Eight synthetic cell IDs only. Real training freezes group IDs and seed, and records assignments.
观察各模型的数据流、模块顺序和张量形状，逐层点击了解作用。这里展示架构示意，不伪装成训练时的真实激活值。|||Inspect layers and tensor shapes interactively. This is a schematic, not actual activations or learned attention weights.
搜索模型|||Search Models
清除搜索|||Clear Search
演示速度|||Animation Speed
▶ 播放路径|||▶ Play Flow
层级诊断器|||Layer Inspector
输入窗口|||Input Window
输入特征矩阵|||Feature Matrix
动态视图 ≠ 实际权重 / 注意力热图|||Schematic ≠ learned weights or attention
配置真正可用于 Python 后端的 JSON。静态网页只生成实验配置，不会在浏览器中假装完成 GPU 训练。|||Generate runnable Python CLI JSON. The static site never pretends to run GPU training in the browser.
定义实验|||Define Experiment
SOC / 时序估计|||SOC Time-Series Estimation
SOH / 健康估计|||SOH State Estimation
RUL / 剩余循环寿命|||RUL Remaining Life
特征归一化|||Feature Normalization
划分单位|||Split Unit
测试集比例|||Test Fraction
↓ 下载 JSON 配置|||↓ Download JSON Config
复制配置|||Copy Config
运行前请准备 canonical CSV，或先执行演示数据生成命令。|||Prepare canonical CSV or generate the synthetic demo before running the CLI.
默认载入本项目在合成数据上真实运行得到的 Ridge 基线结果。可上传本地|||The default report comes from a real Ridge CLI execution on synthetic data. Import your local
查看你的真实实验。|||report to inspect a real experiment.
↑ 导入 metrics.json|||↑ Import metrics.json
↑ 导入 comparison.json|||↑ Import comparison.json
恢复演示|||Reset Demo
各集合 RMSE / MAE|||RMSE / MAE by Split
结果单位：SOC / SOH 为 0–1 量纲，RUL 为循环数|||Units: SOC / SOH fractions (0–1), RUL cycles
实验审计摘要|||Experiment Audit Summary
核心约束|||Integrity Rules
训练集拟合归一化；分组互斥；验证选择不使用测试集。|||Train-only normalization; disjoint groups; no test-based selection.
电池级误差明细|||Per-Cell Error Breakdown
电池标识|||Cell ID
样本数|||Sample Count
多模型对比 / Model Benchmark|||Multi-Model Comparison
尚无多模型对比。可通过 CLI 生成 comparison.json。|||No comparison imported. Run CLI compare to generate comparison.json.
先运行 CLI compare，在同一数据源及冻结划分上训练多个模型，再导入 comparison.json。默认按|||Run CLI compare with the same dataset and frozen split, then import comparison.json. Sort by
验证集 RMSE|||validation RMSE
排序；测试指标仅供报告，不用于挑选权重。|||; the test set is for final reporting only, not model selection.
独立任务及数据集间的指标不可直接混合排名。|||Metrics from different tasks and datasets cannot be ranked together.
透明协议 · 独立实验 · 研究用途|||Transparent protocols · Reproducible research · Educational use
`; 
const map=new Map();pairs.split('\n').filter(Boolean).forEach(row=>{const i=row.indexOf('|||');if(i>0)map.set(row.slice(0,i).trim(),row.slice(i+3).trim());});
const translatedNode=new WeakMap(),attrMap=new WeakMap();let language='zh';
const attrs=['placeholder','aria-label','title'];
function textTranslate(s){
 const raw=s.trim();if(map.has(raw))return s.replace(raw,map.get(raw));
 let m;
 if((m=raw.match(/^当前显示 (\d+) \/ (\d+) 项公开来源与导入协议。$/)))return `${m[1]} / ${m[2]} public sources/protocols displayed.`;
 if((m=raw.match(/^(\d+) \/ (\d+) 个模型$/)))return `${m[1]} / ${m[2]} models`;
 if((m=raw.match(/^组间重叠：/)))return 'Group overlap / train-only scaling / no test selection: see original audit values.';
 return s;
}
function walk(node){
 if(node.nodeType===3){
   const p=node.parentElement;if(!p||['SCRIPT','STYLE','CODE','PRE','TEXTAREA','SVG'].includes(p.tagName))return;
   const orig=translatedNode.get(node);
   let source=orig===undefined?node.data:orig;
   const english=textTranslate(source);
   // Keep the original text when reversing English back to Chinese.
   // Only replace the remembered source when application code wrote NEW content.
   if(orig!==undefined&&node.data!==source&&node.data!==english){source=node.data;}
   translatedNode.set(node,source);
   const output=language==='en'?textTranslate(source):source;if(node.data!==output)node.data=output;
   return;
 }
 if(node.nodeType!==1)return;
 if(['SCRIPT','STYLE','CODE','PRE','TEXTAREA','SVG'].includes(node.tagName))return;
 const history=attrMap.get(node)||{};
 for(const a of attrs){const current=node.getAttribute(a);if(!current)continue;let source=history[a];if(source===undefined||current!==source&&current!==textTranslate(source))source=current;
   history[a]=source;const next=language==='en'?textTranslate(source):source;if(next!==current)node.setAttribute(a,next);
 }
 attrMap.set(node,history);
 for(const child of node.childNodes)walk(child);
}
let translating=false;
function apply(){if(translating)return;translating=true;try{walk(document.body);}finally{translating=false;}}
function update(next){if(next!=='zh'&&next!=='en')return;language=next;document.documentElement.lang=language;document.getElementById('language-select').value=next;
 const guide=document.querySelector('.side-links a[href^="./guide"]');if(guide)guide.setAttribute('href',language==='en'?'./guide.en.html':'./guide.html');
 document.title=language==='en'?'CellScope Lab — Battery AI Academy':'CellScope Lab — 电池科研工作台';
 root.dispatchEvent(new CustomEvent('cellscope:langchange',{detail:{lang:language}}));apply();}
function init(){
 document.getElementById('language-select').addEventListener('change',e=>update(e.target.value));
 const observer=new MutationObserver(()=>{if(language==='en'&&!translating)apply();});observer.observe(document.body,{subtree:true,childList:true,characterData:true});
 apply();
}
document.addEventListener('DOMContentLoaded',init);
root.CellLanguage={get:()=>language,set:update,translate:textTranslate,size:map.size};
})(window);

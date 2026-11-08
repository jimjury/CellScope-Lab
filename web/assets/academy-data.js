/* Original educational content; bilingual. Every entry describes intended inference and caveats. */
(function(root){
'use strict';
const b=(zh,en)=>({zh,en});
const stages=[
 {part:1,tag:'DATA',name:b('数据准备与预处理','Data foundations'),lead:b('从原始记录到可审计的连续序列','Turn raw measurements into auditable sequences'),lessons:[
  {name:b('任务与标签先于模型','Define targets before modeling'),desc:b('先确定 SOC、SOH、RUL 或分类故障的物理含义与量纲；不同容量基准不能直接混评。','Specify physical targets, units, capacity denominators and failure thresholds before choosing a model.')},
  {name:b('数据身份证与溯源','Data provenance'),desc:b('记录 DOI、原始链接、许可、化学体系、电池编号、实验温度、时间分辨率与版本，保存原始哈希。','Track DOI, source, license, chemistry, cell ID, temperature, sampling resolution, version and raw SHA-256.')},
  {name:b('去重、异常与缺失','Quality control'),desc:b('区分记录错误和真实脉冲/异常；异常应有可追溯的规则，不能以“曲线更好看”为目标删除。','Distinguish logging errors from genuine pulses; document cleaning rules rather than chasing visually smooth traces.')},
  {name:b('相位、采样与窗口','Phase, sampling and windows'),desc:b('按明确的充放电相位过滤，确认电流符号；按时间间隔采样，断点不拼接，窗口标签与推理时间一致。','Filter phases, check current sign, sample by timestamps, never cross gaps, align labels to inference time.')}]},
 {part:2,tag:'MODEL',name:b('特征选择与模型构建','Features and models'),lead:b('解释每个特征、层与梯度路径的作用','Understand each feature, layer and gradient path'),lessons:[
  {name:b('特征构造的可用性','Feature observability'),desc:b('在预测时刻未知的未来容量、完整寿命和目标标签不可作为输入；增量容量等特征需说明平滑方法。','Never use future capacity, lifetime or target labels; define smoothing for incremental-capacity features.')},
  {name:b('先划分后拟合变换','Fit preprocessing on train only'),desc:b('归一化、特征选择、PCA、插补器都只能用训练折拟合；验证和测试仅 transform。','Fit scalers, selectors, PCA and imputers on training folds only; transform validation/test later.')},
  {name:b('建立简单基线','Build simple baselines first'),desc:b('Mean、Ridge、树模型与 MLP 是对照；复杂时序模块须通过消融解释收益。','Benchmark mean, ridge, trees and MLP; justify complex temporal blocks with ablations.')},
  {name:b('结构与训练审计','Architecture and optimization audit'),desc:b('追踪 B×W×F 的维度、梯度、激活、参数量、训练速度与显存，固定随机种子并保存配置。','Audit tensor shapes, gradients, activations, parameter count, speed and memory; freeze seeds and configs.')}]},
 {part:3,tag:'METRICS',name:b('评价指标与实验设计','Evaluation and evidence'),lead:b('分清回归、分类与时间前瞻问题','Separate regression, classification and prospective testing'),lessons:[
  {name:b('按对象定义泛化问题','Choose split by deployment goal'),desc:b('新电池应按电芯分组；同一电芯未来预测须时间前向与留出间隔；留一循环不是留一电池。','New-cell claims need group splits; future-on-known-cell claims need chronological holdout and purge. Leave-one-cycle-out is not leave-one-cell-out.')},
  {name:b('回归指标与单位','Regression metrics and units'),desc:b('SOC/SOH 通常用 MAE、RMSE、Bias、R² 等；RUL 单位为循环/小时。MAPE 在标签接近零时失效。','Use MAE, RMSE, bias and R² with task-specific units. RUL may be cycles or hours; near-zero MAPE is unstable.')},
  {name:b('分类指标与阈值','Classification and threshold metrics'),desc:b('故障分类才适合混淆矩阵、Precision、Recall、F1、ROC-AUC；AUC 应使用连续风险评分。','Use confusion matrices, precision, recall, F1 and ROC-AUC for classification; AUC needs continuous risk scores.')},
  {name:b('多随机种子与统计报告','Multi-seed reporting'),desc:b('用训练域验证选择超参数和 epoch，测试集仅最终报告；多次运行报告均值±标准差和失败样例。','Select hyperparameters/epochs with training-side validation; reserve test for final reporting, with seed variability and failure cases.')}]},
 {part:4,tag:'RELIABILITY',name:b('优化、解释与泛化','Optimization and robustness'),lead:b('先定位误差来源，再决定要不要增加复杂度','Diagnose before adding complexity'),lessons:[
  {name:b('欠拟合与过拟合','Underfitting and overfitting'),desc:b('训练和验证都差：核对标签、容量口径、特征与模型能力；训练好而验证差：查数据漂移、容量泄漏、过拟合。','Poor train and validation: check labels and capacity; good train but poor validation: inspect drift, leakage and overfit.')},
  {name:b('正则化与训练稳定性','Regularization and stability'),desc:b('Dropout、weight decay、早停、BN/LN、学习率与批量大小要通过控制变量对照，而不是无序叠加。','Evaluate dropout, weight decay, early stopping, BN/LN, learning rate and batch size in controlled ablations.')},
  {name:b('可解释性与校准','Interpretation and calibration'),desc:b('SHAP/PDP 只描述模型与输入的统计依赖，不能直接证明物理因果；注意力权重也不是因果解释。','SHAP/PDP describe model dependence, not physical causality. Attention weights alone are not causal explanations.')},
  {name:b('迁移与外部验证','External validation and transfer'),desc:b('冻结外部数据集和评价协议，区分仅源域、微调、无监督适配和测试时更新；报告目标域标签使用边界。','Freeze external datasets and protocols; distinguish source-only, fine-tuning, unsupervised adaptation and test-time updates, with target-label access disclosed.')}]}
];
const issues=[
 ['time',b('时间戳重复或逆序','Duplicate / reversed timestamps'),b('检测同一电池、循环内 Δt≤0 的记录；电流积分必须基于真实有序时间。','Detect non-positive Δt per cell/cycle; integration needs ordered real time.'),b('保留原始行号；明确同时间重复的合并/删除规则，检查单调性，再分组形成窗口。','Retain source rows; apply explicit duplicate rules; verify monotonicity before windowing.'),'high'],
 ['gaps',b('缺采样与不连续区段','Missing samples and time gaps'),b('大时间缺口不能用普通插值“缝合”；否则模型会误学不存在的过渡。','Do not bridge large gaps with interpolation: invented transitions contaminate windows.'),b('统计 Δt 分布；设 max_gap；在断点切段并禁止跨段造窗口；小缺口仅按任务许可插补。','Inspect Δt, set max_gap, segment on breaks; impute only small permitted gaps.'),'high'],
 ['missing',b('电压/电流/温度缺失','Missing V/I/T measurements'),b('整列缺失与少量孤立 NaN 完全不同，插补可能消除电流瞬态。','Whole missing channels differ from sparse NaNs; filling can erase current transients.'),b('报告缺失比例和连续缺失长度；训练折拟合插补器并加入缺失标记（如研究约束允许）。','Report missing fraction and run length; fit imputer on train only; optional missingness indicator if allowed.'),'high'],
 ['units',b('单位和电流极性不一致','Units and current polarity'),b('mA/A、mAh/Ah、秒/分钟与正负放电符号混淆会翻转 SOC/容量趋势。','Mixing mA/A, mAh/Ah, seconds/minutes or current sign breaks capacity trends.'),b('统一 SI 单位并记录映射；用电流与容量变化方向交叉验证；不同来源不强行统一符号。','Normalize units with provenance and cross-check current sign against observed capacity trends.'),'high'],
 ['phase',b('充放电/静置段混杂','Mixed charge/discharge/rest phases'),b('把充电和放电混进一段窗口会破坏任务标签和动态分布。','Mixed phases can corrupt labels and local dynamics.'),b('基于原始 Step/事件、电流阈值、容量趋势识别相位；保留相位边界，避免穿越。','Identify phases from step/event fields, current thresholds and capacity trends; keep boundaries.'),'medium'],
 ['reset',b('容量累计重置与不一致','Capacity counters reset'),b('一些仪器的 Ah 字段跨 Step 重置或以相反符号累计；不能直接当 SOC 分母。','Ah counters may reset across steps or use inconsistent sign; do not blindly normalize.'),b('定位容量复位点，检查库仑积分与容量导数；按周期明确积分起点与最大容量定义。','Detect resets, compare coulomb counting and slopes; document per-cycle denominator.'),'high'],
 ['label',b('标签定义与未来信息','Label semantics / lookahead'),b('SOH=Q/Qref、SOC=剩余/可用容量等存在多口径；若标注依赖完整未来记录会造成部署差异。','SOC/SOH definitions vary; labels requiring future full discharge may not be available online.'),b('保存公式、采样时刻、分母、电池和温度上下文；区分离线标签与在线可用观测。','Record formula, timestamp, denominator and offline/online availability.'),'high'],
 ['split',b('重叠滑动窗口泄漏','Overlapping-window leakage'),b('先用步长1造大量窗口再随机拆分，会让相邻窗口共享几乎全部输入。','Randomly splitting heavily overlapping windows leaks near-identical histories.'),b('先按电池/循环/时间段划分，再各自构造窗口；时间留出边界添加 purge/embargo。','Partition cell/cycle/time blocks before building windows; purge chronological boundaries.'),'high'],
 ['scale',b('全数据拟合归一化','Scaler fitted on full dataset'),b('测试集极值进入 MinMax 或 PCA 将偷偷传递未来/目标分布信息。','Test extremes entering MinMax/PCA expose holdout distribution.'),b('只在训练数据拟合并冻结参数；每折重新拟合，写出 min/max/mean/std。','Fit only on train per fold and persist scaler statistics.'),'high'],
 ['resample',b('不均匀采样与插值','Unequal sampling / interpolation'),b('按每10行取样仅在原始采样率稳定时等于固定时间步长；插值可平滑尖峰。','Every tenth row equals a fixed interval only for stable raw sampling; interpolation may erase spikes.'),b('先检查 Δt；根据研究协议选择时间重采样或行抽取；保存插值与否的记录。','Inspect Δt; choose row decimation or time resampling explicitly and log interpolation.'),'medium'],
 ['outlier',b('异常值与真实动态','Outlier versus genuine event'),b('US06 电流脉冲、低温电压突降可能是物理信号，不应被 IQR 规则任意删除。','Current pulses and voltage drops may be real physics, not garbage.'),b('结合量程、传感器状态、物理一致性标记，保留原始与处理前后对照。','Use sensor ranges and physical consistency; preserve raw/clean comparisons.'),'high'],
 ['imbalance',b('低 SOC/故障类别不平衡','Low-SOC / class imbalance'),b('总体 RMSE 或 Accuracy 可能隐藏低 SOC 偏差和少数故障漏检。','Overall RMSE or accuracy can hide low-SOC errors and missed minority faults.'),b('按 SOC 区间和电池分别报告，分类补充 PR-AUC / Recall 和混淆矩阵，训练权重仅从训练折估计。','Report by SOC band and cell; for faults use PR-AUC/recall, with train-only weights.'),'medium'],
 ['drift',b('温度与化学体系漂移','Temperature / chemistry drift'),b('温度、材料、采样设备与工况变化可能导致测试分布不同；不能当成随机噪声。','Chemistry, temperature, logger and protocol shifts change test distribution.'),b('对比分布、测量范围与标签；定义 source-only、适配或跨条件协议并记录标签使用。','Compare ranges/targets and predefine source-only versus adaptation and label access.'),'medium'],
 ['censor',b('寿命右删失 / EOL 未达到','Right-censoring / EOL unknown'),b('观测记录结束不等于寿命终点；若未到 EOL 就写 RUL=0 会产生伪标签。','Recording stop is not EOL; assigning RUL=0 creates false labels.'),b('保留删失标志、失效阈值和观测窗口；选用与删失数据兼容的方法。','Keep censor flag, EOL threshold and observation horizon; use censor-aware methods.'),'high'],
 ['future',b('未来特征与延迟信息','Future feature availability'),b('居中平滑、双向跨全序列注意力或当次放电最终容量可能偷看未来。','Centered smoothing, whole-sequence bidirectionality or final capacity can peek ahead.'),b('以推理时钟定义可观察特征；窗口内部双向编码可以，但不能越过截止时刻。','Audit feature timestamps; bidirectional encoding inside observed history is okay, not beyond inference cutoff.'),'high'],
 ['synthetic',b('合成数据与真实基准混淆','Synthetic-versus-real claims'),b('演示曲线或训练代码跑通不等于达到文献精度；不允许把模拟分数写入论文排名。','Synthetic execution demonstrates plumbing, not paper-level benchmark performance.'),b('显式标注 synthetic；记录数据哈希、划分、seed、版本及数据许可；只对同协议指标排名。','Label synthetic; log source hashes, splits, seed and version; compare only protocol-matched runs.'),'high']
].map(([id,name,cause,fix,risk])=>({id,name,cause,fix,risk}));
const components=[
 ['relu','ReLU',b('max(0, x)，简单高效但负半轴梯度为 0。','max(0,x); cheap but zero gradient for negative inputs.'),b('深层 CNN / MLP；观察 dying ReLU。','CNN/MLP; watch dead units.'),'max(0,x)'],
 ['gelu','GELU',b('x·Φ(x)，平滑门控，常见于 Transformer。','Smooth x·Φ(x), popular in Transformers.'),b('表达更柔和但计算略重；对照验证。','Smooth but slightly costlier; validate empirically.'),'x Φ(x)'],
 ['sigmoid','Sigmoid',b('将输入映射到 (0,1)，易在饱和区梯度变小。','Maps x to (0,1), saturates at extremes.'),b('二分类风险分数或门控；不自动使 SOC 物理合法。','Binary score/gates; bounded SOC output is a separate design choice.'),'1/(1+e^-x)'],
 ['tanh','Tanh',b('映射到 (-1,1)，零中心；LSTM 门控常用。','Maps x to (-1,1); zero-centered recurrent gates.'),b('避免误以为它不会饱和。','Can still saturate.'),'tanh(x)'],
 ['softmax','Softmax',b('将一组 logits 转为非负且和为 1 的权重。','Turns logits into nonnegative weights summing to one.'),b('分类多类概率或注意力；不能把权重直接解释为因果。','Multiclass probabilities or attention; weights are not causal proof.'),'exp(zᵢ)/Σexp(zⱼ)'],
 ['dropout','Dropout',b('训练时以概率 p 丢弃激活并按 1/(1-p) 缩放；推理时关闭。','Randomly masks activations with probability p and rescales in training; disabled in eval mode.'),b('用验证集调 p；RNN 内部 dropout 的实现需要核对层数与框架。','Tune p on validation; RNN dropout semantics depend on layer count.'),'E[mask·x/(1-p)] = x'],
 ['batchnorm','BatchNorm',b('使用训练 mini-batch 的统计量，推理使用运行均值/方差。','Batch statistics during training and running statistics in evaluation.'),b('小 batch/域漂移/时间混合时要验证稳定性。','Check small batches, domain shift and temporal mixing.'),'(x−μ_B)/√(σ²_B+ε)'],
 ['layernorm','LayerNorm',b('在单样本指定特征轴上归一化，通常不依赖批量大小。','Normalizes within a sample across selected feature axes.'),b('Transformer/小 batch 时常用，轴设置必须正确。','Good for Transformers/small batches; mind normalized axes.'),'(x−μ_layer)/√(σ²_layer+ε)'],
 ['adam','Adam',b('结合一阶与二阶动量自适应步长；ε 是数值稳定项。','Adaptive first/second moments; ε stabilizes the denominator.'),b('weight_decay=0 与 ε 是否有效无关。','Weight decay 0 does not disable epsilon.'),'θ ← θ − α m̂/(√v̂+ε)'],
 ['adamw','AdamW',b('与 Adam 的主要差别是解耦的权重衰减。','Decouples weight decay from the gradient update.'),b('weight decay=0 时接近 Adam（其他设置一致），ε 仍生效。','With decay 0 it approaches Adam given equal settings; ε still matters.'),'θ ← (1−α·wd)θ − α m̂/(√v̂+ε)'],
 ['sgd','SGD',b('沿梯度方向更新，动量项可抑制噪声。','Updates along gradients; momentum smooths steps.'),b('需仔细调学习率与 schedule。','Needs a learning-rate schedule.'),'θ ← θ − η∇L'],
 ['weight_decay','Weight Decay / L2',b('约束大权重，减小复杂度，但不能修复错误标签。','Regularizes large weights, not wrong labels.'),b('区分 Adam 的耦合 L2 与 AdamW 解耦 decay。','Distinguish coupled L2 and decoupled AdamW.'),'λ∥θ∥²'],
 ['early_stop','Early Stopping',b('基于验证集停止训练并恢复最佳权重。','Stops using validation and restores best checkpoint.'),b('不允许根据测试误差逐轮选 epoch。','Never select epoch using test performance.'),'best_epoch = argmin ValLoss'],
 ['grad_clip','Gradient Clipping',b('限制梯度范数/幅度，缓解爆炸但不等于一定更准。','Bounds gradient norm/magnitude against explosions.'),b('结合梯度范数记录，阈值需验证。','Log gradient norms and tune threshold.'),'g ← g·min(1,c/∥g∥)'],
 ['lr','Learning Rate',b('步长过大易震荡，过小收敛慢；需结合 loss 与梯度判断。','High LR can diverge; low LR converges slowly.'),b('先选择合理量级，再搜索 schedule。','Choose a reasonable scale before schedulers.'),'θ ← θ − η g'],
 ['lstm','LSTM',b('通过输入/遗忘/输出门保留时序状态。','Gated recurrent cell maintains temporal state.'),b('核对 seq_len、hidden_size 与单/双向维度。','Audit length, hidden state and direction factors.'),'[B,W,F] → [B,W,H]'],
 ['gru','GRU',b('更新门与重置门，参数通常比同维 LSTM 少。','Update and reset gates, often fewer params than LSTM.'),b('效果随工况和数据量变化。','Performance depends on data and protocol.'),'[B,W,F] → [B,W,H]'],
 ['attention','Attention',b('对历史位置计算相关度并加权聚合。','Scores and aggregates observed history tokens.'),b('必须确认不引用预测时刻之后的输入。','No tokens from after the inference cutoff.'),'softmax(QKᵀ/√d)V'],
 ['conv','1D / Depthwise CNN',b('滑动核提取局部电压电流变化，Depthwise 每通道独立卷积。','Sliding filters capture local V/I dynamics; depthwise per channel.'),b('核宽与 padding 会影响序列长度、因果性。','Kernel and padding affect shape and causality.'),'[B,F,W] → [B,C,W′]'],
 ['residual','Residual Connection',b('x + F(x) 保留信息及梯度捷径；要求形状兼容。','x + F(x) provides an information/gradient shortcut; shapes must match.'),b('不是“层越多越好”；注意 BN、激活次序。','Depth alone is not evidence; check BN/activation placement.'),'y=x+F(x)'],
 ['mse','MSE Loss',b('平方误差强调较大偏差；异常值影响更大。','Squared loss penalizes large residuals heavily.'),b('训练 loss 与最终报告 RMSE、MAE 可不同。','Training loss can differ from reported metrics.'),'Σ(y−ŷ)²/n'],
 ['mae','MAE / Huber Loss',b('MAE 抗异常值较稳；Huber 在小误差二次、大误差一次。','MAE is robust to outliers; Huber transitions quadratic to linear.'),b('非光滑点与 δ 阈值影响优化。','Kinks and Huber δ affect optimization.'),'Σ|y−ŷ|/n'],
 ['pca','PCA',b('线性降维保留最大方差方向，不等于保留对目标最有用信息。','Unsupervised variance-preserving linear projection; not guaranteed task relevance.'),b('必须只在训练折拟合；记载组件数和保留方差。','Fit on train only and report variance/components.'),'Z=(X−μ)W'],
 ['shap','SHAP / PDP',b('解释训练后的模型关联性，可能受高度相关特征影响。','Explain model association; correlated predictors complicate interpretation.'),b('不能直接推断物理因果。','Not physical causal proof.'),'f(x)≈φ₀+Σφᵢ'],
 ['optuna','Search / Optuna',b('Grid、Random、Bayesian 搜索应使用验证集或嵌套 CV 选参。','Grid, random and Bayesian search should use validation or nested CV.'),b('记录搜索空间、次数、seed 与计算开销；测试集不参与调参。','Log search space, budget and seeds; never tune on test.'),'θ* = argmin CV(θ)']
].map(([id,name,desc,tip,formula])=>({id,name,desc,tip,formula}));
const quizzes=[
 [b('单块电池 SOC 时序预测未来，哪种划分更贴近部署？','Forecast future SOC on an already observed cell. Choose the best split.'),[b('窗口随机打乱后分配','Random shuffled windows'),b('时间前向划分并留隔离区','Chronological split with purge'),b('同一窗口同时放训练与测试','Reuse the same windows')],1,b('严格保留时间顺序，先划分原始时段再构建窗口。','Respect time order and build windows inside partitions.')],
 [b('想评价从未见过的新电池，最重要的划分单位？','Evaluating unseen batteries: which grouping?'),[b('采样点','Sample row'),b('电芯 ID','Cell ID'),b('相邻窗口','Overlapping window')],1,b('同一电芯的所有循环应留在同一个集合。','All cycles of a cell must stay in one split.')],
 [b('在 SOC 靠近 0 时，哪个指标容易不稳定？','Which metric is unstable when SOC approaches zero?'),[b('RMSE','RMSE'),b('MAE','MAE'),b('MAPE','MAPE')],2,b('MAPE 分母含真实值，接近零会爆炸；应同时报告有效样本数。','MAPE divides by truth; near-zero targets cause blow-ups. Report eligible samples.')],
 [b('ROC-AUC 应输入什么？','What is required for ROC-AUC?'),[b('连续的风险评分','Continuous risk scores'),b('RUL 连续误差','RUL residuals'),b('只有正负类别名且无评分','Only class labels without scores')],0,b('AUC 衡量正例评分高于负例的排序能力。','AUC measures probability a positive is ranked above a negative.')],
 [b('MinMax 的上下界由谁拟合？','Which records fit MinMax bounds?'),[b('训练与测试合并','Combined train/test'),b('训练折','Training fold'),b('测试折','Test fold')],1,b('验证和测试只应用训练得到的统计量。','Only training data may fit the transform.')],
 [b('原始时间戳出现 15 秒缺口，但允许最大 10 秒，应该？','A 15-second gap exceeds the 10-second limit. What next?'),[b('平滑连接缺口','Smooth across it'),b('跨缺口直接构造窗口','Build a window across it'),b('分段并禁止跨缺口造窗','Segment and prevent crossing')],2,b('长缺口意味着连续性未知，不能虚构样本。','Long gaps break continuity; do not fabricate observations.')],
 [b('仅有正常与故障标签时，应使用什么指标？','For normal vs failure labels, which metrics?'),[b('仅用 R²','Only R²'),b('分类混淆矩阵与 Recall/F1','Confusion matrix and recall/F1'),b('仅用 SOC RMSE','Only SOC RMSE')],1,b('类别不平衡时还应查看 Precision、PR-AUC 等。','For imbalance, inspect precision and PR-AUC too.')],
 [b('训练集误差极低而新电池误差大，首先应检查？','Tiny training error, large unseen-cell error: investigate?'),[b('直接多加 10 层','Add 10 layers'),b('数据漂移、泄漏、过拟合','Shift, leakage, overfitting'),b('用测试集选最优 epoch','Select epoch on test')],1,b('优先做分布诊断与消融，切勿让测试集参与选择。','Diagnose distributions and ablate before increasing complexity.')],
 [b('电池只测到第 250 周期，没达到 EOL，是否可设剩余寿命为 0？','Cell recording ends before EOL. Is RUL zero?'),[b('是，最后一行就是 EOL','Yes, final row means EOL'),b('否，这是右删失','No, right-censored'),b('随意猜测一个寿命','Guess a lifetime')],1,b('没有观察到失效阈值，就不能凭记录终止制造标签。','Stopping measurement is not observed failure.')]
].map(([q,opts,answer,why])=>({q,opts,answer,why}));
const citations=[
 ['BatteryBench','https://github.com/LMDHQ-0420/BatteryBench','Baseline protocols, not copied implementation'],
 ['BatteryLife','https://github.com/Ruifeng-Tan/BatteryLife','Lifetime dataset standardization'],
 ['BatteryML','https://github.com/microsoft/BatteryML','Battery experiments and preprocessing'],
 ['BEEP','https://github.com/TRI-AMDD/beep','Battery data engineering'],
 ['TensorFlow Playground','https://playground.tensorflow.org','Interactive machine-learning pedagogy'],
 ['Netron','https://github.com/lutzroeder/netron','Model structure viewing'],
 ['scikit-learn TimeSeriesSplit','https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html','Time-order validation and gap'],
 ['ADV·BATTERY','https://github.com/jimjury/ADV-BATTERY-Dataset-Collection','Original research index and rights notices']
];
root.CellAcademyData={stages,issues,components,quizzes,citations};
})(typeof window!=='undefined'?window:globalThis);

/* Architecture diagrams follow actual Python model variants in cellscope/models.py. */
(function (root) {
  const designs = [
    {id:'rdb_attn_bilstm', name:'RDB · Attention · BiLSTM', short:'Hybrid', family:'HYBRID', desc:'自研示例：Pointwise 投影 → 残差深度可分离卷积（BN + ReLU）→ 单层双向 LSTM → 单头注意力 → MLP。逐层采用真实后端的维度变化。', tags:['Residual Depthwise','BiLSTM × 1','Single-head Attention','Regressor'], stages:(w,f)=>[
      ['输入时序',`B × ${w} × ${f}`,`B × ${w} × ${f}`,'同一循环内按时间排序的输入；SOC 三特征 V/I/T。','每个时间点包含全部特征，窗口末端标签不属于输入。'],
      ['1×1 投影',`B × ${w} × ${f}`,`B × ${w} × 48`,'Pointwise Conv1d 把输入通道映射到 48 维表示。','不会改变时间长度。'],
      ['残差深度卷积',`B × ${w} × 48`,`B × ${w} × 48`,'Depthwise k=3 + Pointwise + BatchNorm + shortcut + ReLU。','残差路径保持通道维度与长度，便于保留局部信息。'],
      ['BiLSTM × 1',`B × ${w} × 48`,`B × ${w} × 96`,'一次双向循环编码；前向与反向各 48 维拼接。','仅在已观察的窗口内双向建模，不使用预测目标时刻的未来输入。'],
      ['单头 Attention',`B × ${w} × 96`,'B × 96','单层线性打分、softmax 时间权重、加权求和。','这里显示概念流程，并非训练模型导出的注意力值。'],
      ['MLP 输出','B × 96','B × 1','48 维 ReLU 隐层投影到一个连续目标。','输出未强制裁剪：是否施加物理边界应由任务协议决定。']
    ]},
    {id:'transformer', name:'Transformer Encoder', short:'Transformer', family:'ATTENTION', desc:'将时序特征映射到隐空间并叠加位置编码，经一层 TransformerEncoder 提取全局依赖，平均池化后回归。', tags:['Projection','Positional Encoding','1 Encoder','Mean Pool'], stages:(w,f)=>[
      ['输入时序',`B × ${w} × ${f}`,`B × ${w} × ${f}`,'有限长度的历史序列。','无目标时刻输入。'],
      ['线性投影 + 位置编码',`B × ${w} × ${f}`,`B × ${w} × 48`,'将通道投影并加入正弦位置编码。','动态位置表示不是从数据直接读取的标签。'],
      ['Transformer Encoder',`B × ${w} × 48`,`B × ${w} × 48`,'4 头自注意力与前馈网络组成单个编码器层。','注意力作用域仅是输入窗口。'],
      ['均值池化',`B × ${w} × 48`,'B × 48','沿时间轴平均聚合。','与选择最后一个时间点的隐状态不同。'],
      ['线性预测','B × 48','B × 1','回归目标标量。','回归头与任务共享接口。']
    ]},
    {id:'bilstm', name:'Bidirectional LSTM', short:'BiLSTM', family:'RECURRENT', desc:'一个双向 LSTM 编码观测窗口，以最后一个双向隐向量回归目标。', tags:['Recurrent','Bidirectional','1 Layer'], stages:(w,f)=>[
      ['输入时序',`B × ${w} × ${f}`,`B × ${w} × ${f}`,'固定历史窗口。','不跨越周期。'],['双向 LSTM',`B × ${w} × ${f}`,`B × ${w} × 96`,'正反两个方向提取窗口内的时序结构。','只能使用窗口内的信息。'],['末端状态','B × '+w+' × 96','B × 96','取编码后的最后一个时间步。','该实现使用 output[:, -1, :]。'],['线性回归','B × 96','B × 1','输出任务标签。','适合公平基线。']
    ]},
    {id:'gru', name:'GRU Sequence', short:'GRU', family:'RECURRENT', desc:'单层 GRU 的门控序列建模，更少参数的轻量时序基线。',tags:['Gated RNN','1 Layer','Last State'],stages:(w,f)=>[
      ['输入',`B × ${w} × ${f}`,`B × ${w} × ${f}`,'原始序列被训练集统计量标准化。','分组隔离在模型外完成。'],['GRU 编码',`B × ${w} × ${f}`,`B × ${w} × 48`,'重置门与更新门控制时间信息流。','单向编码。'],['末端状态',`B × ${w} × 48`,'B × 48','取最后时间点表征。','保持样本顺序。'],['线性预测','B × 48','B × 1','输出连续目标。','可以与 BiLSTM 做参数与性能对照。']
    ]},
    {id:'cnn', name:'Temporal CNN', short:'CNN', family:'CONVOLUTION', desc:'一维卷积局部捕捉电压、电流和温度的联动变化，经自适应平均池化后预测。',tags:['Conv1D k=3','ReLU','Global Average Pool'],stages:(w,f)=>[
      ['输入',`B × ${w} × ${f}`,`B × ${w} × ${f}`,'时序传感器输入。','先换轴以适配 Conv1d。'],['通道转置',`B × ${w} × ${f}`,`B × ${f} × ${w}`,'将特征放在 Conv1D 通道维。','张量中的物理时间顺序未变化。'],['1D 卷积',`B × ${f} × ${w}`,`B × 48 × ${w}`,'48 个 k=3 的卷积核提取局部模式并 ReLU。','padding=1 保持长度。'],['平均池化',`B × 48 × ${w}`,'B × 48','将整个窗口压缩成一个表征。','保留通道数量。'],['线性输出','B × 48','B × 1','连续回归结果。','标准卷积基线。']
    ]},
    {id:'mlp', name:'Flatten MLP', short:'MLP', family:'DENSE', desc:'将整个输入窗口展开，经一个 ReLU 全连接隐藏层输出回归值；对模型深度与非线性贡献提供基线。', tags:['Flatten','Dense 48','ReLU'], stages:(w,f)=>[
      ['输入',`B × ${w} × ${f}`,`B × ${w} × ${f}`,'固定形状窗口。','先标准化。'],['展平',`B × ${w} × ${f}`,`B × ${w*f}`,'按时间和通道顺序展平。','失去显式的二维时序结构。'],['Dense + ReLU',`B × ${w*f}`,'B × 48','一个可学习隐藏层。','动态非线性回归。'],['线性输出','B × 48','B × 1','回归目标值。','适合与更复杂模型对照。']
    ]},
    {id:'ridge', name:'Ridge Regression', short:'Ridge', family:'STATISTICAL', desc:'将窗口直接展平，采用不惩罚截距的岭回归，提供结构清晰、可快速复现的定量基线。',tags:['Linear','SVD','L2 Regularization'],stages:(w,f)=>[
      ['输入',`B × ${w} × ${f}`,`B × ${w} × ${f}`,'经过训练集均值/方差标准化的时序窗口。','只拟合训练集合。'],['展平',`B × ${w} × ${f}`,`B × ${w*f}`,'将序列按固定次序展开。','固定模型输入维度。'],['Ridge / SVD',`B × ${w*f}`,'B × 1','利用训练集 SVD 求解带 L2 正则的系数。','截距不正则化，超参数 alpha 默认 1。'],['预测','B × 1','B × 1','使用拟合的系数对测试窗口线性预测。','没有经过训练的深度层。']
    ]},
    {id:'mean', name:'Mean Label Baseline', short:'Mean', family:'NULL BASELINE', desc:'训练时计算训练集标签均值；测试预测为常数，完全不依赖输入。可检验复杂模型是否真的优于无信息基线。', tags:['Constant','Train-only Label Mean','Sanity Check'], stages:(w,f)=>[
      ['训练标签',`N train × 1`,'N train × 1','仅用于学习常数。','不使用验证或测试标签。'],['训练集均值','N train × 1','1','计算训练集标签均值。','忽略全部输入特征。'],['常数预测','1','B × 1','对所有样本返回相同的训练集均值。','必须作为对照而非神经网络。']
    ]}
  ];
  // Added research baselines: all map to executable entries in cellscope/models.py.
  const input = (w,f)=>`B × ${w} × ${f}`;
  const flat = (w,f)=>`B × ${w*f}`;
  const simple = (id, name, short, family, desc, tags, steps, notes='输入由训练集统计量归一化；不使用测试标签。')=>({
    id,name,short,family,desc,tags,stages:(w,f)=>[
      ['输入历史窗口',input(w,f),input(w,f),'时间连续且与目标严格隔离。',notes],
      ['向量展开',input(w,f),flat(w,f),'按照时间和传感器顺序把窗口展成回归向量。','只有输入窗口，禁止引入未来标签。'],
      [steps,flat(w,f),'B × 1',desc,'这是真实的回归方法，不是深度神经网络层。']
    ]
  });
  designs.push(
    simple('linear','Ordinary Least Squares','Linear','STATISTICAL','最小二乘线性回归，作为未正则化的可解释参考。',['OLS','Train fit','Linear'],'OLS / 最小二乘'),
    simple('elasticnet','ElasticNet Regression','ElasticNet','STATISTICAL','结合 L1 和 L2 惩罚的线性回归；L1 ratio = 0.5。',['L1 + L2','Sparse coefficients'],'ElasticNet / 坐标下降'),
    simple('knn','k-Nearest Neighbors','kNN','NONPARAMETRIC','对训练窗口计算距离，从最近的 k 个样本进行距离加权回归。',['Neighbors k=5','Distance weighting'],'kNN / 邻域平均'),
    simple('svr','RBF Support Vector Regression','SVR','KERNEL','RBF 核 SVR；参数 C 与 epsilon 均可以在 Python 配置中调整。',['RBF kernel','Margin regression'],'SVR / 核空间预测'),
    simple('random_forest','Random Forest Regressor','RandomForest','ENSEMBLE','随机森林多棵回归树，预测取集成平均。',['Bootstrapping','80 trees (default)'],'Random Forest / 树集成'),
    simple('extra_trees','Extra Trees Regressor','ExtraTrees','ENSEMBLE','ExtraTrees 引入随机化切分并集成回归树。',['Randomized splits','80 trees (default)'],'ExtraTrees / 随机切分'),
    simple('hist_gbdt','Histogram Gradient Boosting','HistGBDT','ENSEMBLE','直方图梯度提升模型，依次拟合残差。',['Boosting','Histogram bins'],'Histogram GBDT / 迭代提升'),
    {id:'lstm',name:'Unidirectional LSTM',short:'LSTM',family:'RECURRENT',desc:'单层单向 LSTM，保留记忆单元与门控状态。',tags:['1-layer','Gated memory'],stages:(w,f)=>[
      ['序列输入',input(w,f),input(w,f),'当前窗口传感器序列。','不使用未来时间点。'],['LSTM',input(w,f),`B × ${w} × 48`,'遗忘门、输入门、输出门更新隐状态。','只有一层，不使用反向通道。'],['取末端状态',`B × ${w} × 48`,'B × 48','最后一步隐向量。','与序列逐点输出不同。'],['线性回归','B × 48','B × 1','回归预测。','输出可用于三类任务。']
    ]},
    {id:'bigru',name:'Bidirectional GRU',short:'BiGRU',family:'RECURRENT',desc:'单层双向 GRU，在已观测窗口内学习正反两个方向的上下文。',tags:['Bi-directional','1-layer','Last state'],stages:(w,f)=>[
      ['序列输入',input(w,f),input(w,f),'固定窗口。','没有目标时刻的输入。'],['双向 GRU',input(w,f),`B × ${w} × 96`,'两个方向各 48 个隐藏单元。','双向只在窗口内，不越界。'],['末端拼接',`B × ${w} × 96`,'B × 96','取 output[:, -1, :]。','这是后端实现的末端选择方式。'],['线性回归','B × 96','B × 1','任务连续值输出。','监督训练。']
    ]},
    {id:'dlinear',name:'DLinear (Trend + Seasonal)',short:'DLinear',family:'LINEAR TIMESERIES',desc:'对每个输入通道滑动均值分解趋势与残差；线性映射并融合后回归。属于紧凑的 DLinear 风格实现，不复制论文训练设置。',tags:['Decomposition','Channel-wise linear','1-step'],stages:(w,f)=>[
      ['输入',input(w,f),input(w,f),'观察窗口。','窗口之外的样本不可见。'],['转置 + 均值分解',input(w,f),`2 × B × ${f} × ${w}`,'边缘复制均值池化分离趋势与季节成分。','实现为时间轴平均池化分解。'],['双线性映射',`2 × B × ${f} × ${w}`,`B × ${f}`,'对每通道分别将时间长度 W 线性投影到 1。','时间窗长度固定。'],['跨通道线性头',`B × ${f}`,'B × 1','融合三种或五种输入通道。','和把全部窗口直接展平的 OLS 不同。']
    ]},
    {id:'tcn',name:'Causal Residual TCN',short:'TCN',family:'CONVOLUTION',desc:'3 层残差膨胀时序卷积，dilation=1/2/4，裁去右侧填充维持因果性。',tags:['Causal','Dilations 1 / 2 / 4','Residual'],stages:(w,f)=>[
      ['输入',input(w,f),`B × ${f} × ${w}`,'转置为通道优先。','输入时间顺序不变。'],['1×1 stem',`B × ${f} × ${w}`,`B × 48 × ${w}`,'通道映射到隐藏宽度。','时间维度保持。'],['因果残差卷积 ×3',`B × 48 × ${w}`,`B × 48 × ${w}`,'k=3、膨胀 1/2/4、ReLU 和残差路径。','裁剪卷积末尾填充，输出仅依赖当前及过去输入。'],['最后时间片','B × 48 × '+w,'B × 48','取隐藏序列最后状态。','不使用未来。'],['线性预测','B × 48','B × 1','预测目标。','训练过程可单独测评耗时。']
    ]},
    {id:'cnn_gru',name:'CNN + GRU Hybrid',short:'CNN-GRU',family:'HYBRID',desc:'一维卷积先提取局部传感器模式，再经单层 GRU 进行时序建模。',tags:['Conv1d k=3','GRU × 1','Hybrid'],stages:(w,f)=>[
      ['原始输入',input(w,f),input(w,f),'标准化传感器序列。','不跨循环。'],['CNN / ReLU',input(w,f),`B × ${w} × 48`,'通道转置、Conv1d k=3、ReLU 后转回时间优先。','padding=1 维持时间长度。'],['GRU',`B × ${w} × 48`,`B × ${w} × 48`,'单层门控序列编码。','不包含注意力。'],['末端状态',`B × ${w} × 48`,'B × 48','使用最后时间点。','不使用目标步。'],['回归头','B × 48','B × 1','标量输出。','与纯 GRU 可消融比较。']
    ]},
    {id:'patchtst_lite',name:'Patch Transformer · Lite',short:'PatchTST-lite',family:'ATTENTION',desc:'PatchTST 启发的轻量实现：把窗口切为重叠 patches 后编码自注意力。不是原论文完整 PatchTST 模型。',tags:['Overlapping patches','1 encoder','Inspired variant'],stages:(w,f)=>{
      const p=Math.min(8,w),s=Math.max(1,Math.floor(p/2)),n=Math.floor((w-p)/s)+1;
      return [['输入历史',input(w,f),input(w,f),'输入窗口。','当前模型没有原论文全部预训练和通道独立机制。'],['Patch 分割',input(w,f),`B × ${n} × ${p*f}`,'重叠切片，默认 patch 长度 8。',`实际 patch=${p}，stride=${s}。`],['Patch 投影',`B × ${n} × ${p*f}`,`B × ${n} × 48`,'对每个 patch 展平后映射到隐藏维。','叠加可学习 patch 位置向量。'],['Encoder × 1',`B × ${n} × 48`,`B × ${n} × 48`,'4 头 Transformer Encoder。','没有真实的 attention 热图。'],['时间平均池化',`B × ${n} × 48`,'B × 48','对全部 patch token 平均。','仅历史片段。'],['回归输出','B × 48','B × 1','线性输出。','论文启发的轻量对照模型。']];
    }},
    {id:'itransformer_lite',name:'Inverted Transformer · Lite',short:'iTrans-lite',family:'ATTENTION',desc:'iTransformer 启发：把每个变量通道作为 attention token、将整个时间窗口映射为 token embedding。非原论文完整实现。',tags:['Channel tokens','4-head encoder','Inspired variant'],stages:(w,f)=>[
      ['时间 × 通道',input(w,f),`B × ${f} × ${w}`,'转置使传感器通道成为 token。','采用 V/I/T 或五个循环特征。'],['时间维映射',`B × ${f} × ${w}`,`B × ${f} × 48`,'每个变量的 W 个观测映射到 48 维。','叠加可学习变量 embedding。'],['变量注意力',`B × ${f} × 48`,`B × ${f} × 48`,'四头 TransformerEncoder 在通道 token 间交互。','单层紧凑实现。'],['向量展平',`B × ${f} × 48`,`B × ${f*48}`,'保留每个变量 token 信息。','没有未来信号。'],['线性输出',`B × ${f*48}`,'B × 1','回归任务标量。','不是原论文模型的严格复刻。']
    ]}
  );
  const map = Object.fromEntries(designs.map(d => [d.id,d]));
  root.CellModels = {designs,map,stages:(id,w,task='soc')=>map[id].stages(w,task==='soc'?3:5)};
})(window);

# CellScope Lab｜电池 AI 研究工作台

**定位：融合“公开数据源 + 规范化实验 + 模型结构可视化 + 结果审计”的原创开源项目。**

这不是 BatteryBench / BatteryLife 的简单合并或换皮。它借鉴两者的任务和流程思想，用独立代码实现 SOC、SOH、RUL 的最小闭环，并增加可交互、可解释的静态科研网站。

> 当前为 **v0.4 科研学习与实验一体化版本**。项目附带的示例数据由脚本合成，示例测试指标确实由 Python 训练生成，但**不是公开数据集上的论文复现实验**，不能用于宣称模型达到论文精度。

## v0.4 重大升级（2026-11-08）

> **真实知识计算 + 可解释实验流程 + 静态多语言互动。** 将用户提供的四张“预测模型从入门到实战”教学图转化为通用科研方法，而不是简单照搬图内分类指标。网页默认 **浅色**；顶部可切换 **简体中文 / English** 和明暗主题。

| 学习工作台 | 交互功能与科学限制 |
|---|---|
| 四阶段课程学院 | 数据准备→特征与模型→评价→优化，共 **16 节**可展开解释 |
| 时序问题诊所 | **16 种**常见错误，包括时间戳、缺失/长间隔、相位、容量复位、归一化泄漏、RUL 删失等；逐项解释原因与修复原则 |
| 数据划分决策工坊 | 新电池 / 同电芯未来 / 新循环 / 新工况 / 留一电芯的研究目标引导；可交互 **N、W、gap** 时间前向切分，严格“先切原始序列后造窗” |
| 模型源码阅读 | **22 种模型 × 构造 / 前向 / 公共训练** 源码片段；基于实际 `cellscope/models.py` 用 Python AST 自动提取并核验哈希；每模型有中英文解释 |
| 神经网络知识百科 | **25 个**组件和概念，含 ReLU、GELU、Sigmoid、Tanh、Softmax、Dropout、BN、LN、Adam/W、卷积、残差、注意力、优化/梯度等，并展示四种激活函数曲线 |
| 指标计算实验室 | SOC/SOH/RUL 回归：RMSE、MAE、MSE、R²、Bias、MedianAE、MaxAE、NRMSE、MAPE、sMAPE，**低 SOC RMSE 与 MAE/N**；分类：TP/TN/FP/FN、Accuracy、Precision/Recall、F1、MCC、AUC（仅教学计算器） |
| ADV·BATTERY 资源联动 | 在线读取你的独立 GitHub 数据/论文目录，支持搜索筛选、来源/许可详情及论文关联。离线网络受限时明确回退至 12 条内置来源卡 |
| 9 道科研自测 | 逐题答题、查看理由、计分和重做 |
| Volt 电池小精灵 | 右下角可关闭的小助手，固定知识模板 / 关键词问答，**不是在线生成式 AI**；聊天内容在页面正文独立区域展开，浮动入口留有安全边距，不遮挡原页面 |

**区分事实与演示：** `Accuracy / F1 / ROC-AUC` 属于分类指标，不等价于连续 SOC 误差；网页里的分类工具不是 Python 分类模型。时间前向/留一工况划分是科研教学指导，当前 Python CLI 仍只实施 battery/cycle 分组策略。网页激活曲线与模型结构是示意，不是加载权重后的可视化，真实实验结果需运行 Python 并导入 JSON。

详细说明：[科研课程体系](docs/ACADEMY.md) · [划分协议与泄漏](docs/SPLIT_PROTOCOLS.md) · [评价指标公式](docs/METRIC_FORMULAS.md) · [ADV 联动](docs/ADV_INTEGRATION.md) · [网页版 QA](docs/WEB_QA.md) · [中文版网页指南](web/guide.html) / [English guide](web/guide.en.html)。

在线版：[CellScope Lab](https://jimjury.github.io/CellScope-Lab/) · 主仓库 [GitHub](https://github.com/jimjury/CellScope-Lab)。

## 功能清单

| 模块 | 已实现 |
|---|---|
| 数据资源中心 | 12 个内置数据来源/导入协议条目，另可在线读取 ADV·BATTERY 公开目录和论文关联；不镜像第三方原始数据 |
| 预处理实验室 | 交互式抽样/窗口/归一化信号模拟；Python 清洗、去重、相位筛选、无插值抽样、缺口检查 |
| 训练/验证/测试划分 | 电池级分组、固定种子、成员清单、交叉集合重叠审计；SOC 允许循环级对照 |
| 模型动态剧场 | 22 种模型（9 种统计/机器学习 + 13 种神经网络）的逐层数据流、张量形状及搜索筛选 |
| 真实训练后端 | 22 个具有实际训练/推理实现的模型；9 种统计/机器学习 + 13 种 PyTorch 神经网络 |
| 实验配置 | 浏览器导出 JSON，可直接通过 Python CLI 运行 |
| 结果分析 | 导入 `metrics.json` 或多模型 `comparison.json`；显示训练/验证/测试 RMSE、MAE，支持同一协议多模型比较 |
| 科研审计 | 数据哈希、分组成员、只使用训练集拟合归一化、模型选权重来源及限制说明 |

## 安装及运行

```bash
python -m pip install -e .
python -m cellscope demo --out examples/generated/synthetic.csv
python -m cellscope train --config configs/soc_demo.json --out runs/soc_demo
python -m cellscope train --config configs/soh_demo.json --out runs/soh_demo
python -m cellscope train --config configs/rul_demo.json --out runs/rul_demo
```

使用深度网络需要单独安装：

```bash
python -m pip install -e '.[neural]'
```

修改 `configs/soc_demo.json` 中的 `"model": "ridge"` 为 `"model": "rdb_attn_bilstm"` 等即可训练；如使用真实数据，还需修改 `data.path`、真实标签及其来源。网页也可以直接导出这一格式的配置。

## 22 种模型及批量对比

模型完整目录、对应实现、模型是否为论文启发的轻量版以及安装方式，请看 [22 种模型清单](docs/MODELS.md)。当前包括 Mean、Linear、Ridge、ElasticNet、kNN、SVR、RandomForest、ExtraTrees、HistGBDT、MLP、CNN、GRU、LSTM、BiGRU、BiLSTM、Transformer、DLinear、TCN、CNN-GRU、PatchTST-lite、iTransformer-lite 与 RDB-Attention-BiLSTM。

**注意：** PatchTST-lite、iTransformer-lite 是论文结构启发的简化实现，不等于原作者的完整模型。数量增多不代表已在真实电池数据集验证性能。

```bash
python -m pip install -e '.[all,test]'
python -m cellscope models
python -m cellscope compare --config configs/soc_demo.json --models mean,ridge,mlp,gru --out runs/comparison
# 全量测试可使用 --models all，训练耗时会明显增加
```

对比结果输出 `runs/comparison/comparison.json`、`comparison.csv`，网页可导入查看。**仅按验证集 RMSE 排序**；测试指标只用于报告，不用于选权重或调模型。

## 打开 HTML 网页

解压后直接双击 `web/index.html`；或在项目根目录执行 `python -m http.server 8000`，访问 `http://localhost:8000/web/`。静态网站不要求后台服务，可作为 GitHub Pages 网站部署。

**重要区别：** 网页里的模型动画是结构演示，不是真实训练权重的激活可视化；信号实验室是浏览器端确定性模拟，不会修改 CSV；只有 Python 后端执行实际训练。网页版可以导入本地实验生成的 `metrics.json` 查看结果。

## 数据与评估协议

基本字段：`cell_id, cycle_index, time_s, voltage_v, current_a, temperature_c`。再提供一个任务标签：`soc`、`soh` 或 `rul_cycles`。支持把常见 `Voltage_V, Current_A, T, SOC` 等别名规范化。

**SOC**：默认窗口 64，每个样本使用第 1–64 个观测点的电压、电流、温度，预测第 65 个点的 SOC。滑动步长 1；不允许跨电池、跨循环或超时缺口。模型结构与研究者已有 SOC 主线兼容，但本仓库默认是独立通用 benchmark，而不是移植其已有代码。

**SOH / RUL**：从每循环观测提取五项与容量标签无直接重叠的时序统计特征；用当前及之前窗口内循环汇总预测当前循环标签。SOH 的容量标准及 RUL 的 EOL 定义取决于数据来源，必须自行确认；程序不会把最后记录自动当作 EOL。

**归一化**：支持训练集拟合 Min-Max、Z-Score 与关闭归一化，验证/测试共享同一训练统计量。默认按电池划分，训练和测试电池互不重叠。实验输出有严格的原始文件 SHA256、分组成员、参数和预测结果。

完整技术细节见 [DATA_PROTOCOL](docs/DATA_PROTOCOL.md)、[ARCHITECTURE](docs/ARCHITECTURE.md)。

## 质量验证

```bash
python -m pip install -e '.[test,all]'
python -m pytest -q
node --test tests-js/*.cjs
python scripts/verify_assets.py
```

浏览器自动化需要 Chromium 和 Playwright；当前测试环境的 Chromium 被管理策略禁止访问任何 URL，因此浏览器级自动点击**未能完成**，并不宣称已通过该项。请查看 [QA 状态](docs/QA.md)。Python/Node 的自动化测试已通过。

## 与参考开源项目的关系

- [BatteryBench](https://github.com/LMDHQ-0420/BatteryBench)：参考多模型、多任务的统一实验协议。
- [BatteryLife](https://github.com/Ruifeng-Tan/BatteryLife)：参考数据标准化和寿命预测任务组织方式。
- [BatteryML](https://github.com/microsoft/BatteryML)、[BEEP](https://github.com/TRI-AMDD/beep)、[PyBaMM](https://github.com/pybamm-team/PyBaMM)：参考生态和未来扩展方向。

本仓库未复制上述项目源码，未打包第三方数据，具体来源与引用详见 [REFERENCES](docs/REFERENCES.md)。

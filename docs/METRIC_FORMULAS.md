# Regression / Classification metrics — formula, units and failure modes

令 $y_i$ 为真实值、$\hat y_i$ 为预测值、$e_i=\hat y_i-y_i$、$n$ 为样本数：

- MAE = $\frac1n\sum_i |e_i|$：均匀衡量绝对误差。
- MSE = $\frac1n\sum_i e_i^2$：对大误差更敏感，单位为目标平方。
- RMSE = $\sqrt{MSE}$：与原始目标同单位，适合作为 SOC/SOH/RUL 主要比较指标。
- Bias = $\frac1n\sum_i e_i$：有方向的系统偏差；Bias=0 不代表没有误差。
- MedianAE = median$|e_i|$；MaxAE = max$|e_i|$，提示长尾误差。
- $R^2=1-\frac{\sum_i e_i^2}{\sum_i(y_i-\bar y)^2}$：非恒定目标定义，可能为负；对恒定真值显示 N/A。
- NRMSE(range) = RMSE$/\left(\max(y)-\min(y)\right)$：范围为零显示 N/A；与 NRMSE(mean) 不同，必须标记版本。
- MAPE(%) = $100\operatorname{mean}_{i:|y_i|>\epsilon}|e_i/y_i|$：排除近零真值并报告有效样本数；SOC 接近零时不宜作为主指标。
- sMAPE(%) = $200\operatorname{mean}|e_i|/(|y_i|+|\hat y_i|)$，当分母太小跳过并报告数量；其仍有边界及解释性问题。
- 低 SOC RMSE：筛选真实 SOC≤0.2 的样本后再计算 RMSE，并报告 N、阈值和真实容量定义；不代表 0.2 值一定适合所有数据集。

SOC 或 SOH 若以 0–1 比例表示，`RMSE=0.02` 表示 2 个百分比点（2 pp），不是 2% 的相对误差；RUL 是剩余循环数/小时的单位，不能与 SOC RMSE 按绝对数值排名。

## 二分类与故障预测

标准混淆矩阵：TP=实际正且预测正，TN=实际负且预测负，FP=实际负而预测正，FN=实际正而预测负。

- Accuracy = $(TP+TN)/(TP+TN+FP+FN)$。
- Precision = $TP/(TP+FP)$；Recall = $TP/(TP+FN)$。
- Specificity = $TN/(TN+FP)$。
- F1 = $2TP/(2TP+FP+FN)$；Balanced Accuracy = (Recall+Specificity)/2。
- MCC = $(TP\cdot TN-FP\cdot FN)/\sqrt{(TP+FP)(TP+FN)(TN+FP)(TN+FN)}$。
- ROC-AUC：正例风险分数高于负例的概率，加半分并列概率；必须同时有正负类，**从连续评分而非阈值化的混淆矩阵求得**。

某指标分母为零显示 N/A，而非默认为零。二分类数据大量负例时单独 Accuracy 可能误导，应报告 precision/recall、PR 曲线、阈值选择方法、假阳性代价、校准和真实评估人群。ROC-AUC 只是排序能力，不是“误差%”。

### 网站边界

页面计算器所有数值来自访问者输入的数组。自带的演示输入是教学数字，不属于对任何电池模型的真实测试。当前 Python CLI 仅支持 SOC/SOH/RUL 连续回归，不支持故障二分类训练；分类计算器是教学互动。

# Model catalog v0.2 — 22 runnable implementations

Every listed model has a `cellscope.models` train/predict implementation and a corresponding static HTML architecture diagram in `web/assets/models.js`. This is a **coverage catalog**, not a published benchmark leaderboard: no claim is made that these models reproduce upstream paper preprocessing, hyperparameter searches or results.

## Statistical and machine learning (9)

| ID | Family | Actual implementation | Optional dependency |
|---|---|---|---|
| `mean` | Null sanity baseline | Mean of training labels, input ignored | none |
| `linear` | Least squares | scikit-learn LinearRegression | `ml` |
| `ridge` | Regularized linear | Independent SVD ridge, unregularized intercept | none |
| `elasticnet` | Sparse/regularized linear | scikit-learn ElasticNet, l1_ratio=0.5 | `ml` |
| `knn` | Nonparametric | Distance-weighted K-nearest-neighbor regression | `ml` |
| `svr` | Kernel method | RBF epsilon-SVR | `ml` |
| `random_forest` | Bagged trees | RandomForestRegressor, min_samples_leaf=2 | `ml` |
| `extra_trees` | Randomized trees | ExtraTreesRegressor, min_samples_leaf=2 | `ml` |
| `hist_gbdt` | Boosted trees | HistGradientBoostingRegressor | `ml` |

All classic models except `mean` and `ridge` use **scikit-learn on flattened input windows**. Tree and neighbor baselines are not recurrent neural networks; their visualizations are computation diagrams, not neural activation charts.

## Neural / time-series models (13)

| ID | Family | Data path | Claim boundary |
|---|---|---|---|
| `mlp` | Dense | Flatten → Dense + ReLU → output | Compact neural baseline |
| `cnn` | Convolution | Conv1D k=3 → mean pool → output | One convolutional stage |
| `gru` | Recurrent | 1-layer GRU → last token → output | Forward only |
| `lstm` | Recurrent | 1-layer LSTM → last token → output | Forward only |
| `bigru` | Recurrent | 1-layer BiGRU → last token → output | One bidirectional layer |
| `bilstm` | Recurrent | 1-layer BiLSTM → last token → output | One bidirectional layer |
| `transformer` | Attention | Projection + sinusoidal PE → 1 encoder → mean pool | Encoder-only reference |
| `dlinear` | Decomposition/linear | Moving-average trend + residual → per-channel linear → output | Compact decomposition-style DLinear baseline, not full paper protocol |
| `tcn` | Causal temporal convolution | Conv1D stem → dilated residual blocks (1,2,4) → last token | Causal within observed window |
| `cnn_gru` | Hybrid | Conv1D → GRU → last token | Separate from CNN or GRU |
| `patchtst_lite` | Patch attention | Overlap patches → projection → 1 encoder → mean pool | **PatchTST-inspired Lite**, NOT full PatchTST |
| `itransformer_lite` | Variable attention | Variable tokens → 1 encoder → linear head | **iTransformer-inspired Lite**, NOT full iTransformer |
| `rdb_attn_bilstm` | Hybrid | Pointwise → residual DWConv+BN+ReLU → 1-layer BiLSTM → temporal attention → MLP | Compact independent hybrid |

For `transformer`, `patchtst_lite`, `itransformer_lite`, hidden size is divisible by four for four heads. `patchtst_lite` patch length defaults to `min(window,8)` with half-patch stride; it is **not** the original paper's channel-independent PatchTST. Similarly, the `itransformer_lite` output head is intentionally simplified.

## Protocol and install

```bash
pip install -e '.[all,test]'  # optional PyTorch, scikit-learn and pytest
python -m cellscope models  # see installed requirement tier for every model
python -m cellscope demo --out examples/generated/synthetic.csv
python -m cellscope train --config configs/soc_demo.json --out runs/soc_demo
python -m cellscope compare --config configs/soc_demo.json --models mean,ridge,mlp,gru --out runs/compare_soc
```

`compare` produces one directory per model (trained checkpoints, metrics, provenance and predictions) and `comparison.json` / `comparison.csv`. It freezes task, data hash, split, features, seed and non-model parameters, and sorts by **validation RMSE**. Test-set metrics are for *descriptive reporting only*, never used to select epochs/checkpoints or tune variants.

**Caution:** a common input protocol improves reproducibility, but a fixed set of parameters is **not** automatically the scientifically fairest training budget across all algorithms. Meaningful literature comparisons require matching labels, sampling, train/test allocation, observation horizons, and computational budgets.

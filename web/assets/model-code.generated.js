/* AUTO-GENERATED from cellscope/models.py by scripts/build_model_code.py. */
window.CellModelCode = {
  "sha256": "d51aea21fade68e16e400c558aa9e7ea9af649d42bfe8d97582616ce4dea6f06",
  "models": {
    "mean": {
      "id": "mean",
      "family": "classical",
      "build": "class MeanRegressor:\n    def fit(self, x: np.ndarray, y: np.ndarray):\n        self.value = float(np.mean(y))\n        return self\n\n    def predict(self, x: np.ndarray) -> np.ndarray:\n        return np.full(len(x), self.value, dtype=np.float32)",
      "forward": "predict = model.predict(x)",
      "notes": [
        "Only the training target mean is stored.",
        "The trivial baseline reveals whether the data and evaluation pipeline work."
      ],
      "source": "cellscope/models.py"
    },
    "linear": {
      "id": "linear",
      "family": "classical",
      "build": "model = lambda: LinearRegression()",
      "forward": "model.fit(X_train.reshape(N,-1), y_train)\nyhat = model.predict(X_test.reshape(M,-1))",
      "notes": [
        "Ordinary least-squares regression on flattened windows.",
        "Correlated adjacent points can make coefficients unstable."
      ],
      "source": "cellscope/models.py"
    },
    "ridge": {
      "id": "ridge",
      "family": "classical",
      "build": "class RidgeRegressor:\n    \"\"\"Intercept-unregularized ridge with stable SVD for rank-deficient matrices.\"\"\"\n    def __init__(self, alpha: float = 1.0):\n        if alpha < 0:\n            raise ValueError(\"alpha must be nonnegative\")\n        self.alpha = alpha\n\n    def fit(self, x: np.ndarray, y: np.ndarray):\n        X = x.reshape(len(x), -1).astype(np.float64)\n        self.xmean = X.mean(axis=0)\n        self.ymean = float(np.mean(y))\n        X = X - self.xmean\n        U, s, Vh = np.linalg.svd(X, full_matrices=False)\n        shrink = np.divide(s, s*s + self.alpha, out=np.zeros_like(s), where=(s*s + self.alpha) > 0)\n        self.coef = Vh.T @ (shrink * (U.T @ (y - self.ymean)))\n        return self\n\n    def predict(self, x: np.ndarray) -> np.ndarray:\n        X = x.reshape(len(x), -1).astype(np.float64)\n        return ((X - self.xmean) @ self.coef + self.ymean).astype(np.float32)",
      "forward": "predict = model.predict(x)",
      "notes": [
        "Window is flattened, centered, and fitted by regularized least squares.",
        "Ridge is an effective low-complexity comparison."
      ],
      "source": "cellscope/models.py"
    },
    "elasticnet": {
      "id": "elasticnet",
      "family": "classical",
      "build": "model = lambda: ElasticNet(alpha=elasticnet_alpha, l1_ratio=0.5,\n                                          random_state=seed, max_iter=10000)",
      "forward": "model.fit(X_train.reshape(N,-1), y_train)\nyhat = model.predict(X_test.reshape(M,-1))",
      "notes": [
        "L1 + L2 regularization on flattened windows.",
        "Tune alpha on validation, never test."
      ],
      "source": "cellscope/models.py"
    },
    "knn": {
      "id": "knn",
      "family": "classical",
      "build": "model = lambda: KNeighborsRegressor(n_neighbors=n_neighbors, weights=\"distance\")",
      "forward": "model.fit(X_train.reshape(N,-1), y_train)\nyhat = model.predict(X_test.reshape(M,-1))",
      "notes": [
        "Distance-weighted neighbors in normalized feature space.",
        "Scale features first; beware high-dimensional distances."
      ],
      "source": "cellscope/models.py"
    },
    "svr": {
      "id": "svr",
      "family": "classical",
      "build": "model = lambda: SVR(kernel=\"rbf\", C=svr_c, epsilon=0.1)",
      "forward": "model.fit(X_train.reshape(N,-1), y_train)\nyhat = model.predict(X_test.reshape(M,-1))",
      "notes": [
        "RBF kernel support vector regression.",
        "Nonlinear baseline, sensitive to scaling and C/epsilon."
      ],
      "source": "cellscope/models.py"
    },
    "random_forest": {
      "id": "random_forest",
      "family": "classical",
      "build": "model = lambda: RandomForestRegressor(n_estimators=n_estimators,\n                       random_state=seed, n_jobs=1, min_samples_leaf=2)",
      "forward": "model.fit(X_train.reshape(N,-1), y_train)\nyhat = model.predict(X_test.reshape(M,-1))",
      "notes": [
        "Bagged decision trees.",
        "Feature importance is not a causal proof."
      ],
      "source": "cellscope/models.py"
    },
    "extra_trees": {
      "id": "extra_trees",
      "family": "classical",
      "build": "model = lambda: ExtraTreesRegressor(n_estimators=n_estimators,\n                       random_state=seed, n_jobs=1, min_samples_leaf=2)",
      "forward": "model.fit(X_train.reshape(N,-1), y_train)\nyhat = model.predict(X_test.reshape(M,-1))",
      "notes": [
        "More randomized tree splits.",
        "Good for structural comparison with Random Forest."
      ],
      "source": "cellscope/models.py"
    },
    "hist_gbdt": {
      "id": "hist_gbdt",
      "family": "classical",
      "build": "model = lambda: HistGradientBoostingRegressor(max_iter=n_estimators,\n                        max_leaf_nodes=15, min_samples_leaf=5, random_state=seed)",
      "forward": "model.fit(X_train.reshape(N,-1), y_train)\nyhat = model.predict(X_test.reshape(M,-1))",
      "notes": [
        "Histogram gradient boosting of compact decision trees.",
        "Tune iteration budget and leaves on validation."
      ],
      "source": "cellscope/models.py"
    },
    "mlp": {
      "id": "mlp",
      "family": "neural",
      "build": "self.net = nn.Sequential(nn.Flatten(), nn.Linear(sequence_length * in_channels, hidden),\n                                         nn.ReLU(), nn.Linear(hidden, 1))",
      "forward": "return self.net(x).squeeze(-1)",
      "notes": [
        "Flatten window, dense-ReLU-dense.",
        "Does not explicitly model chronological ordering."
      ],
      "source": "cellscope/models.py"
    },
    "cnn": {
      "id": "cnn",
      "family": "neural",
      "build": "self.conv = nn.Sequential(nn.Conv1d(in_channels, hidden, 3, padding=1),\n                                          nn.ReLU(), nn.AdaptiveAvgPool1d(1))\nself.head = nn.Linear(hidden, 1)",
      "forward": "return self.head(self.conv(x.transpose(1, 2)).squeeze(-1)).squeeze(-1)",
      "notes": [
        "Conv1D over the sensor timeline.",
        "Preserves local patterns but pools global position."
      ],
      "source": "cellscope/models.py"
    },
    "gru": {
      "id": "gru",
      "family": "neural",
      "build": "cls = nn.GRU if \"gru\" in name else nn.LSTM\nself.bidirectional = name.startswith(\"bi\")\nself.rnn = cls(in_channels, hidden, batch_first=True,\n                               bidirectional=self.bidirectional)\nself.head = nn.Linear(hidden * (2 if self.bidirectional else 1), 1)",
      "forward": "h, _ = self.rnn(x)\nreturn self.head(h[:, -1, :]).squeeze(-1)",
      "notes": [
        "Gated recurrent neural network.",
        "Output uses the final observed hidden state."
      ],
      "source": "cellscope/models.py"
    },
    "lstm": {
      "id": "lstm",
      "family": "neural",
      "build": "cls = nn.GRU if \"gru\" in name else nn.LSTM\nself.bidirectional = name.startswith(\"bi\")\nself.rnn = cls(in_channels, hidden, batch_first=True,\n                               bidirectional=self.bidirectional)\nself.head = nn.Linear(hidden * (2 if self.bidirectional else 1), 1)",
      "forward": "h, _ = self.rnn(x)\nreturn self.head(h[:, -1, :]).squeeze(-1)",
      "notes": [
        "Long short-term memory encoder.",
        "Output uses the final observed hidden state."
      ],
      "source": "cellscope/models.py"
    },
    "bigru": {
      "id": "bigru",
      "family": "neural",
      "build": "cls = nn.GRU if \"gru\" in name else nn.LSTM\nself.bidirectional = name.startswith(\"bi\")\nself.rnn = cls(in_channels, hidden, batch_first=True,\n                               bidirectional=self.bidirectional)\nself.head = nn.Linear(hidden * (2 if self.bidirectional else 1), 1)",
      "forward": "h, _ = self.rnn(x)\nreturn self.head(h[:, -1, :]).squeeze(-1)",
      "notes": [
        "Bidirectional GRU INSIDE the observed history window.",
        "Does not imply seeing future target-time values."
      ],
      "source": "cellscope/models.py"
    },
    "bilstm": {
      "id": "bilstm",
      "family": "neural",
      "build": "cls = nn.GRU if \"gru\" in name else nn.LSTM\nself.bidirectional = name.startswith(\"bi\")\nself.rnn = cls(in_channels, hidden, batch_first=True,\n                               bidirectional=self.bidirectional)\nself.head = nn.Linear(hidden * (2 if self.bidirectional else 1), 1)",
      "forward": "h, _ = self.rnn(x)\nreturn self.head(h[:, -1, :]).squeeze(-1)",
      "notes": [
        "Bidirectional LSTM inside history.",
        "Input horizon must still end before prediction cutoff."
      ],
      "source": "cellscope/models.py"
    },
    "transformer": {
      "id": "transformer",
      "family": "neural",
      "build": "self.project = nn.Linear(in_channels, hidden)\nself.encoder = nn.TransformerEncoder(\n                    nn.TransformerEncoderLayer(d_model=hidden, nhead=4, dim_feedforward=hidden*2,\n                                               dropout=0.0, batch_first=True), num_layers=1)\npositions = torch.arange(sequence_length, dtype=torch.float32).unsqueeze(1)\ndiv = torch.exp(torch.arange(0, hidden, 2, dtype=torch.float32) * (-math.log(10000.0) / hidden))\npe = torch.zeros(1, sequence_length, hidden)\npe[0, :, 0::2] = torch.sin(positions * div)\npe[0, :, 1::2] = torch.cos(positions * div[:pe[0, :, 1::2].shape[1]])\nself.register_buffer(\"positional_encoding\", pe)\nself.head = nn.Linear(hidden, 1)",
      "forward": "h = self.project(x) + self.positional_encoding[:, :x.shape[1]]\nreturn self.head(self.encoder(h).mean(dim=1)).squeeze(-1)",
      "notes": [
        "One-layer Transformer encoder, positional encoding, pooled output.",
        "A compact original baseline, not any original paper reproduction."
      ],
      "source": "cellscope/models.py"
    },
    "dlinear": {
      "id": "dlinear",
      "family": "neural",
      "build": "self.trend = nn.Linear(sequence_length, 1)\nself.seasonal = nn.Linear(sequence_length, 1)\nself.head = nn.Linear(in_channels, 1)\nself.kernel = min(5, sequence_length if sequence_length % 2 else max(1, sequence_length-1))",
      "forward": "z = x.transpose(1, 2)\npad = self.kernel // 2\nsmooth = torch.nn.functional.avg_pool1d(\n                    torch.nn.functional.pad(z, (pad, pad), mode=\"replicate\"),\n                    kernel_size=self.kernel, stride=1)\ncombined = self.trend(smooth) + self.seasonal(z - smooth)\nreturn self.head(combined.squeeze(-1)).squeeze(-1)",
      "notes": [
        "Separate trend and residual linear projections.",
        "Causal window stays within available observations."
      ],
      "source": "cellscope/models.py"
    },
    "tcn": {
      "id": "tcn",
      "family": "neural",
      "build": "self.stem = nn.Conv1d(in_channels, hidden, 1)\nself.convs = nn.ModuleList([nn.Conv1d(hidden, hidden, 3, dilation=d, padding=2*d)\n                                            for d in [1, 2, 4]])\nself.head = nn.Linear(hidden, 1)",
      "forward": "h = self.stem(x.transpose(1, 2))\nfor dilation, conv in zip((1, 2, 4), self.convs):\n                    h = torch.relu(conv(h)[..., :-2*dilation] + h)\nreturn self.head(h[..., -1]).squeeze(-1)",
      "notes": [
        "Dilated 1D convolutions with residual skip.",
        "The right padded tail is cropped to preserve causality."
      ],
      "source": "cellscope/models.py"
    },
    "cnn_gru": {
      "id": "cnn_gru",
      "family": "neural",
      "build": "self.conv = nn.Sequential(nn.Conv1d(in_channels, hidden, 3, padding=1), nn.ReLU())\nself.rnn = nn.GRU(hidden, hidden, batch_first=True)\nself.head = nn.Linear(hidden, 1)",
      "forward": "h = self.conv(x.transpose(1, 2)).transpose(1, 2)\nh, _ = self.rnn(h)\nreturn self.head(h[:, -1]).squeeze(-1)",
      "notes": [
        "Conv1D local extractor then single-layer GRU.",
        "Compare against each independent branch."
      ],
      "source": "cellscope/models.py"
    },
    "patchtst_lite": {
      "id": "patchtst_lite",
      "family": "neural",
      "build": "self.patch = min(8, sequence_length)\nself.stride = max(1, self.patch // 2)\nself.project = nn.Linear(self.patch * in_channels, hidden)\nself.encoder = nn.TransformerEncoder(\n                    nn.TransformerEncoderLayer(hidden, 4, hidden*2, dropout=0.0,\n                                               batch_first=True), num_layers=1)\npatch_count = (sequence_length - self.patch) // self.stride + 1\nself.patch_positions = nn.Parameter(torch.zeros(1, patch_count, hidden))\nself.head = nn.Linear(hidden, 1)",
      "forward": "patches = x.unfold(1, self.patch, self.stride)\ntokens = self.project(patches.reshape(x.shape[0], -1, in_channels * self.patch))\nh = self.encoder(tokens + self.patch_positions)\nreturn self.head(h.mean(dim=1)).squeeze(-1)",
      "notes": [
        "Overlapping patches then encoder self-attention.",
        "Inspired, NOT full PatchTST reproduction."
      ],
      "source": "cellscope/models.py"
    },
    "itransformer_lite": {
      "id": "itransformer_lite",
      "family": "neural",
      "build": "self.project = nn.Linear(sequence_length, hidden)\nself.encoder = nn.TransformerEncoder(\n                    nn.TransformerEncoderLayer(hidden, 4, hidden*2, dropout=0.0,\n                                               batch_first=True), num_layers=1)\nself.channel_embedding = nn.Parameter(torch.zeros(1, in_channels, hidden))\nself.head = nn.Linear(in_channels * hidden, 1)",
      "forward": "h = self.project(x.transpose(1, 2)) + self.channel_embedding\nh = self.encoder(h)\nreturn self.head(h.flatten(start_dim=1)).squeeze(-1)",
      "notes": [
        "Channels become attention tokens.",
        "Inspired, NOT full iTransformer reproduction."
      ],
      "source": "cellscope/models.py"
    },
    "rdb_attn_bilstm": {
      "id": "rdb_attn_bilstm",
      "family": "neural",
      "build": "self.stem = nn.Conv1d(in_channels, hidden, 1)\nself.depthwise = nn.Conv1d(hidden, hidden, 3, padding=1, groups=hidden)\nself.pointwise = nn.Conv1d(hidden, hidden, 1)\nself.bn = nn.BatchNorm1d(hidden)\nself.relu = nn.ReLU()\nself.rnn = nn.LSTM(hidden, hidden, batch_first=True, bidirectional=True)\nself.attn = nn.Linear(hidden*2, 1)\nself.head = nn.Sequential(nn.Linear(hidden*2, hidden), nn.ReLU(), nn.Linear(hidden, 1))",
      "forward": "initial = self.stem(x.transpose(1, 2))\nh = self.relu(self.bn(self.pointwise(self.depthwise(initial))) + initial)\nh, _ = self.rnn(h.transpose(1, 2))\nweights = torch.softmax(self.attn(h).squeeze(-1), dim=1).unsqueeze(-1)\nreturn self.head((h * weights).sum(dim=1)).squeeze(-1)",
      "notes": [
        "Depthwise separable residual convolution → BiLSTM → attention.",
        "Residual input and output shapes must match."
      ],
      "source": "cellscope/models.py"
    }
  },
  "training": "def train_neural(name, train_x, train_y, val_x, val_y, *, seed=42, epochs=12,\n    torch.manual_seed(seed)\n    opt = torch.optim.Adam(model.parameters(), lr=lr)\n            loss = torch.mean((model(bx) - by)**2)\n            loss.backward()\n            opt.step()\n        model.eval()\n            val_loss = float(torch.mean((model(valid_x)-valid_y)**2))\n        train_loss = sum(v*n for v, n in losses)/sum(n for _, n in losses)\n        if val_loss < best_loss:\n    model.load_state_dict(best_state)\n    model.eval()",
  "disclaimer": "Source excerpts, not standalone code. The complete model implementations are in cellscope/models.py."
};

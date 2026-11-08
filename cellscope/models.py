"""Independent battery regression baselines; optional sklearn and PyTorch backends.

Models are intentionally small, research-auditable implementations rather than
assertions of reproducing third-party published architectures or their metrics.
"""
from __future__ import annotations

import numpy as np

BASELINES = {
    "mean", "linear", "ridge", "elasticnet", "knn", "svr", "random_forest",
    "extra_trees", "hist_gbdt",
}
NEURAL = {
    "mlp", "cnn", "gru", "lstm", "bigru", "bilstm", "transformer",
    "dlinear", "tcn", "cnn_gru", "patchtst_lite", "itransformer_lite",
    "rdb_attn_bilstm",
}
ALL_MODELS = BASELINES | NEURAL


class MeanRegressor:
    def fit(self, x: np.ndarray, y: np.ndarray):
        self.value = float(np.mean(y))
        return self

    def predict(self, x: np.ndarray) -> np.ndarray:
        return np.full(len(x), self.value, dtype=np.float32)


class RidgeRegressor:
    """Intercept-unregularized ridge with stable SVD for rank-deficient matrices."""
    def __init__(self, alpha: float = 1.0):
        if alpha < 0:
            raise ValueError("alpha must be nonnegative")
        self.alpha = alpha

    def fit(self, x: np.ndarray, y: np.ndarray):
        X = x.reshape(len(x), -1).astype(np.float64)
        self.xmean = X.mean(axis=0)
        self.ymean = float(np.mean(y))
        X = X - self.xmean
        U, s, Vh = np.linalg.svd(X, full_matrices=False)
        shrink = np.divide(s, s*s + self.alpha, out=np.zeros_like(s), where=(s*s + self.alpha) > 0)
        self.coef = Vh.T @ (shrink * (U.T @ (y - self.ymean)))
        return self

    def predict(self, x: np.ndarray) -> np.ndarray:
        X = x.reshape(len(x), -1).astype(np.float64)
        return ((X - self.xmean) @ self.coef + self.ymean).astype(np.float32)


class SklearnWindowRegressor:
    """Apply a scikit-learn regressor to explicitly flattened causal windows."""
    def __init__(self, estimator):
        self.estimator = estimator

    def fit(self, x: np.ndarray, y: np.ndarray):
        self.estimator.fit(x.reshape(len(x), -1), np.asarray(y).ravel())
        return self

    def predict(self, x: np.ndarray) -> np.ndarray:
        return np.asarray(self.estimator.predict(x.reshape(len(x), -1)), dtype=np.float32).reshape(-1)


def create_baseline_model(name: str, *, alpha: float = 1.0, seed: int = 42,
                          n_estimators: int = 80, n_neighbors: int = 5,
                          elasticnet_alpha: float = 0.01, svr_c: float = 1.0):
    """Instantiate a model. Only sklearn-specific names require the ml extra."""
    if name == "mean":
        return MeanRegressor()
    if name == "ridge":
        return RidgeRegressor(alpha=alpha)
    if name not in BASELINES:
        raise ValueError(f"Unknown baseline {name}")
    try:
        from sklearn.linear_model import LinearRegression, ElasticNet
        from sklearn.neighbors import KNeighborsRegressor
        from sklearn.svm import SVR
        from sklearn.ensemble import RandomForestRegressor, ExtraTreesRegressor, HistGradientBoostingRegressor
    except ImportError as exc:
        raise ImportError(f"'{name}' needs scikit-learn. Run: pip install -e '.[ml]'") from exc
    if not (n_estimators >= 1 and n_neighbors >= 1):
        raise ValueError("n_estimators and n_neighbors must be positive")
    models = {
        "linear": lambda: LinearRegression(),
        "elasticnet": lambda: ElasticNet(alpha=elasticnet_alpha, l1_ratio=0.5,
                                          random_state=seed, max_iter=10000),
        "knn": lambda: KNeighborsRegressor(n_neighbors=n_neighbors, weights="distance"),
        "svr": lambda: SVR(kernel="rbf", C=svr_c, epsilon=0.1),
        "random_forest": lambda: RandomForestRegressor(n_estimators=n_estimators,
                       random_state=seed, n_jobs=1, min_samples_leaf=2),
        "extra_trees": lambda: ExtraTreesRegressor(n_estimators=n_estimators,
                       random_state=seed, n_jobs=1, min_samples_leaf=2),
        "hist_gbdt": lambda: HistGradientBoostingRegressor(max_iter=n_estimators,
                        max_leaf_nodes=15, min_samples_leaf=5, random_state=seed),
    }
    return SklearnWindowRegressor(models[name]())


def create_neural_model(name: str, sequence_length: int, in_channels: int, hidden: int = 48):
    """Build small real neural regressors, with dependency imported lazily."""
    if name not in NEURAL:
        raise ValueError(f"Not a neural model: {name}")
    if sequence_length < 1 or in_channels < 1 or hidden < 4:
        raise ValueError("sequence_length and in_channels must be positive; hidden >= 4")
    if name in {"transformer", "patchtst_lite", "itransformer_lite"} and hidden % 4:
        raise ValueError("Transformer variants require hidden width divisible by 4")
    import math
    import torch
    from torch import nn

    class SequenceRegressor(nn.Module):
        def __init__(self):
            super().__init__()
            self.kind = name
            if name == "mlp":
                self.net = nn.Sequential(nn.Flatten(), nn.Linear(sequence_length * in_channels, hidden),
                                         nn.ReLU(), nn.Linear(hidden, 1))
            elif name == "cnn":
                self.conv = nn.Sequential(nn.Conv1d(in_channels, hidden, 3, padding=1),
                                          nn.ReLU(), nn.AdaptiveAvgPool1d(1))
                self.head = nn.Linear(hidden, 1)
            elif name in {"gru", "lstm", "bigru", "bilstm"}:
                cls = nn.GRU if "gru" in name else nn.LSTM
                self.bidirectional = name.startswith("bi")
                self.rnn = cls(in_channels, hidden, batch_first=True,
                               bidirectional=self.bidirectional)
                self.head = nn.Linear(hidden * (2 if self.bidirectional else 1), 1)
            elif name == "transformer":
                self.project = nn.Linear(in_channels, hidden)
                self.encoder = nn.TransformerEncoder(
                    nn.TransformerEncoderLayer(d_model=hidden, nhead=4, dim_feedforward=hidden*2,
                                               dropout=0.0, batch_first=True), num_layers=1)
                positions = torch.arange(sequence_length, dtype=torch.float32).unsqueeze(1)
                div = torch.exp(torch.arange(0, hidden, 2, dtype=torch.float32) * (-math.log(10000.0) / hidden))
                pe = torch.zeros(1, sequence_length, hidden)
                pe[0, :, 0::2] = torch.sin(positions * div)
                pe[0, :, 1::2] = torch.cos(positions * div[:pe[0, :, 1::2].shape[1]])
                self.register_buffer("positional_encoding", pe)
                self.head = nn.Linear(hidden, 1)
            elif name == "dlinear":
                # Decomposed linear forecast with per-channel trend/seasonal projections.
                self.trend = nn.Linear(sequence_length, 1)
                self.seasonal = nn.Linear(sequence_length, 1)
                self.head = nn.Linear(in_channels, 1)
                self.kernel = min(5, sequence_length if sequence_length % 2 else max(1, sequence_length-1))
            elif name == "tcn":
                self.stem = nn.Conv1d(in_channels, hidden, 1)
                self.convs = nn.ModuleList([nn.Conv1d(hidden, hidden, 3, dilation=d, padding=2*d)
                                            for d in [1, 2, 4]])
                self.head = nn.Linear(hidden, 1)
            elif name == "cnn_gru":
                self.conv = nn.Sequential(nn.Conv1d(in_channels, hidden, 3, padding=1), nn.ReLU())
                self.rnn = nn.GRU(hidden, hidden, batch_first=True)
                self.head = nn.Linear(hidden, 1)
            elif name == "patchtst_lite":
                # Patch-token self-attention encoder, an *inspired* compact baseline.
                self.patch = min(8, sequence_length)
                self.stride = max(1, self.patch // 2)
                self.project = nn.Linear(self.patch * in_channels, hidden)
                self.encoder = nn.TransformerEncoder(
                    nn.TransformerEncoderLayer(hidden, 4, hidden*2, dropout=0.0,
                                               batch_first=True), num_layers=1)
                patch_count = (sequence_length - self.patch) // self.stride + 1
                self.patch_positions = nn.Parameter(torch.zeros(1, patch_count, hidden))
                self.head = nn.Linear(hidden, 1)
            elif name == "itransformer_lite":
                # Each sensor channel is an attention token; inspired, not an original reproduction.
                self.project = nn.Linear(sequence_length, hidden)
                self.encoder = nn.TransformerEncoder(
                    nn.TransformerEncoderLayer(hidden, 4, hidden*2, dropout=0.0,
                                               batch_first=True), num_layers=1)
                self.channel_embedding = nn.Parameter(torch.zeros(1, in_channels, hidden))
                self.head = nn.Linear(in_channels * hidden, 1)
            elif name == "rdb_attn_bilstm":
                self.stem = nn.Conv1d(in_channels, hidden, 1)
                self.depthwise = nn.Conv1d(hidden, hidden, 3, padding=1, groups=hidden)
                self.pointwise = nn.Conv1d(hidden, hidden, 1)
                self.bn = nn.BatchNorm1d(hidden)
                self.relu = nn.ReLU()
                self.rnn = nn.LSTM(hidden, hidden, batch_first=True, bidirectional=True)
                self.attn = nn.Linear(hidden*2, 1)
                self.head = nn.Sequential(nn.Linear(hidden*2, hidden), nn.ReLU(), nn.Linear(hidden, 1))

        def forward(self, x):
            if self.kind == "mlp":
                return self.net(x).squeeze(-1)
            if self.kind == "cnn":
                return self.head(self.conv(x.transpose(1, 2)).squeeze(-1)).squeeze(-1)
            if self.kind in {"gru", "lstm", "bigru", "bilstm"}:
                h, _ = self.rnn(x)
                return self.head(h[:, -1, :]).squeeze(-1)
            if self.kind == "transformer":
                h = self.project(x) + self.positional_encoding[:, :x.shape[1]]
                return self.head(self.encoder(h).mean(dim=1)).squeeze(-1)
            if self.kind == "dlinear":
                z = x.transpose(1, 2)  # B,F,W
                # Edge replication supports W=1, with no target-time information.
                pad = self.kernel // 2
                smooth = torch.nn.functional.avg_pool1d(
                    torch.nn.functional.pad(z, (pad, pad), mode="replicate"),
                    kernel_size=self.kernel, stride=1)
                combined = self.trend(smooth) + self.seasonal(z - smooth)
                return self.head(combined.squeeze(-1)).squeeze(-1)
            if self.kind == "tcn":
                h = self.stem(x.transpose(1, 2))
                for dilation, conv in zip((1, 2, 4), self.convs):
                    h = torch.relu(conv(h)[..., :-2*dilation] + h)
                return self.head(h[..., -1]).squeeze(-1)
            if self.kind == "cnn_gru":
                h = self.conv(x.transpose(1, 2)).transpose(1, 2)
                h, _ = self.rnn(h)
                return self.head(h[:, -1]).squeeze(-1)
            if self.kind == "patchtst_lite":
                patches = x.unfold(1, self.patch, self.stride)  # B,P,F,patch
                tokens = self.project(patches.reshape(x.shape[0], -1, in_channels * self.patch))
                h = self.encoder(tokens + self.patch_positions)
                return self.head(h.mean(dim=1)).squeeze(-1)
            if self.kind == "itransformer_lite":
                h = self.project(x.transpose(1, 2)) + self.channel_embedding
                h = self.encoder(h)
                return self.head(h.flatten(start_dim=1)).squeeze(-1)
            if self.kind == "rdb_attn_bilstm":
                initial = self.stem(x.transpose(1, 2))
                h = self.relu(self.bn(self.pointwise(self.depthwise(initial))) + initial)
                h, _ = self.rnn(h.transpose(1, 2))
                weights = torch.softmax(self.attn(h).squeeze(-1), dim=1).unsqueeze(-1)
                return self.head((h * weights).sum(dim=1)).squeeze(-1)
            raise RuntimeError("Unknown architecture")

    return SequenceRegressor()


def train_neural(name, train_x, train_y, val_x, val_y, *, seed=42, epochs=12,
                 lr=0.001, hidden=48, batch_size=128, shuffle=False):
    import copy
    import torch
    if epochs < 1 or batch_size < 1:
        raise ValueError("epochs and batch_size must be positive")
    torch.manual_seed(seed)
    torch.set_num_threads(min(2, torch.get_num_threads()))
    model = create_neural_model(name, train_x.shape[1], train_x.shape[2], hidden)
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    data = torch.utils.data.TensorDataset(torch.from_numpy(train_x), torch.from_numpy(train_y))
    loader = torch.utils.data.DataLoader(data, batch_size=batch_size, shuffle=shuffle)
    valid_x = torch.from_numpy(val_x)
    valid_y = torch.from_numpy(val_y)
    best_loss, best_state, best_epoch = float("inf"), None, -1
    history = []
    for epoch in range(epochs):
        model.train()
        losses = []
        for bx, by in loader:
            opt.zero_grad()
            loss = torch.mean((model(bx) - by)**2)
            loss.backward()
            opt.step()
            losses.append((float(loss.detach()), len(bx)))
        model.eval()
        with torch.no_grad():
            val_loss = float(torch.mean((model(valid_x)-valid_y)**2))
        train_loss = sum(v*n for v, n in losses)/sum(n for _, n in losses)
        history.append({"epoch": epoch+1, "train_mse": train_loss, "val_mse": val_loss})
        if val_loss < best_loss:
            best_loss, best_state, best_epoch = val_loss, copy.deepcopy(model.state_dict()), epoch+1
    model.load_state_dict(best_state)
    model.eval()
    return model, history, best_epoch


def predict_neural(model, x):
    import torch
    model.eval()
    with torch.no_grad():
        return model(torch.from_numpy(x)).cpu().numpy().astype(np.float32)

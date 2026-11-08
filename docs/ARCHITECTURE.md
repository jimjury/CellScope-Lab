# Implementation architecture

## Separation of concerns

```text
Public provenance cards ─┐
                         ├─ static web: catalog / signal simulation / split demo / architecture flow
Experiment configuration ┘                                     │
            JSON config  ─────────> cellscope CLI               │
CSV from original lab ──────────> ingress + phase + decimation  │
                                          │                     │
                         cell/cycle split before feature build │
                                          │                     │
                       train-only fit ─── model training        │
                                          │                     │
                            metrics.json <──────────────────────┘ (browser import)
```

`cellscope/data.py` performs schema / finite / time / phase checks. `split.py` provides deterministic disjoint group partitions. `features.py` produces future-safe windows and feature normalization; `models.py` provides 9 classical and 13 neural regression methods. `pipeline.py` runs training and audit; `evaluate.py` calculates metrics; `cli.py` exposes the user interface.

The static website uses **no ML runtime**, cloud API, or data upload. `web/data/catalog.json` is source-of-truth for dataset metadata; `scripts/sync_assets.py` generates classic JavaScript embedding for file:// use. `web/data/demo_run.json` was produced by running the CLI on a synthetic generated CSV, not copied from literature.

## Model code alignment

See [MODELS.md](MODELS.md) for all **22** independent implementations and their actual computational graphs. Nine models are statistical / scikit-learn baselines; 13 are PyTorch sequence regressors. There is one shared training, split, normalization, evaluation and provenance protocol, plus a `cellscope compare` runner with validation-based ranking. Model names with `*_lite` are simplified *inspired* variants, not claims of identical source implementation or paper results.

Batch `B`, time window `W`, features `F = 3` for SOC and `F = 5` for cycle summary tasks. Hidden width `48` is configurable in Python; diagrams currently show the default width. The website's animated layers **illustrate** the architecture but do not serialize weight values, gradients, activation heatmaps or real attention distributions.

## Lifecycle task limits

This prototype provides baseline supervised regression. It does not implement BatteryBench's Four-Level protocol, BatteryLife's cross-chemistry training scale, self-supervised pretraining, joint labels, physical simulation or Bayesian uncertainty. Those are possible future modules, and must not be confused with implemented functionality.

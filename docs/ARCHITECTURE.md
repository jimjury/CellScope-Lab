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

## v0.4 educational extension

The static web retains the original experimental viewer while adding a stand-alone educational layer:

- `web/assets/academy-core.js` — pure finite-vector metrics and split decision functions; no network dependencies.
- `web/assets/academy-data.js` — bilingual course cards, 16 cleaning issues, 25 neural terms, nine question-and-explanation items, and attribution links.
- `web/assets/academy-ui.js` — local forms, code excerpts, quality clinic, metrics, quiz, non-obstructing mascot. External ADV data is treated as untrusted, rendered via `textContent` only and links are HTTPS-checked.
- `web/assets/model-code.generated.js` — generated from the Python AST using `scripts/build_model_code.py`, with SHA256 of `cellscope/models.py`; strict source/filename consistency checked by `scripts/verify_assets.py`.
- `web/assets/i18n.js` — Chinese/English reversible DOM-localization of static and dynamically inserted text; optional theme toggle remains user-controlled, default is bright.
- `web/assets/academy.css`, `web/guide.en.html` — visual design / standalone English guide.
- `scripts/verify_web_http.py` and `tests-js/ui_contract.test.cjs` — HTTP asset checks and DOM-event simulation.

The mascot provides offline preset/keyword help only, not external AI, personal user data storage or model training. A right-edge reserved area and in-flow panel prevent its entry point or expanded content from covering charts/controls. The full ADV public directory is a live linked source, with explicit curated offline fallback; originals and permissions stay in the ADV repository.

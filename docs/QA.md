# Current QA status — v0.4.0 (2026-11-08)

- **52/52 Python tests passed** and **28/28 Node/JavaScript tests passed**, including deterministic DOM event simulation for academy controls and reversible bilingual switching.
- **192 unique DOM IDs, 39 wired static buttons, 22 actual SHA256-backed model code excerpts**, checked by `scripts/verify_assets.py`.
- **16 HTML/CSS/JS assets served successfully over local HTTP**, checked by `scripts/verify_web_http.py`; both CSS files parsed without errors.
- Official GitHub Pages workflow validates all web assets, JavaScript tests and local HTTP before copying `web/` into `dist/` and deploying the complete HTML homepage. See [WEB_QA.md](WEB_QA.md) and Actions for cloud outcomes.
- The Chromium binary has an administrator-enforced URL blocklist, so **real-browser automation and screenshots were not successfully executed here**. The DOM simulator validates JS events but cannot certify layout or CSS rendering. This is a disclosed limitation, not a claim of 100% browser verification.
- Metric values shown by the calculators derive from user-provided numbers; demo training data remain synthetic; fault classification is a **frontend educational calculator**, not a Python classifier. Chronological and leave-one-condition split adviser entries are recommendations, not backend execution modes.

# Verification history — v0.2.0

**Checked during v0.2 update (2026-11-08):**

- Python unit and integration suite: **52 tests passed** for alias handling, phase filtering, row decimation, gap-aware future-safe target alignment, deterministic splits, train-only normalization, metric handling, supervised tasks and neural model forward passes.
- Node native test suite: **10 tests passed** for deterministic split math, cycle-overlap warning, simulation counts, configuration validation, bundled real CLI report schema and catalog links.
- Python CLI end-to-end smoke: synthetic data generation + three Ridge tasks executed; report JSON, prediction CSVs, audit fields produced. Neural architecture forward-shape and backpropagation checks ran for **13 PyTorch variants**. All **22 models** passed at least one synthetic end-to-end SOC training/prediction test. A separate 2-epoch CPU training smoke test also successfully trained the residual-convolution + single-head attention + BiLSTM model, selected a validation epoch, and saved weights. This is a pipeline check, **not** a claim of scientific accuracy.
- HTML static checks: unique DOM element IDs, local script references and JavaScript syntax validated. Asset synchronization script checks generated JS against JSON originals.

**Not verified:** browser-level click/resize screenshots on the v0.2 site. The execution environment has an administrator-managed Chromium URL blocklist (`*`) that prevents both `file://` and local HTTP navigation, even through Playwright. We retried the v0.2 Playwright smoke test, which returned `ERR_BLOCKED_BY_ADMINISTRATOR` for the local test URL. `tests/browser_smoke.py` contains interaction checks for all major controls and two responsive viewports, uses the included example report, and can be executed in an unrestricted environment. Until this is run, browser pixel layout and keyboard interaction are **not fully certified**.

**Additional limitations:** public raw dataset downloads, scientific adapter equivalence, paper figure/metric replication, GPU throughput and GitHub Pages deployment are not independently validated in this release.

## Suggested reproducibility commands

```bash
python -m pip install -e '.[test,all]'
python -m pytest -q
node --test tests-js/*.cjs
python scripts/verify_assets.py
python -m cellscope demo --out examples/generated/synthetic.csv
python -m cellscope train --config configs/soc_demo.json --out runs/soc_demo
python tests/browser_smoke.py  # only if an unrestricted Chrome/Chromium is available
```

For real studies, add dataset-specific QC fixtures and at least two independent data-processing checks before publishing benchmarks.

## v0.2 new verification details

- `tests/test_model_library.py`: each of 22 models trains, predicts and writes audited output on deterministic **synthetic SOC data**; all 13 neural models show finite outputs and nonzero parameter gradients, and three window lengths were probed separately.
- `tests/test_compare_cli.py`: shared source SHA and split grouping in a real two-model `compare` execution; `comparison.json` and `.csv` verified.
- `tests-js/library.test.cjs`: exact alignment of 22 frontend IDs with Python's model registry, complete architecture stages at SOC/SOH widths, JSON config generation, and comparison input validation.
- Extended architecture and functionality do **not** imply accuracy or scientific reproducibility on BatteryBench/BatteryLife real datasets. Paper-inspired Lite implementations are explicitly identified in docs and UI.

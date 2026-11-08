# Roadmap (not a list of completed features)

## V0.1 delivered

- Three supervised tasks, canonical CSV, audited cleaning, no-interpolation row sampling, gap-aware windows.
- Eight runnable models at the original v0.1 delivery; expanded to 22 in v0.2.
- 12 source/protocol cards, interactive web signal laboratory, split audit and dynamic model explorer.
- Pure static HTML with local result upload; Python/Node automated tests.

## V0.2 delivered (2026-11-08)

- Expanded from 8 to **22** runnable models: 9 classical/statistical and 13 neural approaches.
- Added separate sklearn optional dependency, `cellscope models`, and `cellscope compare` (same source/split protocol, validation RMSE sorting, JSON/CSV comparisons).
- Added all 22 model diagrams, local model search and local `comparison.json` viewer.
- All 22 models pass synthetic dataset training/prediction checks; gradients checked for neural variants, backend/browser registry parity tested.

## Next / proposed (NOT implemented)

- Independently verified dataset-specific adapters for BatteryLife standardized artifacts and selected BatteryBench raw datasets, with validation fixtures.
- Explicit train/validation/test source manifests, cross-profile holdouts, leave-one-cell-out evaluation, duplicate sample fingerprints.
- Real model-activation/attention visualization imported from instrumented PyTorch runs, rather than schematic animation.
- Uncertainty intervals with calibrated coverage and per-SOC / per-temperature error slices.
- Multi-seed runs, confidence intervals, paired statistical comparison, and persistent experiment registry.

## V0.3 exploration, NOT implemented

- Dedicated health and diagnostic model families, fault early warning only when labels and safety evaluation protocols support it.
- Physics-engine optional integration with PyBaMM under its own license and reproducibility controls.
- Rich plugin adapters, task-specific provenance certificates and generalization protocol cards.

Changes should be evaluated on data integrity, practical model utility, reproducibility and performance rather than feature counts alone.

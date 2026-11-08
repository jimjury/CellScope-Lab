"""Simple reproducible command-line interface."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from copy import deepcopy
from datetime import datetime, timezone
import pandas as pd
from .models import ALL_MODELS, BASELINES, NEURAL
from .data import load_csv
from .pipeline import run_experiment
from .synthetic import generate_demo


def main(argv=None):
    p = argparse.ArgumentParser(prog="cellscope", description="CellScope Lab battery AI workbench")
    sub = p.add_subparsers(dest="command", required=True)
    demo = sub.add_parser("demo", help="Generate deterministic synthetic CSV")
    demo.add_argument("--out", default="examples/generated/synthetic.csv")
    demo.add_argument("--cells", type=int, default=8)
    demo.add_argument("--cycles", type=int, default=30)
    demo.add_argument("--points", type=int, default=75)
    demo.add_argument("--seed", type=int, default=42)
    for action in ["inspect", "prepare"]:
        q = sub.add_parser(action, help="Audit raw CSV" if action == "inspect" else "Clean and export canonical CSV")
        q.add_argument("--data", required=True)
        q.add_argument("--task", choices=["soc", "soh", "rul"], default="soc")
        q.add_argument("--phase", choices=["all", "discharge"], default="discharge")
        q.add_argument("--discharge-sign", choices=["negative", "positive"], default="negative")
        q.add_argument("--decimation-step", type=int, default=1)
        q.add_argument("--max-gap-sec", type=float, default=10.0)
        q.add_argument("--out")
    train = sub.add_parser("train", help="Train and evaluate with a JSON config")
    train.add_argument("--config", required=True)
    train.add_argument("--data", help="Override config data.path")
    train.add_argument("--out", default="runs/latest")
    catalog = sub.add_parser("catalog", help="Print curated dataset source catalog")
    sub.add_parser("models", help="List all executable model IDs and install extras")
    compare = sub.add_parser("compare", help="Run fixed protocol for multiple models")
    compare.add_argument("--config", required=True, help="Same frozen experiment protocol for all models")
    compare.add_argument("--data", help="Optional CSV override")
    compare.add_argument("--models", default="mean,ridge,mlp", help="Comma-separated IDs or all (slow)")
    compare.add_argument("--out", default="runs/comparison")
    opts = p.parse_args(argv)
    if opts.command == "demo":
        result = generate_demo(opts.out, cells=opts.cells, cycles=opts.cycles,
                               points=opts.points, seed=opts.seed)
    elif opts.command in {"inspect", "prepare"}:
        ing = load_csv(opts.data, task=opts.task, phase=opts.phase,
                       discharge_sign=opts.discharge_sign, decimation_step=opts.decimation_step,
                       max_gap_sec=opts.max_gap_sec)
        result = ing.report
        if opts.command == "prepare":
            if not opts.out:
                p.error("prepare requires --out")
            out = Path(opts.out)
            out.parent.mkdir(parents=True, exist_ok=True)
            ing.frame.to_csv(out, index=False)
            result["prepared_file"] = str(out)
        elif opts.out:
            Path(opts.out).write_text(json.dumps(result, indent=2), encoding="utf-8")
    elif opts.command == "models":
        result = [{"id": name, "kind": "neural" if name in NEURAL else "baseline",
                   "install_extra": "neural" if name in NEURAL else
                                    "ml" if name not in {"mean", "ridge"} else None}
                  for name in sorted(ALL_MODELS)]
    elif opts.command == "compare":
        config = json.loads(Path(opts.config).read_text(encoding="utf-8"))
        names = sorted(ALL_MODELS) if opts.models.strip().lower() == "all" else [s.strip() for s in opts.models.split(',')]
        if not names or any(n not in ALL_MODELS for n in names) or len(names) != len(set(names)):
            p.error(f"Invalid or duplicate model ID. Use 'python -m cellscope models' for valid choices.")
        out = Path(opts.out)
        out.mkdir(parents=True, exist_ok=True)
        rows = []
        anchor = None
        for name in names:
            trial = deepcopy(config)
            trial['model'] = name
            report = run_experiment(trial, data_override=opts.data, output_dir=out / name)
            signature = json.dumps(report['split'], sort_keys=True)
            source_hash = report['source']['sha256']
            if anchor is None: anchor = (signature, source_hash)
            if anchor != (signature, source_hash):
                raise RuntimeError("Comparison split or source changed: refusing incomparable results")
            rows.append({"model":name, "val_rmse":report['metrics']['val']['rmse'],
                         "test_rmse":report['metrics']['test']['rmse'],
                         "test_mae":report['metrics']['test']['mae'],
                         "test_n":report['metrics']['test']['n'],
                         "best_val_epoch":report['selection']['best_val_epoch']})
        # Order by validation error; test error is descriptive, not selection evidence.
        rows.sort(key=lambda item: (item['val_rmse'], item['model']))
        result = {"schema_version":"cellscope-comparison-v1", "task":config['task'],
                  "source_sha256":anchor[1], "synthetic":bool(config.get('data',{}).get('synthetic',False)),
                  "created_at_utc":datetime.now(timezone.utc).isoformat(),
                  "selection":"sorted_by_validation_rmse_test_is_descriptive_only",
                  "models":rows}
        (out/'comparison.json').write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False), encoding='utf-8')
        pd.DataFrame(rows).to_csv(out/'comparison.csv', index=False)
        result = {**result, "comparison_file":str(out/'comparison.json')}
    elif opts.command == "train":
        config = json.loads(Path(opts.config).read_text(encoding="utf-8"))
        result = run_experiment(config, data_override=opts.data, output_dir=opts.out)
        result = {"task": result["task"], "model": result["model"],
                  "metrics": result["metrics"], "result_file": str(Path(opts.out) / "metrics.json")}
    else:
        catalog_path = Path(__file__).resolve().parents[1] / "web" / "data" / "catalog.json"
        result = json.loads(catalog_path.read_text(encoding="utf-8"))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result


if __name__ == "__main__":
    main()

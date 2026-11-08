# Interactive HTML / GitHub Pages QA — 2026-11-08

## Verified by execution

- Full inherited Python test suite: 52 tests passed; JavaScript suite: 28 tests passed (includes 4 DOM event-simulation tests and one bilingual reversible-text test).
- JS syntax `node --check` for each web JavaScript file, including bilingual switching and mascot.
- Real Python AST source excerpt extraction for all 22 model IDs; saved SHA256 equals `cellscope/models.py`.
- Static DOM contract: 192 unique IDs, 10 local script references, 2 stylesheets, 39 wired static buttons, 22 SHA256-verified model excerpts, and 15 in-page navigation links. Simulated DOM click/submit/change interactions verify metrics, assistant, code tabs, split controls, issue filters and quiz.
- HTTP smoke: Chinese/English guides, homepage and 13 locally linked assets from the Python static server yield HTTP 200 (16 files total), CSS/JS MIME types and nonempty bodies; no app backend required.
- Arithmetic test vectors include exact regression R², MAPE zero exclusion, ROC-AUC ties, empty partition, and no overlap across raw time segments.
- Site is bright by default, interactive light/dark toggles, localized links to Chinese/English guide, SVG helper reserved outside page content and opens an inline panel.

## Browser testing limitation (material)

The supplied execution environment's Chromium is restricted by an administrator-managed `URLBlocklist=["*"]` policy. Playwright `page.goto(...)` returns `net::ERR_BLOCKED_BY_ADMINISTRATOR` for both file:// and local HTTP. This is not a test failure in the webpage, but **real browser click-through, visual overflow screenshots, and cross-device layout cannot be honestly certified here**. We do not attempt to bypass the policy. Maintain a real-browser checklist: nav links; language twice; theme twice; 22 model tabs & layer selector; animation play/pause; catalog search and detail; ADV search and fallback; 16 issue cards; split adviser 5 goals; chronological counts; source excerpts and copy; all 25 component cards; regression and classification metrics with bad values; quiz answer/check/reset; assistant open/close/hide and keyword prompts; config export; results import/reset; mobile nav & mascot safe area; tab/keyboard focus.

## Scientific limitations

- Browser activation curves and model shapes are schematics, not observed neural weights; no live GPU training on Pages.
- Classification calculator is educational only; current backend has three regression tasks, not fault classifier training.
- Time-split and leave-one-condition advice are educational (not yet CLI strategies); CLI currently uses battery/cycle split.
- Remote ADV directory depends on GitHub Raw availability. Offline page contains a curated fallback with transparent warning.
- Demo performance remains synthetic and cannot be cited as real battery benchmarking.

## Actual GitHub workflow

`.github/workflows/pages.yml` must serve `web/` via a checked `dist/` artifact and include `dist/index.html` at root. Run `python scripts/verify_assets.py` and `node --test tests-js/*.cjs` before Pages deployment. All GitHub Actions runs should be inspected at https://github.com/jimjury/CellScope-Lab/actions .

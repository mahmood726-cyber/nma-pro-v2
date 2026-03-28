# NMA Pro v8.0 Release Notes (Hardening Pass)
Date: March 6, 2026

## Release Status
Publish gates: PASS (0 required failures)

## What Was Added
- Release hardening gates panel with one-click checks:
  - Adapter conformance suite
  - Publish readiness gates
  - Readiness JSON export
- Parity coverage matrix panel (implemented/verified/pending tracking).
- Golden snapshot scenario pack seeding (18 baseline scenarios).
- Crash-safe adapter import handling:
  - file-size guard
  - empty-file guard
  - file read error handling
- Crash-safe Bayesian grid wrapper with failure-safe UI reporting.

## Validation Summary
- Adapter conformance fixtures: 20 total, 0 failed.
- External concordance (test run): 93.33%.
- Golden regression concordance (test run): 100.0%.
- Publish gates: PASS.
- Browser automation verification:
  - Playwright: PASS
  - Selenium (Edge headless): PASS

## Artifacts
- Readiness report: `release-readiness-2026-03-06.json`

## Notes
- No existing functionality was removed; changes are additive.

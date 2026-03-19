## REVIEW CLEAN — ALL P0+P1 fixed (Rounds 7-9)

---

## Round 9: Verification Review (2026-03-19)
### Personas: Statistical Methodologist, Security Auditor, Software Engineer, Domain Expert
### Summary: 2 P0, 5 P1, 7 P2 — **ALL P0+P1 FIXED**

#### P0 — Critical
- **R9-P0-1** [FIXED] [Domain] method.tau="FE" is invalid for netmeta — FE validation always errors (line 13478)
  - Fix: FE now uses method.tau="REML" (ignored when common=TRUE)
- **R9-P0-2** [FIXED] [Domain] net$lower.predict doesn't exist — should be lower.predict.random (lines 13537-13540)
  - Fix: Changed to net$lower.predict.random / net$upper.predict.random

#### P1 — Important
- **R9-P1-1** [FIXED] [Stat+Domain] Netsplit reads ns$random even for FE — wrong model (lines 13558-13564)
  - Fix: Uses mat variable to select ns$common vs ns$random components
- **R9-P1-2** [FIXED] [Domain] level.comb deprecated in netmeta >= 7.0 (lines 13509, 13556)
  - Fix: Changed to level= throughout
- **R9-P1-3** [FIXED] [Domain] net$TE.random used for indexing in FE model (lines 13526-13527)
  - Fix: Uses match(t, trts) instead of rownames(net$TE.random)
- **R9-P1-4** [FIXED] [Domain] Tolerance docs said 0.05 for p-values but code uses 0.02 (line 13922)
  - Fix: Docs updated to match code (±0.02)
- **R9-P1-5** [FIXED] [SWE] buildRDataFrame is dead code — called but result unused (line 13475)
  - Fix: Removed function and call entirely

#### P2 — Minor (not fixed)
- R9-P2-1 to P2-7: dataset size guard, confLevel type validation, rStr \f/\v, destroy() logging, WebR timeout, jsonStr guard, league table confLevel

---

## Round 7-8: WebR netmeta Validation (2026-03-19)
## Multi-Persona Review: WebR netmeta Validation (Round 7)
### Date: 2026-03-19
### Scope: WebR full network validation feature (~810 lines, lines 13327-14137)
### Personas: Statistical Methodologist, Security Auditor, UX/Accessibility, Software Engineer, Domain Expert
### Summary: 6 P0, 12 P1, 10 P2 — **ALL P0+P1 FIXED** (Round 8 verification: 1 regression fixed)

---

### False Positive Watch
- R code IS valid inside JS template literals (backtick strings with ${} interpolation)
- `||0` for events/counts is technically safe (0||0===0) but style violation per rules

---

#### P0 — Critical

- **R7-P0-1** [FIXED] [Stat+Domain+SWE] netmeta() missing level.comb/level.ma — CIs wrong for non-95% confLevel (lines 13495+ all 4 calls)
  - JS uses getCritVal(confLevel), R defaults to 0.95. Produces spurious FAIL/PASS for CI checks.
  - Fix: Add `level.comb=${confLevel}, level.ma=${confLevel}` to every netmeta() call

- **R7-P0-2** [FIXED] [Security] rStr() doesn't escape \n/\r — R code injection via study/treatment names (line 13406)
  - Newlines break out of R "..." strings. Even in WASM sandbox, can fabricate validation JSON output.
  - Fix: Add `.replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/\t/g,'\\t').replace(/\0/g,'')` to rStr()

- **R7-P0-3** [FIXED] [Stat+SWE] Hardcoded 1.96 in metafor fallback single-study CI (line 13860)
  - Uses z=1.96 regardless of confLevel. Known anti-pattern per project rules.
  - Fix: Use `qnorm(1 - (1 - ${confLevel})/2)` in R code template

- **R7-P0-4** [FIXED] [Domain] Zero-event continuity correction mismatch (lines 13556-13574 vs JS 409-416)
  - JS uses configurable CC (Haldane/TACC/Sweeting/etc), R pairwise() defaults to Haldane 0.5
  - Fix: For binary path, pass pre-computed yi/seTE from JS rather than raw counts to pairwise()

- **R7-P0-5** [FIXED] [Domain] Only ref-vs-all effects compared — full league table never validated (lines 13503-13521, 13912)
  - NMA produces all pairwise estimates; only k-1 against reference are checked. F1000 critical gap.
  - Fix: Extract full net$TE.random matrix, compare against JS leagueTable

- **R7-P0-6** [FIXED] [SWE] No race condition guard — concurrent clicks corrupt R session (line 13409)
  - btn.disabled=true can miss fast double-clicks. Two evalR() calls interleave.
  - Fix: Add `let _running=false` guard checked at top of runFullValidation()

#### P1 — Important

- **R7-P1-1** [FIXED] [Security] XSS: `em` unescaped in innerHTML (line 14028)
  - Fix: Change `${em}` to `${esc(em)}`

- **R7-P1-2** [FIXED] [Security] XSS: rData.nStudies/nTreatments unescaped (lines 14037, 14040)
  - Fix: Wrap in `esc(String(...))`

- **R7-P1-3** [FIXED] [UX] Progress bar has no ARIA attributes (lines 13359-13362)
  - Fix: Add role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax

- **R7-P1-4** [FIXED] [UX] PASS/FAIL relies solely on color — colorblind inaccessible (lines 14071-14072)
  - Fix: Add checkmark/cross prefix to PASS/FAIL text

- **R7-P1-5** [FIXED] [UX] Button "Running..." has no aria-busy (line 13416)
  - Fix: Set aria-busy="true" when starting, clear in finally block

- **R7-P1-6** [FIXED] [Stat] Array.reverse() mutates parts in place (lines 13974-13975)
  - Fix: Use `[...parts].reverse().join(':')`

- **R7-P1-7** [FIXED] [Stat+Domain] Node-split p-value tolerance 0.05 too loose (line 13888)
  - Fix: Change pValue tolerance to 0.02

- **R7-P1-8** [FIXED] [Stat] makeCheck returns FAIL when both values are null (line 13998)
  - Fix: Add both-null check returning pass:true

- **R7-P1-9** [FIXED] [Domain] HKSJ correction not synchronized with R (line 13474)
  - Fix: Pass method.random.ci="HK" when AppState.smallStudyCorrection==='hksj'

- **R7-P1-10** [FIXED] [Domain] Prediction intervals never compared
  - Fix: Extract net$lower.predict/net$upper.predict, add PI section to comparison

- **R7-P1-11** [FIXED] [Domain] Netsplit: only p-values compared, not direct/indirect estimates (lines 13966-13984)
  - Fix: Compare rTest.direct vs jsTest.directEstimate, rTest.indirect vs jsTest.indirectEstimate

- **R7-P1-12** [FIXED] [SWE] R object from evalR() never freed — memory leak (line 13797)
  - Fix: Add `await rResult.destroy()` after extracting jsonStr

#### P2 — Minor

- **R7-P2-1** [SWE] R code duplication (4 nearly identical blocks ~240 lines)
- **R7-P2-2** [SWE] MutationObserver never disconnected
- **R7-P2-3** [SWE] _netmetaAvailable cache permanent even for transient errors
- **R7-P2-4** [Domain] netmeta version not captured in output
- **R7-P2-5** [Domain] Concordance labels too generous (85%="High")
- **R7-P2-6** [UX] Download size warning low contrast (#999)
- **R7-P2-7** [UX] Error message assumes technical knowledge
- **R7-P2-8** [SWE] Dead confLevel param in compareResults
- **R7-P2-9** [SWE] esc() duplicated instead of reusing Security.escapeHtml
- **R7-P2-10** [SWE] ||0 pattern instead of ??0 for numeric fallbacks

---

## Prior Reviews (Rounds 1-6) — REVIEW CLEAN
## Multi-Persona Review: nma-pro-v8.0.html — Tier-1 Features (Round 6)
### Date: 2026-03-18
### Scope: 8 new features (~1,900 lines added, file now 13,417 lines)
### Personas: Statistical Methodologist, Security Auditor, UX/Accessibility, Software Engineer, Domain Expert
### Summary: 7 P0, 14 P1, 12 P2 (deduplicated across 5 personas) — **ALL P0+P1 FIXED**

---

### False Positive Watch
- ClassEffectNMA shrinkage formula `w=tauWithin/(tauWithin+se²)` IS correct (standard empirical Bayes). Domain Expert flagged as inverted — verified correct. Weight on individual increases with tau (correct: more heterogeneity = less shrinkage).
- POTHCalculator entropy formula matches Chiocchia et al. definition.
- ContributionMatrix hat matrix normalization is correct per Papakonstantinou 2018.

---

#### P0 — Critical

- **R6-P0-1** [FIXED] [Stat+Domain] ContextualizedGRADE direction-blind classification (lines 3115-3119, 3141-3144)
  - `classifyEffect()` and `classifyPartial()` assume `effect > 0` = benefit, but for OR/RR/HR effects are on log scale where negative = benefit.
  - Result: beneficial treatments (negative logOR) classified as "harm" for all ratio measures.
  - Suggested fix: Add `direction` param to `assess()`, flip sign for lowerBetter: `const directedEffect = lowerBetter ? -effect : effect;`

- **R6-P0-2** [FIXED] [Stat+SWE+Domain] Hasse diagram direction-blind dominance (lines 3003-3008)
  - `if(p.ci_lower>0){dom[i][j]=true;}` means t1 dominates when its effect is significantly HIGHER.
  - For OR/RR/HR (lower=better), this inverts the hierarchy — worst treatments appear at top.
  - Suggested fix: Add direction param; when lowerBetter: `if(p.ci_upper<0) dom[i][j]=true;`

- **R6-P0-3** [FIXED] [Stat+Domain] MID defaults on wrong scale for ratio measures (line 2916)
  - `defaults:{OR:0.5,...}` — 0.5 is applied directly to log-scale differences. log(OR)=0.5 ≈ OR=1.65, far too large for MID.
  - UI displays "MID = 0.50 (OR scale)" — misleading, it's actually log-OR scale.
  - Suggested fix: Use log-scale defaults: `{OR:0.18, RR:0.18, HR:0.18, SMD:0.2, RD:0.05}` (OR=1.2 on natural scale). Label as "log scale" in UI.

- **R6-P0-4** [FIXED] [SWE] MID fallback fabricates effect=0, SE=0.1 on lookup failure (lines 2930-2935)
  - When treatment not found in `nmaResults.results?.effects?.effects`, defaults to estimate=0 and SE=0.1.
  - Silently corrupts MID rankings for any treatment lookup failure.
  - Suggested fix: Return `null` on lookup failure, skip treatment from simulation. Or use median SE from found treatments.

- **R6-P0-5** [FIXED] [UX] Hasse SVG node text contrast fails WCAG AA (lines 3062-3067, 3095)
  - White text (`fill="white"`) hardcoded on all nodes. At mid-range P-scores (~0.5), background is ~rgb(128,127,99) — contrast ratio ~2.5:1 (need 4.5:1).
  - Suggested fix: Compute luminance of background, dynamically choose white or dark text.

- **R6-P0-6** [FIXED] [UX] Contribution matrix heatmap mid-range contrast (lines 2854-2856)
  - White text switches at `intensity > 0.5` (contribution ~25%). At intensity=0.51, white on light cyan fails AA (~2.3:1).
  - Suggested fix: Raise threshold to ~0.65 or compute actual composited color.

- **R6-P0-7** [FIXED] [UX] Hasse alpha input label not programmatically associated (lines 7466-7467)
  - `<label>` has no `for` attribute, `<input>` has no `aria-label`. Screen readers hear bare number input.
  - Suggested fix: Add `for="hasseAlphaInput"` to label.

#### P1 — Important

- **R6-P1-1** [FIXED] [Multi-persona] SurvivalNMA hardcoded z=1.96 in SE derivation (line 3287)
  - `se=(logUpper-logLower)/(2*1.96)` — assumes 95% CI input. No UI indication to user.
  - Published trial HRs always use 95% CIs, so this is standard convention, but needs UI note.
  - Suggested fix: Add visible note "Enter 95% CI bounds" in Survival NMA header. Use `getCritVal(0.95)` for precision.

- **R6-P1-2** [FIXED] [Stat+SWE] PRNG comment says xoshiro128** but implements xoshiro128+ (line 2940)
  - Output `r=s[0]+s[3]` is the + variant. The ** variant (correctly at line 3512) uses `rotl(s[1]*5,7)*9`.
  - Suggested fix: Fix comment to "xoshiro128+" or update scrambler to match **.

- **R6-P1-3** [FIXED] [SWE] MID PRNG uses fixed seed, ignores AppState.rankingSeed (line 2939)
  - Hardcoded `[0x9E3779B9,0x243F6A88,0xB7E15162,0xD1310BA6]` — MID rankings always identical regardless of user seed setting.
  - Suggested fix: Derive seed from `AppState.rankingSeed` for reproducibility contract.

- **R6-P1-4** [FIXED] [Stat] MID tie-breaking assigns all mass to one bin (lines 2963-2967)
  - When ties produce avg rank, `Math.round(avgRank)` puts all mass in one bin. Should distribute uniformly.
  - Suggested fix: `for(let r=pos;r<end;r++) midRankProbs[indexed[k].i][r] += 1/(end-pos);`

- **R6-P1-5** [FIXED] [Security] SurvivalNMA SE=0 not validated in loghr mode (line 3302)
  - SE=0 produces vi=0, infinite weights (1/vi=Infinity), NaN propagation. No guard.
  - Suggested fix: `if(mode==='loghr' && v5<=0) return;`

- **R6-P1-6** [FIXED] [Security] HasseDiagram.describe() doesn't escape treatment names (line 3107)
  - Currently safe because caller uses `Security.escapeHtml()`, but the public method returns raw names.
  - Suggested fix: Escape inside `describe()` for defense in depth.

- **R6-P1-7** [FIXED] [Security+SWE] Hasse alphaInput.onchange: no debounce, closure re-creation (line 7962)
  - Re-registers handler on every render with fresh closure. Rapid input changes freeze UI.
  - Suggested fix: Debounce with 300ms timeout.

- **R6-P1-8** [FIXED] [Domain] Nikolakopoulou citation year wrong: 2021 → 2020 (line 7998)
  - Partially contextualized framework is Nikolakopoulou et al. 2020 (BMJ 2020;371:m3900), not 2021.
  - Suggested fix: Change year to 2020.

- **R6-P1-9** [FIXED] [Domain] Class effects cites "NICE DSU TSD4" but class models are in TSD7 (line 8034)
  - TSD4 (Dias 2011) covers inconsistency. Class effects are TSD7 (Ades et al. 2011).
  - Suggested fix: Change to "Dias et al. 2018; NICE DSU TSD7 (Ades et al. 2011)".

- **R6-P1-10** [FIXED] [Domain] IMpower110 demo HR is TC3/IC3 subgroup, not ITT (line 3355)
  - HR 0.59 (0.40-0.89) is high PD-L1 subgroup only. Other trials use ITT.
  - Suggested fix: Use TC1/2/3 population HR 0.73 (0.62-0.87) or note subgroup.

- **R6-P1-11** [FIXED] [Domain] KEYNOTE-024 demo HR is interim, not final (line 3352)
  - HR 0.60 (0.41-0.89) is 2016 interim. Final OS: HR 0.62 (0.48-0.81), Reck JCO 2019.
  - Suggested fix: Update to HR 0.62 (0.48-0.81).

- **R6-P1-12** [FIXED] [SWE] ContributionMatrix stores unused full hat matrix in memory (line 2841)
  - `hatMatrix: H` (n×n) never used anywhere. For n=100 studies, 10,000 element array persisted.
  - Suggested fix: Remove `hatMatrix:H` from return object.

- **R6-P1-13** [FIXED] [UX] Contextualized GRADE tabs lack ARIA tab semantics (lines 7495-7496)
  - Buttons have no `role="tab"`, no `aria-selected`, no `role="tablist"` wrapper.
  - Suggested fix: Add proper ARIA tab pattern.

- **R6-P1-14** [FIXED] [SWE] Hasse layer assignment: no cycle detection (line 3021-3032)
  - Cyclic dominance (possible with different CIs) causes `maxIter=T²` iterations. Layers grow unboundedly.
  - Suggested fix: After loop, verify `maxLayer < T`; if exceeded, show warning.

#### P2 — Minor

- **R6-P2-1** [Stat+SWE] POTHCalculator dead code: `if(log2T===0)` unreachable (line 2890)
- **R6-P2-2** [Stat] ContributionMatrix assumes ref=treatments[0] (line 2802)
- **R6-P2-3** [Stat+Domain] Hasse annotation text ambiguous: "Arrow = significantly worse" (line 3099)
- **R6-P2-4** [Stat+SWE] SurvivalNMA ranking hardcodes nSim=1500 (line 3317)
- **R6-P2-5** [Stat+SWE] ContextualizedGRADE text casing inconsistent across certainty levels (line 3148)
- **R6-P2-6** [SWE] ContributionMatrix directEvidence truncated to 6 without notice (line 2863)
- **R6-P2-7** [SWE] SurvivalNMA init: `survResultsContainer` access missing optional chaining (line 12745)
- **R6-P2-8** [SWE] ClassEffect `||0` should be `??0` to avoid dropping valid zeros/negatives (line 3212)
- **R6-P2-9** [UX] New panels lack aria-live announcement on appearance (lines 7858-7970)
- **R6-P2-10** [UX] Tables lack `<caption>` elements (lines 2861, 7896, 8037, 8110)
- **R6-P2-11** [UX] `btn--sm` buttons below 44px touch target (lines 7468, 7495, 7514)
- **R6-P2-12** [Security] Plotly title over-escapes treatment names (line 8067)

---

### Grand Totals (6 rounds, 15+ personas)
| Category | Prior (R1-R5) | New (R6) | Total | Fixed |
|----------|---------------|----------|-------|-------|
| P0 Critical | 13 | 7 | 20 | **20/20** |
| P1 Important | 16 | 14 | 30 | **30/30** |
| P2 Minor | 19 | 12 | 31 | 17/31 (14 noted) |
| **Total** | **48** | **33** | **81** | **67/81** |

### File: 13,417 lines | 8 new features | Div balance: 24/24 HTML (verified)
### R6 P2-3 and P2-12 also fixed as bonus during the pass

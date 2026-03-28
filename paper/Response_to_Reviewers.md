# Response to Reviewers — NMA Pro v8.0

**Manuscript:** NMA Pro v8.0: a browser-based network meta-analysis platform with integrated rapid review and certainty assessment

**Journal:** F1000Research (Software Tool Article)

**Date:** 19 March 2026

---

We thank both reviewers for their detailed and constructive evaluations. Their feedback has strengthened the manuscript and guided meaningful improvements to both the software and its documentation. Below we address each concern point by point, indicating where changes have been made to the manuscript and/or application.

---

## Reviewer 1: Tim Disher (Dalhousie University) — Not Approved

### Concern 1: GitHub link is closed and Zenodo code gives errors

**Response:** We apologize for the access difficulties. The GitHub repository was inadvertently set to private during initial submission. It has now been made public and is accessible at:

- **Source code:** https://github.com/mahmood726-cyber/nma-pro
- **Live demo:** https://mahmood726-cyber.github.io/nma-pro/nma-pro-v8.0.html

The Zenodo archive has been updated with the current release version (v8.0), which has been tested for correct execution in Chrome, Firefox, Edge, and Safari. The application is distributed as a single self-contained HTML file that requires only opening in a modern web browser — no installation, server, or dependencies are needed. We have verified that the archived file loads and executes all analytical functions correctly.

**Manuscript change:** The Software Availability section has been verified to contain correct, functional URLs.

---

### Concern 2: No gap description versus existing GUIs (MetaInsight)

**Response:** We thank the reviewer for highlighting the need for a more explicit positioning relative to existing tools. NMA Pro differs from MetaInsight and other GUI-based platforms in several specific respects:

1. **Integrated rapid review workspace.** NMA Pro is, to our knowledge, the only browser-based NMA tool that integrates literature search (PubMed, OpenAlex, ClinicalTrials.gov), title-and-abstract screening with deduplication, and exploratory NLP extraction within the same application used for statistical analysis. MetaInsight, CMA, GeMTC, and netmeta all require users to perform study identification and screening in separate tools before importing data for analysis.

2. **Fully client-side architecture with no server requirement.** MetaInsight is an R Shiny application that requires either a hosted server instance or a local R installation. NMA Pro runs entirely in the browser as a single HTML file (13,641 lines), with no server, no R installation, and no dependency management. All data remain on the user's machine and are never transmitted externally.

3. **Broader analytical scope in a single interface.** NMA Pro provides component NMA (additive model), dose-response NMA (Emax and restricted cubic spline), meta-regression, Bayesian HMC with configurable priors (half-normal, half-Cauchy, inverse-gamma, log-normal, exponential, informative, uniform), CINeMA and GRADE certainty assessment, multiple publication bias methods (Begg, Egger, PET-PEESE, Copas, trim-and-fill), arm-level binomial NMA, C-STREAM transportability analysis, and in-browser WebR cross-validation — capabilities not collectively available in MetaInsight.

4. **Reproducible rankings via seeded PRNG.** Treatment rankings use a seeded xoshiro128** pseudorandom number generator (1,500 simulations), producing identical results across sessions, machines, and operating systems. Most existing tools use unseeded random number generators for ranking simulations.

**Manuscript change:** The Introduction now includes a more explicit comparison with MetaInsight and other platforms, and Table 1 has been retained to provide a structured feature comparison.

---

### Concern 3: Large-sample normal approximations inappropriate for binary rare events

**Response:** This is an important methodological concern. We address it on two levels:

**Current capabilities (v8.0):** NMA Pro's frequentist engine operates on pre-computed pairwise effect estimates (e.g., log odds ratios with standard errors) rather than raw arm-level count data. This design is intentional and is stated in Limitation 1 of the manuscript. However, this architecture actually provides a practical pathway for handling rare events: users can compute effect estimates externally using exact methods appropriate for sparse data (e.g., exact conditional logistic regression, Peto's one-step method, Mantel-Haenszel odds ratios without continuity corrections, or Bayesian arm-level models) and then import these pre-computed estimates into NMA Pro for network synthesis. The platform does not impose the normal approximation at the effect-size computation stage — it accepts whatever effect estimates the user provides.

Additionally, NMA Pro v8.0 already includes:
- **Arm-level binomial NMA:** A dedicated Bayesian module (`ArmLevelBinomialNMA`) that fits a binomial likelihood model directly to 2x2 count data using MCMC, avoiding the normal approximation entirely for binary outcomes.
- **Configurable zero-cell handling:** When effect sizes are computed within the app from count data, users can select Haldane (0.5), treatment-arm (TACC), or exclusion approaches for continuity correction, with double-zero study handling.
- **Rare event detection:** The integrated data quality checker flags studies with zero events and warns users about potential approximation issues.

**Planned enhancements:** The v8.2 development roadmap includes a Mantel-Haenszel NMA engine that operates directly on 2x2 tables without continuity corrections, specifically designed for rare event networks. This is documented in the development specifications.

**Manuscript change:** A new paragraph has been added to the Discussion section explaining how the pre-computed effect estimate architecture provides a practical pathway for rare events, and noting the existing arm-level binomial NMA module.

---

### Concern 4: NMA code only handles 2-arm trials (no multi-arm correlation)

**Response:** We acknowledge this limitation. The current NMA engine uses a contrast-based (pairwise) input format where each row represents a two-arm comparison. For multi-arm trials, users enter each pairwise comparison from the trial as a separate row. The current implementation does not adjust the variance-covariance matrix for the correlation induced by shared control arms in multi-arm trials.

We note that this is a common simplification in several NMA implementations, and its impact is typically modest when multi-arm trials constitute a small proportion of the network. Nevertheless, the reviewer is correct that ignoring this correlation can lead to overly precise estimates and incorrect standard errors when multi-arm trials are prevalent.

**Planned enhancement:** Multi-arm trial support with proper variance-covariance adjustment is a priority for v8.2. The development specification documents a GLS-based approach using the full Sigma-inverse matrix (including off-diagonal terms for multi-arm studies) rather than diagonal-only weights. This will correctly account for the correlation between treatment contrasts sharing a common comparator arm.

**Manuscript change:** A new paragraph has been added to the Methods section explicitly describing the current two-arm contrast format, acknowledging the limitation for multi-arm trials, and describing planned extensions.

---

### Concern 5: Manuscript lacks summary of logic, outputs, and interpretation

**Response:** We have expanded the manuscript to provide clearer descriptions of:

1. **Analytical logic:** The Methods section now more explicitly describes the contrast-based estimation framework, the graph-theoretical network construction, and the iterative heterogeneity estimation procedures.

2. **Outputs:** The Results/Workflow section describes the outputs produced at each stage: network graphs with edge weights, forest plots with confidence/credible intervals, league tables, ranking plots (P-score and SUCRA), funnel plots, node-splitting tables, and CINeMA/GRADE summary-of-findings tables.

3. **Interpretation guidance:** NMA Pro provides contextual interpretation panels throughout the interface. Each analytical output includes automated interpretation text (e.g., heterogeneity levels, inconsistency signals, publication bias risk, certainty ratings) to help non-specialist users understand results. The CINeMA and GRADE modules produce structured evidence summaries with domain-by-domain assessments and overall certainty ratings.

---

## Reviewer 2: Qi-Ang Wang (China University of Mining) — Approved With Reservations

### Concern 1: Incorporate exact likelihood models for sparse data

**Response:** We agree that exact likelihood models are important for networks with sparse data. As noted in our response to Reviewer 1 (Concern 3), NMA Pro v8.0 already provides:

1. **Arm-level binomial NMA:** The `ArmLevelBinomialNMA` module implements a Bayesian binomial likelihood model that operates directly on 2x2 count data (events and sample sizes per arm), bypassing the normal approximation. This uses MCMC sampling with half-normal priors on the heterogeneity parameter.

2. **Pre-computed estimate import:** The contrast-based architecture allows users to import effect estimates computed using any external method, including exact conditional maximum likelihood, penalized likelihood (Firth correction), or Bayesian hierarchical models fitted in R or Stan. This provides a practical pathway to exact methods while maintaining NMA Pro's accessible interface.

3. **Configurable continuity corrections:** For within-app computation, Haldane (0.5), treatment-arm (N1/(N1+N2)), and exclusion strategies are available.

**Planned:** The v8.2 roadmap includes Mantel-Haenszel NMA for rare events, which avoids continuity corrections entirely by operating on the hypergeometric distribution.

---

### Concern 2: Expand prior library (informed, hierarchical, mixture priors)

**Response:** NMA Pro v8.0's Bayesian engine already supports a substantially broader prior library than described in the original submission. The `logPriorTau` function implements seven prior families for the heterogeneity parameter:

1. **Half-normal** (scale configurable) — default weakly informative
2. **Half-Cauchy** (scale configurable) — heavier tails for uncertain heterogeneity
3. **Inverse-gamma** (shape, scale) — conjugate prior
4. **Log-normal** (mean-log, sd-log) — for positively skewed prior beliefs
5. **Uniform** (upper bound) — non-informative bounded prior
6. **Exponential** (rate) — shrinkage prior
7. **Informative** (mean, sd) — for incorporating domain knowledge or empirical prior distributions (e.g., Turner et al. predictive distributions)

The treatment effect priors use configurable normal distributions with user-specified precision (`betaPriorSD`). The interface provides preset options (Vague Half-Normal(0,1), Weakly Informative HN(0,0.5), Informative HN(0,0.2), Half-Cauchy(0,0.5)) while also accepting custom JSON specifications for advanced users.

Additionally, the robustness module performs automated prior sensitivity analysis across multiple prior specifications, reporting how treatment rankings and effect estimates change across prior choices.

**Manuscript change:** The Methods section has been updated to enumerate the available prior families rather than referring generically to "configurable" priors.

**Planned:** Mixture priors (e.g., spike-and-slab for variable selection in component NMA) and empirical Bayes hierarchical priors are under development for future versions.

---

### Concern 3: Improve literature review with recent Bayesian/ML publications

**Response:** We thank the reviewer for this suggestion. The reference list has been expanded to include recent methodological developments in Bayesian network meta-analysis, including the seminal work of Dias et al. (2018) on the NICE Decision Support Unit Technical Support Documents for evidence synthesis, which provides a comprehensive framework for Bayesian NMA methodology. This reference is particularly relevant as it covers the hierarchical random-effects models, prior specification guidance, and model criticism techniques that underpin NMA Pro's Bayesian implementation.

**Manuscript change:** A new paragraph has been added to the Discussion acknowledging recent advances in Bayesian NMA methodology, and the Dias et al. (2018) reference has been added to the reference list.

---

### Concern 4: Add embedded help modules, tooltips, user manual with worked examples

**Response:** NMA Pro v8.0 includes several user guidance features:

1. **Contextual interpretation panels:** Each analytical output (heterogeneity, consistency, publication bias, rankings, CINeMA) includes automated plain-language interpretation text explaining the results and their implications.

2. **Glossary panel:** An integrated glossary defines key NMA terms (node-splitting, P-score, SUCRA, heterogeneity, etc.) accessible from within the interface.

3. **Method citations:** Each analytical module displays its methodological citation, linking results to the underlying statistical literature.

4. **Data quality diagnostics:** Automated pre-analysis checks flag potential issues (disconnected networks, zero-event studies, high heterogeneity) with actionable recommendations.

5. **Button tooltips:** Interactive elements include descriptive title attributes explaining their function.

We acknowledge that a structured step-by-step tutorial with worked examples would further improve accessibility, particularly for users new to NMA. A comprehensive user guide with worked examples using the built-in demonstration datasets is planned for the project documentation and will be hosted alongside the application.

---

### Concern 5: Support multivariate random-effects for multi-arm trials and inconsistency detection

**Response:** Regarding multi-arm trial support, please see our response to Reviewer 1 (Concern 4). The current contrast-based input format handles multi-arm trials as separate pairwise comparisons without variance-covariance adjustment. Proper multivariate handling with correlated contrasts is planned for v8.2.

Regarding inconsistency detection, NMA Pro v8.0 already implements comprehensive consistency assessment:

1. **Node-splitting:** Separates direct and indirect evidence for each treatment comparison, reporting the difference, its confidence interval, and a p-value for inconsistency.

2. **Fisher combined test:** Aggregates node-splitting p-values into a global inconsistency test using Fisher's method.

3. **Bonferroni-corrected assessment:** Identifies comparisons where inconsistency remains significant after multiple testing correction.

4. **Design-by-treatment interaction test:** A global test for inconsistency based on the Q-statistic decomposition between and within designs (Higgins et al., 2012).

5. **Automated inconsistency summary:** A narrative synthesis function (`summarizeInconsistency`) classifies the overall inconsistency pattern as "No signal," "Localized," "Localized major," or "Global signal detected," incorporating both node-splitting and design-by-treatment results.

6. **CINeMA incoherence domain:** The CINeMA certainty assessment module incorporates inconsistency findings into the formal certainty rating.

These features are described in the revised Methods section.

---

## Summary of Manuscript Changes

1. **Discussion — Rare events paragraph (NEW):** Explains how the pre-computed effect estimate architecture provides a practical pathway for rare event handling, describes the existing arm-level binomial NMA module, and notes planned Mantel-Haenszel NMA development.

2. **Methods — Multi-arm trial support (NEW):** Explicitly describes the current two-arm contrast format, acknowledges the limitation for multi-arm trial correlation, and outlines the planned GLS-based multi-arm extension.

3. **Discussion — Bayesian methodology paragraph (NEW):** Acknowledges recent advances in Bayesian NMA with a new reference to Dias et al. (2018).

4. **Reference [19] (NEW):** Dias S, Welton NJ, Sutton AJ, Ades AE. NICE DSU Technical Support Document 2: A Generalised Linear Modelling Framework for Pairwise and Network Meta-Analysis of Randomised Controlled Trials. National Institute for Health and Care Excellence; 2014 (updated 2018).

---

We believe these revisions address the substantive concerns raised by both reviewers. The application source code, live demo, and archived version are now fully accessible. We welcome any further suggestions for improvement.

# NMA Pro v8.0: a browser-based network meta-analysis platform with integrated rapid review and certainty assessment

## Authors

Mahmood Ahmad [1,2], Niraj Kumar [1], Bilaal Dar [3], Laiba Khan [1], Andrew Woo [4]

1. Royal Free London NHS Foundation Trust, London, UK
2. Tahir Heart Institute, Rabwah, Pakistan
3. King's College London GKT School of Medical Education, London, UK
4. St George's, University of London, London, UK

Corresponding author: Mahmood Ahmad (mahmood726@gmail.com)

## Abstract

**Background:** Network meta-analysis (NMA) enables simultaneous comparison of multiple interventions from a connected evidence network, yet existing software typically separates the literature search, data analysis, and certainty assessment into distinct tools. This fragmentation increases the technical burden on clinical researchers and creates opportunities for transcription error. A unified platform that integrates rapid review, statistical analysis, and evidence grading within a single interface could reduce these barriers.

**Methods:** NMA Pro v8.0 was developed as a client-side browser application distributed as a single HTML file requiring no server infrastructure or software installation. The platform implements frequentist NMA (DerSimonian-Laird, REML, Paule-Mandel, fixed-effect), Bayesian Hamiltonian Monte Carlo, component NMA, dose-response models, meta-regression, and publication bias methods. An integrated rapid review workspace queries PubMed, OpenAlex, and ClinicalTrials.gov through their public APIs, supporting title-and-abstract screening with exploratory natural language processing extraction. Certainty assessment follows the CINeMA and GRADE frameworks. Numerical accuracy was validated against the R package metafor across six benchmark scenarios.

**Results:** All six validation scenarios passed within pre-specified tolerances (maximum observed differences: tau-squared 0.000197, I-squared 3.14 x 10^-13 percentage points, Q-statistic 4.69 x 10^-13, pooled effect 0.000649, P-score 0.00501). Ranking reproducibility was ensured through a seeded pseudorandom number generator (xoshiro128** algorithm, 1500 simulations). The rapid review workspace performed deduplication across sources by DOI, PMID, NCT identifier, and normalized title, and generated draft study records from screened abstracts for manual verification before analysis.

**Conclusions:** NMA Pro v8.0 provides a no-installation browser platform that combines literature search, screening, network meta-analysis, and certainty assessment. The integrated rapid review workspace distinguishes it from existing NMA software and may reduce workflow fragmentation for clinical researchers conducting evidence synthesis.

## Keywords

network meta-analysis, evidence synthesis, rapid review, CINeMA, browser application, GRADE, component NMA

## Introduction

Network meta-analysis extends conventional pairwise meta-analysis by simultaneously comparing three or more interventions through a connected network of direct and indirect evidence [1,2]. The method has become central to clinical guideline development, health technology assessment, and comparative effectiveness research, with applications spanning pharmacological, surgical, and diagnostic interventions [11]. Reporting standards for NMA have been formalized through the PRISMA-NMA extension [11] and the broader PRISMA 2020 framework [14], while search reporting is guided by PRISMA-S [13].

The analytical workflow for NMA typically requires several distinct software tools: bibliographic databases and reference managers for study identification, screening tools for eligibility assessment, statistical packages for model estimation and visualization, and separate frameworks for certainty assessment and reporting. Established NMA software includes the R packages netmeta [3] and metafor [4], the Shiny-based web application MetaInsight, the commercial desktop program Comprehensive Meta-Analysis (CMA), and the Java-based Bayesian tool GeMTC. Each addresses specific analytical needs, but none integrates literature search, screening, statistical analysis, and evidence grading within a single interface.

This separation creates practical barriers for clinical researchers who may lack programming expertise or institutional access to commercial software. Transferring data between tools introduces opportunities for transcription errors, version mismatches, and inconsistent data transformations that complicate reproducibility. Furthermore, certainty assessment frameworks such as CINeMA [9,12] and GRADE are often applied post hoc in separate documents rather than alongside the statistical output they evaluate, increasing the risk of discordance between reported estimates and their certainty ratings.

NMA Pro v8.0 was developed to address these gaps. It is distributed as a single HTML file that runs entirely in the browser without server infrastructure, software installation, or programming knowledge. Its principal distinguishing feature is an integrated rapid review workspace that queries PubMed, OpenAlex, and ClinicalTrials.gov through their open APIs, enabling abstract-level screening and exploratory data extraction within the same application used for NMA. The application also implements advanced methods not commonly available in browser-based tools, including component NMA [10], dose-response modeling, meta-regression, and multiple publication bias diagnostics [8,16,17,18]. This article describes the software architecture, analytical methods, validation results, and limitations following the F1000Research Software Tool Article guidelines.

## Methods

### Implementation

NMA Pro v8.0 is implemented as a self-contained HTML file (8,272 lines) incorporating JavaScript for computation and visualization, CSS for interface design, and inline statistical engines. The application runs entirely client-side in modern web browsers (Chrome, Firefox, Edge, Safari) and requires no backend server, database, or software installation. All data remain on the user's machine and are never transmitted externally.

### Statistical methods

The NMA engine implements four frequentist heterogeneity estimators: DerSimonian-Laird [5], restricted maximum likelihood (REML), Paule-Mandel, and fixed-effect (common-effect) models. Confidence intervals use confidence-level-aware critical values derived from the t-distribution for small degrees of freedom rather than fixed normal approximations [7]. Between-study heterogeneity is quantified through tau-squared, I-squared [6], and Cochran's Q-statistic.

Bayesian analysis uses a Hamiltonian Monte Carlo (HMC) sampler with configurable chain count, iteration number, and burn-in period. Treatment rankings are computed as P-scores [3] for frequentist models and SUCRA [1] for Bayesian models, with rank probabilities estimated from 1500 Monte Carlo simulations using a seeded xoshiro128** pseudorandom number generator for exact reproducibility across sessions.

Network consistency is assessed through node-splitting (comparing direct and indirect evidence for each treatment comparison) and design-by-treatment interaction tests. Publication bias diagnostics include Begg's rank correlation test, Egger's regression [8], PET-PEESE [17], the Copas selection model [16], and Duval and Tweedie's trim-and-fill method [18].

Additional analytical modules include component NMA (CNMA) for additive component models [10], dose-response NMA with Emax and cubic spline models, and meta-regression with user-specified covariates. The C-STREAM module addresses transportability and sample selection bias in evidence networks.

### Certainty assessment

Evidence certainty is evaluated through an integrated CINeMA (Confidence in Network Meta-Analysis) framework [9,12] addressing six domains: within-study bias, reporting bias, indirectness, imprecision, heterogeneity, and incoherence. A complementary GRADE assessment module provides structured evidence-to-decision summaries. Both frameworks operate on the same data and model outputs, avoiding the need to export results to external grading tools.

### Integrated rapid review workspace

The rapid review workspace enables literature identification and screening within the analysis platform. Three open data sources are queried through their public APIs: PubMed via NCBI E-utilities, OpenAlex via its REST API, and ClinicalTrials.gov via the v2 API (with an optional local proxy for browsers where CORS restrictions block direct access). Search results are deduplicated by DOI, PMID, NCT identifier, and normalized title similarity.

Screened records are classified as include, maybe, or exclude through a structured title-and-abstract review interface. For included records, exploratory natural language processing extracts candidate treatment pairs, sample sizes, study design indicators, and outcome keywords. These extraction signals are presented as exploratory hints to assist manual screening and are explicitly labeled as requiring human verification. Draft study records can be generated from screened abstracts, clearly marked as "draft" status pending manual confirmation before inclusion in the NMA.

This workspace performs abstract-level screening only. It does not retrieve full-text articles, access paywalled content, or perform automated data extraction from published manuscripts. Its purpose is to accelerate the initial phases of a rapid review by reducing manual database searching and providing a structured screening environment integrated with the analytical platform.

### In-browser validation

NMA Pro includes an optional WebR module that loads the R package metafor [4] directly in the browser, enabling users to cross-validate their NMA results against an established reference implementation without leaving the application. This requires an initial internet connection to download the WebR runtime (approximately 20 MB).

### Numerical validation

Automated validation was performed across six benchmark scenarios comparing NMA Pro outputs against R (metafor) results. Pre-specified agreement tolerances were: tau-squared difference 0.005 or less, I-squared difference 5 percentage points or less, Q-statistic difference 0.5 or less, pooled effect difference 0.03 or less, and P-score difference 0.05 or less.

## Results

### Validation outcomes

All six benchmark scenarios passed within pre-specified tolerances. Maximum observed differences were: tau-squared 0.000197, I-squared 3.14 x 10^-13 percentage points, Q-statistic 4.69 x 10^-13, pooled effect estimate 0.000649, and P-score 0.00501. These results confirm close numerical agreement between NMA Pro and the R reference implementation for the tested scenarios.

### Feature comparison

Table 1 compares the capabilities of NMA Pro v8.0 against five established NMA software platforms.

**Table 1. Feature comparison of NMA software platforms.**

| Feature | NMA Pro v8.0 | netmeta (R) | MetaInsight | CMA | GeMTC |
|---|---|---|---|---|---|
| Interactive GUI | Yes (browser) | No (CLI) | Yes (server) | Yes (desktop) | No (CLI) |
| No installation required | Yes | No | Partial | No | No |
| Rapid review workspace | Yes | No | No | No | No |
| CT.gov/PubMed/OpenAlex search | Yes | No | No | No | No |
| Bayesian MCMC | Yes | No | No | Yes | Yes |
| Component NMA | Yes | Yes | No | No | No |
| CINeMA certainty assessment | Yes | No | No | No | No |
| Node-splitting | Yes | Yes | Yes | No | Yes |
| SUCRA / P-scores | Yes | Yes | Yes | Yes | Yes |
| Dose-response NMA | Yes | No | No | No | No |
| Publication bias tests | Yes | No | No | Yes | No |
| In-browser R validation | Yes | N/A | No | No | No |
| Seeded PRNG (reproducible ranks) | Yes | No | No | No | No |
| Open source | Yes (MIT) | Yes (GPL) | Yes | No | Yes |

### Workflow

A typical NMA Pro workflow proceeds through four stages: (1) data entry or import of pairwise effect estimates with standard errors; (2) network visualization and connectivity assessment; (3) model estimation with heterogeneity diagnostics, consistency tests, ranking, and publication bias analysis; and (4) certainty assessment via CINeMA or GRADE with export of tables and forest plots. When the rapid review workspace is used, an additional preliminary stage of search, deduplication, screening, and draft record generation precedes data entry.

## Discussion

NMA Pro v8.0 integrates network meta-analysis, certainty assessment, and rapid review functionality in a client-side browser application that requires no installation, server access, or programming knowledge. Its principal contribution relative to existing NMA tools is the integrated rapid review workspace, which allows users to search PubMed, OpenAlex, and ClinicalTrials.gov, screen records at the title-and-abstract level, and generate draft study entries for analysis within a single interface. To our knowledge, no other browser-based NMA platform offers this combination of literature search, screening, and statistical analysis.

The client-side architecture ensures that all data processing occurs locally on the user's machine. No study data, search queries, or analytical results are transmitted to external servers. This design may be particularly advantageous in settings with data governance constraints, limited institutional IT support, or restricted internet connectivity after the initial page load. The single-file distribution model eliminates dependency management and version conflicts that can complicate R-based or server-based alternatives and allows the tool to be used on any device with a modern web browser.

Numerical validation against metafor across six scenarios demonstrated close agreement within pre-specified tolerances across all key statistics (tau-squared, I-squared, Q, pooled effects, and P-scores). The seeded xoshiro128** pseudorandom number generator ensures that ranking simulations produce identical results across sessions, machines, and operating systems, addressing a reproducibility concern that arises when NMA ranking depends on unseeded Monte Carlo procedures.

The CINeMA and GRADE modules address a common gap in NMA software whereby statistical output and certainty assessment are performed in separate tools. By integrating these frameworks alongside the analytical engine and operating on the same underlying data, the platform may reduce the risk of inconsistency between reported effect estimates and their associated certainty ratings. Users can assess within-study bias, reporting bias, indirectness, imprecision, heterogeneity, and incoherence without exporting data to external spreadsheets or web tools.

Several analytical features complement those of established platforms. Component NMA [10] extends analysis to multi-component interventions under an additive model, enabling evaluation of which treatment components drive observed effects. Dose-response NMA supports Emax and cubic spline models for treatments with varying dosage levels. Meta-regression allows exploration of effect modification by study-level covariates. Publication bias assessment through multiple complementary methods (Begg's rank correlation, Egger's regression, PET-PEESE, Copas selection model, trim-and-fill) provides a structured diagnostic battery rather than reliance on any single test [8,16,17,18].

### Limitations

Ten limitations should be considered when using NMA Pro v8.0:

1. The application requires pre-computed pairwise effect estimates (e.g., log odds ratios, mean differences) with standard errors as input. It does not compute effect sizes from raw outcome data or arm-level counts.

2. The Bayesian MCMC implementation uses a simplified HMC sampler without the No-U-Turn Sampler (NUTS) adaptation or divergence diagnostics available in dedicated Bayesian frameworks such as Stan or JAGS.

3. The rapid review NLP extraction is based on regular expression pattern matching rather than machine learning models. Extraction signals are exploratory and require manual verification.

4. ClinicalTrials.gov access may require a local proxy when the browser's cross-origin resource sharing (CORS) policy blocks direct API calls. The application attempts direct access first and falls back to the proxy only when needed.

5. Component NMA is limited to the additive component model and does not support interaction or full-interaction models.

6. Individual participant data NMA is not supported. The platform operates on aggregate study-level data only.

7. Dose-response NMA models are limited to Emax and restricted cubic spline specifications. Fractional polynomial and other flexible parametric models are not available.

8. Ranking simulations use 1500 replicates by default. While sufficient for most applications, this is not parallelized and may be slow for very large networks.

9. No formal usability testing with a diverse sample of end users has been conducted. The interface was designed iteratively based on clinical researcher feedback but has not been evaluated through structured usability studies.

10. The WebR validation module requires an initial internet connection to download the R runtime (approximately 20 MB). Once loaded, it operates offline, but the initial download may be impractical in bandwidth-constrained settings.

## Software availability

Source code: https://github.com/mahmood726-cyber/nma-pro

Archived version: [ZENODO_DOI_PLACEHOLDER]

Live demo: https://mahmood726-cyber.github.io/nma-pro/nma-pro-v8.0.html

License: MIT (https://opensource.org/licenses/MIT)

## Data availability

No new clinical data were generated for this article. The application includes built-in demonstration datasets for testing and validation. The six-scenario benchmark dataset used for R validation is included in the source repository.

## Competing interests

No competing interests were disclosed.

## Grant information

The authors declare that no specific grants were received for this work.

## Author contributions

Mahmood Ahmad: Conceptualization, Software, Validation, Data Curation, Writing - Original Draft, Writing - Review and Editing. Niraj Kumar: Conceptualization, Writing - Review and Editing. Bilaal Dar: Conceptualization, Writing - Review and Editing. Laiba Khan: Conceptualization, Writing - Review and Editing. Andrew Woo: Conceptualization, Writing - Review and Editing.

## Acknowledgements

The authors acknowledge the developers of metafor, netmeta, WebR, and the open APIs provided by NCBI, OpenAlex, and ClinicalTrials.gov.

## References

[1] Salanti G, Ades AE, Ioannidis JPA. Graphical methods and numerical summaries for presenting results from multiple-treatment meta-analysis: an overview and tutorial. J Clin Epidemiol. 2011;64(2):163-171.

[2] Dias S, Welton NJ, Caldwell DM, Ades AE. Checking consistency in mixed treatment comparison meta-analysis. Stat Med. 2010;29(7-8):932-944.

[3] Rucker G, Schwarzer G. Ranking treatments in frequentist network meta-analysis works without resampling methods. BMC Med Res Methodol. 2015;15:58.

[4] Viechtbauer W. Conducting meta-analyses in R with the metafor package. J Stat Softw. 2010;36(3):1-48.

[5] DerSimonian R, Laird N. Meta-analysis in clinical trials. Control Clin Trials. 1986;7(3):177-188.

[6] Higgins JPT, Thompson SG. Quantifying heterogeneity in a meta-analysis. Stat Med. 2002;21(11):1539-1558.

[7] Hartung J, Knapp G. A refined method for the meta-analysis of controlled clinical trials with a binary outcome. Stat Med. 2001;20(24):3875-3889.

[8] Egger M, Davey Smith G, Schneider M, Minder C. Bias in meta-analysis detected by a simple, graphical test. BMJ. 1997;315(7109):629-634.

[9] Papakonstantinou T, Nikolakopoulou A, Higgins JPT, Egger M, Salanti G. CINeMA: Software for semiautomated assessment of the confidence in the results of network meta-analysis. Campbell Syst Rev. 2020;16(1):e1080.

[10] Rucker G, Petropoulou M, Schwarzer G. Network meta-analysis of multicomponent interventions. Biom J. 2020;62(3):808-821.

[11] Hutton B, Salanti G, Caldwell DM, et al. The PRISMA extension statement for reporting of systematic reviews incorporating network meta-analyses of health care interventions: checklist and explanations. Ann Intern Med. 2015;162(11):777-784.

[12] Nikolakopoulou A, Higgins JPT, Papakonstantinou T, et al. CINeMA: an approach for assessing confidence in the results of a network meta-analysis. PLoS Med. 2020;17(4):e1003082.

[13] Rethlefsen ML, Kirtley S, Waffenschmidt S, et al. PRISMA-S: an extension to the PRISMA statement for reporting literature searches in systematic reviews. J Med Libr Assoc. 2021;109(2):174-200.

[14] Page MJ, McKenzie JE, Bossuyt PM, et al. The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. BMJ. 2021;372:n71.

[15] Borenstein M, Hedges LV, Higgins JPT, Rothstein HR. Introduction to Meta-Analysis. Chichester: John Wiley & Sons; 2009.

[16] Copas JB, Shi JQ. A sensitivity analysis for publication bias in systematic reviews. Biostatistics. 2001;2(4):463-477.

[17] Stanley TD, Doucouliagos H. Meta-regression approximations to reduce publication selection bias. Res Synth Methods. 2014;5(1):60-78.

[18] Duval S, Tweedie R. Trim and fill: a simple funnel-plot-based method of testing and adjusting for publication bias in meta-analysis. Biometrics. 2000;56(2):455-463.

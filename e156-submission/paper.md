Mahmood Ahmad
Tahir Heart Institute
mahmood.ahmad2@nhs.net

NMA Pro: A Browser-Based Network Meta-Analysis Platform with Integrated Rapid Review

Can a single browser file replace the multi-tool workflow of network meta-analysis, from literature search through certainty assessment? NMA Pro v8.0 is a 14,313-line self-contained HTML application implementing frequentist NMA with four heterogeneity estimators, Bayesian Monte Carlo, component NMA, dose-response modeling, and eight publication bias methods, validated against R metafor across six benchmark scenarios. The platform integrates PubMed, OpenAlex, and ClinicalTrials.gov queries for abstract screening with deduplication, and implements CINeMA and GRADE certainty frameworks alongside statistical output. All six validation scenarios passed within pre-specified tolerances, with maximum observed differences of 0.000197 for tau-squared and 0.000649 for the pooled effect. Ranking reproducibility was ensured through a seeded xoshiro128-star-star pseudorandom generator with 1,500 Monte Carlo simulations producing identical P-scores across sessions. These results suggest browser-native NMA can match dedicated statistical packages while reducing workflow fragmentation for clinical researchers. However, the tool cannot yet replace server-based Bayesian frameworks for models requiring extended Markov chain convergence beyond browser memory constraints.

Outside Notes

Type: methods
Primary estimand: Pooled treatment effect (SMD/OR/RR)
App: NMA Pro v8.0
Data: Six metafor benchmark scenarios; PubMed/OpenAlex/CT.gov APIs
Code: https://github.com/mahmood726-cyber/nma-pro-v2
Version: 8.0
Validation: DRAFT

References

1. Guyatt GH, Oxman AD, Vist GE, et al. GRADE: an emerging consensus on rating quality of evidence and strength of recommendations. BMJ. 2008;336(7650):924-926.
2. Schunemann HJ, Higgins JPT, Vist GE, et al. Completing 'Summary of findings' tables and grading the certainty of the evidence. Cochrane Handbook Chapter 14. Cochrane; 2023.
3. Borenstein M, Hedges LV, Higgins JPT, Rothstein HR. Introduction to Meta-Analysis. 2nd ed. Wiley; 2021.

AI Disclosure

This work represents a compiler-generated evidence micro-publication (i.e., a structured, pipeline-based synthesis output). AI is used as a constrained synthesis engine operating on structured inputs and predefined rules, rather than as an autonomous author. Deterministic components of the pipeline, together with versioned, reproducible evidence capsules (TruthCert), are designed to support transparent and auditable outputs. All results and text were reviewed and verified by the author, who takes full responsibility for the content. The workflow operationalises key transparency and reporting principles consistent with CONSORT-AI/SPIRIT-AI, including explicit input specification, predefined schemas, logged human-AI interaction, and reproducible outputs.

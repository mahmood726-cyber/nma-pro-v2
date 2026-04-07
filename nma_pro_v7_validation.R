# ============================================================================
# NMA Pro v7.0 Validation Against R Packages
# Comparing: netmeta, metafor, meta, gemtc
# Date: 2026-01-13
# ============================================================================

# Install packages if needed
if (!requireNamespace("netmeta", quietly = TRUE)) install.packages("netmeta")
if (!requireNamespace("metafor", quietly = TRUE)) install.packages("metafor")
if (!requireNamespace("meta", quietly = TRUE)) install.packages("meta")

library(netmeta)
library(metafor)
library(meta)

cat("\n========================================\n")
cat("NMA Pro v7.0 R Validation Suite\n")
cat("========================================\n\n")

# ============================================================================
# TEST DATA: Thrombolytics (same as NMA Pro demo)
# ============================================================================
thrombolytics <- data.frame(
  study = c("GUSTO-1", "ASSENT-2", "INJECT", "RAPID-2", "GISSI-2",
            "ISIS-3", "COBALT", "STAR", "TIMI-10B", "In-TIME"),
  treat1 = c("SK", "TNK", "SK", "rPA", "SK", "SK", "Abb", "rPA", "TNK", "Lan"),
  treat2 = c("tPA", "tPA", "rPA", "tPA", "tPA", "tPA", "tPA", "SK", "tPA", "tPA"),
  event1 = c(1135, 749, 270, 58, 887, 1455, 73, 18, 23, 45),
  n1 = c(13780, 8461, 3004, 324, 10372, 13773, 1457, 376, 837, 2506),
  event2 = c(1021, 753, 285, 63, 862, 1418, 69, 29, 31, 43),
  n2 = c(13746, 8488, 2992, 325, 10396, 13746, 1470, 374, 421, 2503),
  year = c(1993, 1999, 1995, 1996, 1990, 1992, 1997, 1997, 1998, 1999)
)

# ============================================================================
# 1. EFFECT SIZE CALCULATIONS (Log Odds Ratio)
# ============================================================================
cat("1. EFFECT SIZE VALIDATION\n")
cat("--------------------------\n")

# Calculate log OR and SE using metafor formula
calc_logOR <- function(e1, n1, e2, n2) {
  # Add 0.5 continuity correction if needed
  if (e1 == 0 | e1 == n1 | e2 == 0 | e2 == n2) {
    e1 <- e1 + 0.5; n1 <- n1 + 1
    e2 <- e2 + 0.5; n2 <- n2 + 1
  }
  logOR <- log((e1 / (n1 - e1)) / (e2 / (n2 - e2)))
  se <- sqrt(1/e1 + 1/(n1-e1) + 1/e2 + 1/(n2-e2))
  return(c(logOR = logOR, se = se))
}

# Test first study (GUSTO-1)
r_effect <- calc_logOR(1135, 13780, 1021, 13746)
cat(sprintf("GUSTO-1 (SK vs tPA):\n"))
cat(sprintf("  R logOR: %.6f  SE: %.6f\n", r_effect["logOR"], r_effect["se"]))
cat(sprintf("  NMA Pro should match these values\n\n"))

# Expected NMA Pro values (from JS calculation):
# logOR = log((1135/12645) / (1021/12725)) = log(0.0898/0.0802) = 0.1127
# SE = sqrt(1/1135 + 1/12645 + 1/1021 + 1/12725) = 0.0443

# ============================================================================
# 2. PAIRWISE META-ANALYSIS (metafor)
# ============================================================================
cat("2. PAIRWISE META-ANALYSIS\n")
cat("--------------------------\n")

# SK vs tPA studies
sk_tpa <- thrombolytics[thrombolytics$treat1 == "SK" & thrombolytics$treat2 == "tPA", ]

# Calculate effect sizes
es_data <- escalc(measure = "OR",
                  ai = sk_tpa$event1, n1i = sk_tpa$n1,
                  ci = sk_tpa$event2, n2i = sk_tpa$n2,
                  data = sk_tpa)

# Random effects (REML)
ma_reml <- rma(yi, vi, data = es_data, method = "REML")
cat("SK vs tPA (3 studies) - REML:\n")
cat(sprintf("  Pooled logOR: %.4f (95%% CI: %.4f to %.4f)\n",
            ma_reml$beta, ma_reml$ci.lb, ma_reml$ci.ub))
cat(sprintf("  tau2: %.6f  I2: %.1f%%  Q: %.2f (df=%d, p=%.4f)\n",
            ma_reml$tau2, ma_reml$I2, ma_reml$QE, ma_reml$k-1, ma_reml$QEp))

# DerSimonian-Laird
ma_dl <- rma(yi, vi, data = es_data, method = "DL")
cat("\nSK vs tPA - DerSimonian-Laird:\n")
cat(sprintf("  Pooled logOR: %.4f  tau2: %.6f\n", ma_dl$beta, ma_dl$tau2))

# ============================================================================
# 3. NETWORK META-ANALYSIS (netmeta)
# ============================================================================
cat("\n3. NETWORK META-ANALYSIS\n")
cat("--------------------------\n")

# Prepare pairwise data for netmeta
pw <- pairwise(treat = list(treat1, treat2),
               event = list(event1, event2),
               n = list(n1, n2),
               studlab = study,
               data = thrombolytics,
               sm = "OR")

# Run NMA
nma <- netmeta(TE, seTE, treat1, treat2, studlab,
               data = pw,
               sm = "OR",
               reference.group = "tPA",
               comb.random = TRUE,
               comb.fixed = FALSE)

cat("Network estimates (vs tPA reference):\n")
print(round(exp(nma$TE.random[, "tPA"]), 4))

cat("\nHeterogeneity:\n")
cat(sprintf("  tau2: %.6f\n", nma$tau^2))
cat(sprintf("  I2: %.1f%%\n", nma$I2))
cat(sprintf("  Q (total): %.2f (df=%d)\n", nma$Q, nma$df.Q))

# ============================================================================
# 4. P-SCORES AND RANKINGS
# ============================================================================
cat("\n4. TREATMENT RANKINGS\n")
cat("--------------------------\n")

# P-scores from netmeta
pscore <- netrank(nma, small.values = "good")
cat("P-scores (probability of being best, lower mortality = better):\n")
print(round(pscore$Pscore.random, 4))

cat("\nRanking order:\n")
print(sort(pscore$Pscore.random, decreasing = TRUE))

# ============================================================================
# 5. NODE-SPLITTING (Consistency Check)
# ============================================================================
cat("\n5. NODE-SPLITTING ANALYSIS\n")
cat("--------------------------\n")

# Run node-splitting
ns <- netsplit(nma)
cat("Comparisons with direct + indirect evidence:\n")
print(ns$compare.random[, c("comparison", "direct", "indirect", "diff", "p")])

cat("\nInconsistency assessment:\n")
inconsistent <- ns$compare.random$p < 0.05
cat(sprintf("  Inconsistent comparisons: %d / %d\n",
            sum(inconsistent, na.rm = TRUE),
            sum(!is.na(ns$compare.random$p))))

# ============================================================================
# 6. PUBLICATION BIAS TESTS
# ============================================================================
cat("\n6. PUBLICATION BIAS\n")
cat("--------------------------\n")

# Egger's test on SK vs tPA
if (nrow(es_data) >= 3) {
  egger <- regtest(ma_reml, model = "lm")
  cat("Egger's test (SK vs tPA):\n")
  cat(sprintf("  Intercept: %.4f  p-value: %.4f\n",
              egger$est, egger$pval))
  cat(sprintf("  Interpretation: %s\n",
              ifelse(egger$pval < 0.1, "Evidence of publication bias", "No evidence")))
}

# ============================================================================
# 7. HETEROGENEITY STATISTICS VALIDATION
# ============================================================================
cat("\n7. HETEROGENEITY FORMULAS\n")
cat("--------------------------\n")

# Q statistic formula
cat("Q = sum(wi * (yi - pooled)^2)\n")
cat("tau2_DL = max(0, (Q - df) / C)\n")
cat("  where C = sum(wi) - sum(wi^2)/sum(wi)\n")
cat("I2 = max(0, (Q - df) / Q * 100)\n")
cat("H2 = Q / df\n\n")

# Manual calculation for SK vs tPA
wi <- 1/es_data$vi
pooled_fe <- sum(wi * es_data$yi) / sum(wi)
Q_manual <- sum(wi * (es_data$yi - pooled_fe)^2)
df <- nrow(es_data) - 1
C <- sum(wi) - sum(wi^2)/sum(wi)
tau2_dl <- max(0, (Q_manual - df) / C)
I2_manual <- max(0, (Q_manual - df) / Q_manual * 100)

cat("Manual calculations (SK vs tPA):\n")
cat(sprintf("  Q: %.4f (metafor: %.4f)\n", Q_manual, ma_reml$QE))
cat(sprintf("  tau2 (DL): %.6f (metafor: %.6f)\n", tau2_dl, ma_dl$tau2))
cat(sprintf("  I2: %.1f%% (metafor: %.1f%%)\n", I2_manual, ma_dl$I2))

# ============================================================================
# 8. CONFIDENCE INTERVAL CALCULATIONS
# ============================================================================
cat("\n8. CONFIDENCE INTERVALS\n")
cat("--------------------------\n")

cat("Standard 95% CI: estimate +/- 1.96 * SE\n")
cat("HKSJ-corrected CI: estimate +/- t(df, 0.975) * SE * sqrt(HKSJ_factor)\n")
cat("  HKSJ_factor = sum(wi * (yi - pooled_RE)^2) / (k-1)\n\n")

# HKSJ example
wi_re <- 1/(es_data$vi + ma_reml$tau2)
pooled_re <- sum(wi_re * es_data$yi) / sum(wi_re)
hksj_factor <- sum(wi_re * (es_data$yi - pooled_re)^2) / df
se_hksj <- sqrt(1/sum(wi_re)) * sqrt(hksj_factor)
t_crit <- qt(0.975, df)

cat("HKSJ Adjustment (SK vs tPA):\n")
cat(sprintf("  Standard SE: %.4f\n", sqrt(1/sum(wi_re))))
cat(sprintf("  HKSJ factor: %.4f\n", hksj_factor))
cat(sprintf("  HKSJ SE: %.4f\n", se_hksj))
cat(sprintf("  95%% CI: %.4f to %.4f\n",
            pooled_re - t_crit * se_hksj,
            pooled_re + t_crit * se_hksj))

# ============================================================================
# 9. EXPECTED VALUES FOR NMA PRO VALIDATION
# ============================================================================
cat("\n========================================\n")
cat("EXPECTED VALUES FOR NMA PRO v7.0\n")
cat("========================================\n\n")

cat("Using thrombolytics demo data with tPA as reference:\n\n")

cat("Network Heterogeneity:\n")
cat(sprintf("  tau2: %.6f (+/- 0.001 acceptable)\n", nma$tau^2))
cat(sprintf("  I2: %.1f%% (+/- 2%% acceptable)\n", nma$I2))

cat("\nTreatment Effects (OR vs tPA):\n")
for (t in names(exp(nma$TE.random[, "tPA"]))) {
  if (t != "tPA") {
    or <- exp(nma$TE.random[t, "tPA"])
    cat(sprintf("  %s: OR = %.3f\n", t, or))
  }
}

cat("\nP-scores:\n")
for (t in names(sort(pscore$Pscore.random, decreasing = TRUE))) {
  cat(sprintf("  %s: %.4f\n", t, pscore$Pscore.random[t]))
}

cat("\nAcceptable Tolerance:\n")
cat("  - Effect estimates: +/- 0.01 on log scale\n")
cat("  - tau2: +/- 0.001\n")
cat("  - I2: +/- 2 percentage points\n")
cat("  - P-scores: +/- 0.02\n")

# ============================================================================
# 10. VALIDATION SUMMARY
# ============================================================================
cat("\n========================================\n")
cat("VALIDATION CHECKLIST\n")
cat("========================================\n\n")

checks <- data.frame(
  Component = c(
    "Effect size calculation (logOR)",
    "Standard error calculation",
    "Q statistic",
    "tau2 (DL estimator)",
    "tau2 (REML estimator)",
    "I2 heterogeneity",
    "Network estimates",
    "P-scores/rankings",
    "Node-splitting",
    "HKSJ correction",
    "Egger's test"
  ),
  R_Package = c(
    "metafor::escalc",
    "metafor::escalc",
    "metafor::rma",
    "metafor::rma(method='DL')",
    "metafor::rma(method='REML')",
    "metafor::rma",
    "netmeta::netmeta",
    "netmeta::netrank",
    "netmeta::netsplit",
    "metafor (HKSJ)",
    "metafor::regtest"
  ),
  Status = c(
    "Compare", "Compare", "Compare", "Compare", "Compare",
    "Compare", "Compare", "Compare", "Compare", "Compare", "Compare"
  )
)

print(checks)

cat("\n========================================\n")
cat("R SESSION INFO\n")
cat("========================================\n")
print(sessionInfo())

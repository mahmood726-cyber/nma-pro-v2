# NMA Pro v6.2 - Complete Documentation

## Overview
**File**: `nma-pro-v6.2-optimized.html`
**Type**: Single-file HTML application (~200KB)
**Libraries**: Plotly.js (CDN), custom Stats/Matrix utilities
**Last Updated**: December 2025

---

## Features Summary

### Core Analysis Modules
1. **FrequentistNMA** - Random-effects network meta-analysis
2. **BayesianNMA** - MCMC-based Bayesian analysis with multiple priors
3. **NetworkGuardian** - Data validation and network health scoring
4. **PublicationBias** - Egger's test, Begg's test, Trim & Fill, PET-PEESE
5. **NetworkMetaRegression** - Continuous and categorical meta-regression
6. **CNMA** - Component Network Meta-Analysis
7. **CINeMA** - Confidence in Network Meta-Analysis framework
8. **GRADE_NMA** - GRADE evidence quality assessment
9. **LeaveOneOut** - Sensitivity analysis
10. **CumulativeNMA** - Living/cumulative meta-analysis
11. **DoseResponse** - Emax and spline dose-response models
12. **C-STREAM** - Transportability analysis

### Visualization Functions
- `renderNetworkGraph()` - Interactive network visualization
- `renderForestPlot()` - Forest plot with prediction intervals
- `renderRankogram()` - Ranking probability bar chart
- `renderRankProbMatrix()` - Heat map of ranking probabilities
- `renderFunnelPlot()` - Standard funnel plot
- `renderComparisonAdjustedFunnel()` - Comparison-adjusted funnel (canvas)
- `renderConsistencyPlot()` - Direct vs indirect evidence
- `renderBubblePlot()` - Meta-regression scatter plot
- `renderSubgroupForestPlot()` - Subgroup analysis forest (canvas)
- `renderCNMAForestPlot()` - Component effects forest
- `renderCNMASplitPlot()` - Component split bar chart
- `renderBayesianResults()` - Trace plot, posterior density, estimates
- `drawInfluencePlot()` - Leave-one-out influence (canvas)
- `renderCumulativeResults()` - Cumulative effect over time
- `renderDoseResponsePlot()` - Dose-response curve

---

## Theme System

### Implementation
- CSS variables for all colors (`--text-primary`, `--surface-raised`, etc.)
- `data-theme` attribute on `<html>` element (`light` or `dark`)
- `getThemeColors()` function returns appropriate Plotly colors
- Theme persisted in `localStorage`

### Theme Toggle Function
```javascript
function toggleTheme() {
  const html = document.documentElement;
  const curr = html.getAttribute('data-theme');
  const next = curr === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  document.getElementById('themeIcon').textContent = next === 'light' ? '☀️' : '🌙';
  localStorage.setItem('nma-pro-theme', next);
  if (AppState.results) setTimeout(() => { refreshAllPlots() }, 100);
}
```

### refreshAllPlots Function
Re-renders all visualizations when theme changes:
- Network graph
- Forest plot
- Rankogram
- Rank probability matrix
- Funnel plot
- Consistency plot
- Bubble plot
- CNMA plots (forest + split)
- Bayesian results (trace + posterior)
- Leave-one-out influence plot
- Cumulative results
- Dose-response plot
- Subgroup forest plot

---

## Tooltips Reference

### Data Tab - Study Table Headers
| Column | Tooltip |
|--------|---------|
| Study | "Name of the study (e.g., Smith 2020)" |
| Arm 1 | "First treatment being compared" |
| E₁ | "Number of patients with the outcome in Arm 1 (e.g., deaths, cured)" |
| N₁ | "Total number of patients in Arm 1" |
| M₁ | "Average value in Arm 1 (for continuous outcomes like blood pressure)" |
| SD₁ | "How spread out the values are in Arm 1" |
| D₁ | "Drug dose in Arm 1 (mg) - needed for dose-response analysis" |
| Arm 2 | "Second treatment being compared" |
| E₂ | "Number of patients with the outcome in Arm 2" |
| N₂ | "Total number of patients in Arm 2" |
| M₂ | "Average value in Arm 2 (for continuous outcomes)" |
| SD₂ | "How spread out the values are in Arm 2" |
| D₂ | "Drug dose in Arm 2 (mg) - needed for dose-response analysis" |
| Year | "Year the study was published" |
| ROB | "Risk of Bias: low (good quality), high (potential problems), or unclear" |

### Data Tab - Analysis Options
| Element | Tooltip |
|---------|---------|
| Reference | "The baseline treatment - all other treatments will be compared against this one" |
| Direction | "Is a lower value better (e.g., fewer deaths) or higher better (e.g., more cures)?" |
| Small-Study Correction | "Correction for small studies - HKSJ is recommended, makes confidence intervals wider when there are few studies" |
| Prediction intervals | "Shows the expected range if you did a new study - wider than confidence intervals because it accounts for between-study variation" |
| Bayesian pill | "Run a Bayesian analysis - gives probability distributions instead of point estimates" |
| CV-I² pill | "Cross-validated I² - checks if heterogeneity estimate is reliable" |
| C-STREAM pill | "Check if results would apply to a different patient population" |
| GRADE pill | "Rate the quality of evidence using the GRADE framework" |

### Guardian Tab - Health Metrics
| Metric | Tooltip |
|--------|---------|
| Integrity | "Is your data complete and valid? Higher = fewer missing values and data errors" |
| Evidence | "How much evidence do you have? Based on number of studies and total patients" |
| Risk | "Overall risk of problems with your analysis - considers bias, small studies, etc." |

### Guardian Tab - Network Geometry
| Metric | Tooltip |
|--------|---------|
| Agglomeration | "How clustered is your network? High values mean treatments tend to be compared within tight groups" |
| Mean Path | "Average number of steps to get from one treatment to another. Lower = more connected network" |
| Diversity | "Is evidence spread evenly? Low diversity means most evidence comes from a few comparisons" |
| Direct Prop | "What percentage of treatment pairs have been directly compared in at least one study?" |
| Density | "How complete is the network? 1.0 = every treatment compared to every other treatment" |
| Eff. Treatments | "Effective number of treatments - accounts for how well-connected each treatment is" |

### Network Tab
| Element | Tooltip |
|---------|---------|
| Network Graph title | "Each circle is a treatment. Lines connect treatments that were compared directly. Thicker lines = more studies. Bigger circles = more patients." |

### Results Tab
| Element | Tooltip |
|---------|---------|
| Forest Plot title | "Shows effect size for each treatment vs reference. Square = point estimate, line = 95% CI. If line crosses 1 (or 0), effect is not statistically significant." |
| League Table title | "Matrix comparing ALL treatments. Read across rows. Green shading = row treatment is better than column. Red shading = row treatment is worse. Bold = statistically significant." |

### Ranking Tab
| Element | Tooltip |
|---------|---------|
| Treatment Rankings title | "Shows which treatments are most likely to be best. Rank 1 = best. P-score/SUCRA near 1 = high probability of being best." |
| P-score column | "Probability of being best (0-1). A score of 0.9 means 90% chance this is the best treatment" |
| SUCRA column | "Same as P-score but from Bayesian analysis. 100% = always ranked best, 0% = always ranked worst" |
| Mean Rank column | "Average position when treatments are ranked. 1 = best, higher numbers = worse" |
| 95% CI column | "Range where the true rank likely falls. Wide range = uncertain ranking" |
| Rankogram title | "Bar chart showing probability of each treatment being ranked 1st, 2nd, 3rd, etc. Flat bars = uncertain ranking, tall single bar = confident ranking." |

### Heterogeneity Tab
| Element | Tooltip |
|---------|---------|
| Heterogeneity Statistics title | "Measures how different the study results are from each other. High heterogeneity means studies found very different effects." |
| τ² | "Tau-squared: measures how much the true treatment effects vary between studies. Zero = all studies found the same effect" |
| τ | "Tau: square root of τ². In the same units as your effect size (e.g., log odds ratio)" |
| I² | "What % of differences between studies is real (not just chance)? 0-25%=low, 25-50%=moderate, 50-75%=substantial, >75%=considerable" |
| H² | "H-squared: how many times larger is the observed variation than expected by chance? H²=1 means no extra variation" |
| Funnel Plot title | "Each dot is a study. Y-axis = precision (bigger studies at top). X-axis = effect size. Symmetric funnel = no bias. Asymmetric = possible missing studies." |
| Comparison-Adjusted Funnel title | "Like funnel plot but adjusted for different comparisons. Points are centered around comparison-specific means. Good for NMA where comparisons differ." |

### Heterogeneity Tab - Dynamic Stats (after Run)
| Stat | Tooltip |
|------|---------|
| τ² value | "Between-study variance - how much true effects vary across studies" |
| τ value | "Standard deviation of true effects - in same units as effect size" |
| I² value | "Percentage of variability due to true differences (not chance)" |
| H² value | "Ratio of total variability to sampling variability" |

### Consistency Tab
| Element | Tooltip |
|---------|---------|
| Node-Splitting title | "Compares direct evidence (studies that directly compared treatments) vs indirect evidence (calculated through the network). Big differences = inconsistency problem." |
| Direct Evidence title | "Shows how much of each comparison comes from direct studies vs indirect calculations through the network." |

### Bayesian Tab
| Element | Tooltip |
|---------|---------|
| Posterior Estimates title | "Effect estimates from Bayesian MCMC sampling - accounts for uncertainty in heterogeneity" |
| Mean column | "Average effect across all MCMC samples" |
| SD column | "Standard deviation of posterior distribution - measure of uncertainty" |
| 95% CrI column | "95% Credible Interval - there is 95% probability the true effect lies in this range" |
| Trace Plot title | "Shows MCMC chain history over iterations. Good mixing = chains overlap and look like fuzzy caterpillars. Poor mixing = chains stuck in different places" |
| Trace Plot canvas | "Each colored line is one MCMC chain. They should overlap and mix well" |
| Posterior Density title | "Shows the distribution of plausible values for between-study variance (τ²). The peak shows the most likely value" |
| Posterior Density canvas | "Histogram showing probability distribution of τ². Wider = more uncertainty about heterogeneity" |

### Bayesian Tab - Dynamic Stats (after Run)
| Stat | Tooltip |
|------|---------|
| R-hat | "Convergence diagnostic - should be <1.1. Values >1.1 suggest chains haven't converged" |
| Pareto k | "Leave-one-out diagnostic - k<0.5 is good, 0.5-0.7 okay, >0.7 problematic" |

### Publication Bias Tab - Dynamic Stats (after Run)
| Stat | Tooltip |
|------|---------|
| Egger's test | "Tests if small studies show different effects than large studies" |
| Begg's test | "Rank correlation test for funnel plot asymmetry" |
| Fail-safe N | "Number of null studies needed to make the effect non-significant" |

### Meta-Regression Tab
| Element | Tooltip |
|---------|---------|
| Continuous Meta-Regression title | "Tests if the treatment effect changes with a continuous variable (e.g., does effect increase with patient age?). Bubble plot shows the relationship." |
| Subgroup Analysis title | "Compares treatment effects between groups (e.g., low vs high risk of bias studies). Forest plot shows effect within each subgroup." |
| Bubble Plot header | "Shows relationship between covariate and effect size. Each bubble is a study - larger bubbles = more precise. Dashed line = regression fit" |
| Subgroup Effects header | "Effect estimates calculated separately for each category of the covariate" |
| N Studies column | "Number of studies in this category" |
| Pooled Effect column | "Combined effect estimate within this subgroup" |
| 95% CI column | "95% Confidence Interval for the pooled effect" |
| I² column | "Heterogeneity within this subgroup - how consistent are the studies?" |
| Subgroup Forest Plot header | "Visual comparison of effects across subgroups. Each row shows a subgroup's pooled effect with 95% CI. Dashed line = no effect" |

### Meta-Regression Tab - Dynamic Stats (after Run)
| Stat | Tooltip |
|------|---------|
| Slope | "Change in effect per unit increase in covariate" |
| R² | "Proportion of heterogeneity explained by the covariate" |
| p-value | "Statistical significance of the covariate effect" |

### CNMA Tab
| Element | Tooltip |
|---------|---------|
| Component NMA title | "For combination treatments (e.g., 'DrugA+DrugB'). Estimates the effect of each individual component. Use + as separator." |

### C-STREAM Tab
| Element | Tooltip |
|---------|---------|
| C-STREAM Transportability title | "Adjusts results for a different patient population. If your studies had young patients, what would results look like for elderly?" |

### C-STREAM Tab - Dynamic Stats (after Run)
| Stat | Tooltip |
|------|---------|
| Participation Bias | "Difference between study population and target population characteristics" |

### CINeMA Tab
| Element | Tooltip |
|---------|---------|
| CINeMA Assessment title | "CINeMA rates confidence in each comparison based on 6 domains: bias, indirectness, imprecision, heterogeneity, incoherence, publication bias." |
| High count | "High confidence: strong evidence, unlikely to change" |
| Moderate count | "Moderate confidence: likely close to true effect" |
| Low/Very Low count | "Low/Very Low: limited confidence, may change" |

### CINeMA Tab - Table Headers (after Run)
| Column | Tooltip |
|--------|---------|
| Comparison | "Treatment pair being assessed" |
| ROB | "Within-study bias: Are individual studies at risk of bias due to design flaws?" |
| Report | "Reporting bias: Are some studies/outcomes missing due to selective publication?" |
| Indirect | "Indirectness: Is evidence from populations, interventions, or outcomes that differ from target?" |
| Imprec | "Imprecision: Are confidence intervals wide? Would more data change conclusions?" |
| Het | "Heterogeneity: Do studies show very different results from each other?" |
| Incoh | "Incoherence: Do direct and indirect evidence disagree (inconsistency)?" |
| Overall | "Final confidence rating combining all 6 domains" |

### GRADE Tab
| Element | Tooltip |
|---------|---------|
| GRADE-NMA Assessment title | "GRADE rates evidence quality for each comparison. Considers risk of bias, inconsistency, indirectness, imprecision, and publication bias." |
| High count | "High quality: very confident the true effect is close to the estimate" |
| Moderate count | "Moderate: true effect is probably close to estimate, but could be different" |
| Low count | "Low: true effect might be substantially different from estimate" |
| Very Low count | "Very low: very uncertain - true effect is likely different from estimate" |

### GRADE Tab - Table Headers (after Run)
| Column | Tooltip |
|--------|---------|
| Comparison | "Treatment pair being assessed" |
| ROB | "Risk of Bias: Were studies well-designed and conducted?" |
| Inconsist | "Inconsistency: Do study results point in different directions?" |
| Indirect | "Indirectness: Does evidence directly address the question of interest?" |
| Imprec | "Imprecision: Is the estimate precise enough to guide decisions?" |
| PubBias | "Publication Bias: Are some studies missing due to selective publication?" |
| Grade | "Final evidence quality: High, Moderate, Low, or Very Low" |

### Sensitivity Tab
| Element | Tooltip |
|---------|---------|
| E-values title | "E-value: how strong would unmeasured confounding need to be to explain away the effect? Higher E-value = more robust finding." |
| E-value column | "Minimum confounder strength needed to explain away the effect" |
| E-value (CI) column | "E-value for the confidence interval bound - how robust is significance?" |
| Strength column | "Interpretation: how robust is this finding to unmeasured confounding?" |
| Threshold Analysis title | "Shows how much bias would be needed to change the conclusion. If threshold is high, result is robust to bias." |
| Threshold column | "Amount of bias needed to change the conclusion" |
| Robustness column | "How robust is this result to potential bias?" |
| CV-I² title | "Cross-validated I²: checks if heterogeneity estimate is reliable. If CV-I² is much lower than I², the model may be overfitting." |
| Conformal PI title | "Prediction intervals using conformal inference - a more robust method that doesn't assume normality." |
| Leave-One-Out title | "Remove each study one at a time and rerun analysis. If results change a lot, that study is highly influential." |

### Sensitivity Tab - Leave-One-Out Dynamic Stats (after Run)
| Stat | Tooltip |
|------|---------|
| Influential studies | "Studies whose removal changes the pooled effect by >10%" |

### Cumulative Tab
| Element | Tooltip |
|---------|---------|
| Cumulative/Living NMA title | "Shows how the pooled effect has changed as studies were added over time. Useful for 'living' reviews that update regularly." |

### Dose-Response Tab
| Element | Tooltip |
|---------|---------|
| Dose-Response NMA title | "Models how effect changes with dose. Emax model estimates the maximum effect and the dose needed for 50% of max effect (ED50)." |

---

## State Management

### AppState Object
```javascript
AppState = {
  studies: [],           // Array of study objects
  results: null,         // FrequentistNMA results
  reference: null,       // Reference treatment name
  effectMeasure: 'OR',   // OR, RR, HR, MD, SMD
  bayesianResults: null,
  cinemaResults: null,
  gradeResults: null,
  metaRegResult: null,
  metaRegCovariate: null,
  subgroupResults: null,
  cnmaResults: null,
  leaveOneOutResults: null,
  cumulativeResults: null,
  doseResponseResults: null,
  cstreamResults: null
}
```

---

## Export Capabilities
- **JSON**: Full data export/import
- **CSV**: Study data table
- **R Code**: netmeta package script
- **Python Code**: NetworkX script
- **Report**: HTML summary report
- **Plot Downloads**: PNG/SVG for all visualizations
- **Table Downloads**: CSV for all tables

---

## Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge

---

## Keyboard Shortcuts
- Tab navigation through interactive elements
- Enter/Space for button activation

---

## Version History

### v6.2 (Current)
- Theme switching with full plot refresh
- Comprehensive tooltip system
- CINeMA and GRADE frameworks
- Leave-one-out sensitivity analysis
- Cumulative/living NMA
- Dose-response modeling
- C-STREAM transportability
- Network geometry metrics
- Multiple small-study corrections (HKSJ, KR, SJ, mKH)
- Multiple Bayesian priors
- Enhanced accessibility

---

## Technical Notes

### Adding New Tooltips
Tooltips use native HTML `title` attributes. For dynamic content, add tooltips in the render function:
```javascript
html += `<th title="Your tooltip text here">Column Header</th>`;
```

### Theme-Aware Plots
All Plotly plots use `getThemeColors()`:
```javascript
const colors = getThemeColors();
Plotly.newPlot('plotId', data, {
  paper_bgcolor: colors.background,
  plot_bgcolor: colors.background,
  font: { color: colors.text }
});
```

### Canvas-Based Plots
Canvas plots need manual re-rendering in `refreshAllPlots()`:
```javascript
if (AppState.someResults) {
  renderSomePlot(AppState.someResults);
}
```

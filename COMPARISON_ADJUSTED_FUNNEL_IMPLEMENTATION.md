# Comparison-Adjusted Funnel Plot Implementation

## Overview
A Comparison-Adjusted Funnel Plot has been successfully added to the NMA Pro v6.2 application. This advanced visualization helps detect publication bias in network meta-analysis by centering each comparison at its pooled effect and plotting residuals.

## Location
The feature is implemented in the **Heterogeneity tab** (`panel-heterogeneity`) of the application at:
`C:\Users\user\OneDrive - NHS\Documents\NMAhtml\nma-pro-v6.2-optimized.html`

## Implementation Details

### 1. HTML Structure (Line 274)
A new card was added to the Heterogeneity panel containing:
- Canvas element ID: `compAdjFunnelCanvas`
- Dimensions: 800x400 pixels (canvas coordinates)
- Styling: Matches existing Canvas plots (Bayesian, LOO)

### 2. Core Function: `renderComparisonAdjustedFunnel(results)` (Lines 312-330)

#### Algorithm Steps:

**Step 1: Group studies by comparison**
```javascript
const comparisonMap = new Map();
processed.forEach(s => {
    const comp = [s.treatment1, s.treatment2].sort().join(' vs ');
    if(!comparisonMap.has(comp)) comparisonMap.set(comp, []);
    comparisonMap.get(comp).push(s);
});
```

**Step 2: Calculate comparison-specific pooled effects**
For each comparison, compute inverse-variance weighted mean:
```javascript
let sumW = 0, sumWY = 0;
studies.forEach(s => {
    const w = 1/(s.se * s.se);  // Weight = 1/variance
    sumW += w;
    sumWY += w * s.yi;
});
const pooled = sumWY/sumW;
```

**Step 3: Calculate residuals**
For each study:
```javascript
residual = observed_effect - comparison_specific_pooled_effect
```

**Step 4: Visual Elements**

1. **Axes**:
   - X-axis: Residual effect (centered at 0)
   - Y-axis: Standard error (inverted, small SE at top)

2. **Reference Lines**:
   - Vertical dashed line at residual = 0 (red)
   - Pseudo 95% confidence funnel lines (gray, semi-transparent)
     - Calculated using critical z-value (1.96)
     - Formula: residual = ±1.96 × SE

3. **Data Points**:
   - Color-coded by treatment comparison
   - Size: 5px radius circles
   - White border for visibility

4. **Asymmetry Detection**:
   - Regression line (orange dashed)
   - Uses Egger's regression approach: regresses residuals on precision (1/SE)
   - Slope indicates degree of asymmetry

5. **Legend**:
   - Right panel showing comparison colors
   - Truncates long comparison names to 18 characters

### 3. Color Palette
Eight distinct colors for comparisons:
```javascript
const compColors = [
    '#06b6d4',  // Cyan
    '#8b5cf6',  // Purple
    '#10b981',  // Green
    '#f59e0b',  // Amber
    '#ec4899',  // Pink
    '#ef4444',  // Red
    '#3b82f6',  // Blue
    '#f97316'   // Orange
];
```

### 4. Integration
The function is automatically called after the standard funnel plot:
```javascript
function renderFunnelPlot(results) {
    // ... existing Plotly funnel plot code ...
    setTimeout(() => renderComparisonAdjustedFunnel(results), 10);
}
```

## Technical Features

### Canvas-based Rendering
- Uses HTML5 Canvas API (not Plotly)
- Follows the same pattern as Bayesian trace plots and LOO influence plots
- Theme-aware: Uses `getThemeColors()` for light/dark mode support

### Responsive Design
- Padding: {left: 60px, right: 200px, top: 40px, bottom: 50px}
- Legend positioned in right margin
- Axes scaled dynamically based on data range

### Mathematical Robustness
- Handles single-study comparisons (uses study effect as pooled effect)
- Requires ≥3 studies for regression line
- Prevents division by zero in SE calculations
- Auto-scales funnel boundaries

## Interpretation Guide

### What to Look For:

1. **Symmetry**: Points should be distributed symmetrically around the vertical zero line
2. **Funnel Shape**: Points should fall within the pseudo-confidence funnel
3. **Regression Line**:
   - Near-horizontal = no asymmetry
   - Sloped = potential small-study effects/publication bias
4. **Color Clustering**: Check if asymmetry is driven by specific comparisons

### Advantages over Standard Funnel Plot:
- Accounts for multi-arm trials properly
- Removes between-comparison heterogeneity
- More powerful for detecting within-comparison bias
- Allows visual inspection of comparison-specific patterns

## Testing

To test the implementation:
1. Open `nma-pro-v6.2-optimized.html` in a web browser
2. Load the demo dataset (or import custom data)
3. Click "Run Analysis"
4. Navigate to the "Heterogeneity" tab
5. Scroll down to view the Comparison-Adjusted Funnel Plot

## File Changes Summary
- **Lines 274**: Added canvas element in HTML
- **Lines 309-310**: Modified `renderFunnelPlot()` to trigger comparison-adjusted plot
- **Lines 312-330**: New function `renderComparisonAdjustedFunnel()`

## References
This implementation follows methodology from:
- Chaimani A, Salanti G. Using network meta-analysis to evaluate the existence of small-study effects in a network of interventions. Res Synth Methods. 2012;3(2):161-176.
- Salanti G, Ades AE, Ioannidis JP. Graphical methods and numerical summaries for presenting results from multiple-treatment meta-analysis: an overview and tutorial. J Clin Epidemiol. 2011;64(2):163-171.

## Future Enhancements (Optional)
- Add contour-enhanced funnel plot option
- Include trim-and-fill adjustment for comparisons
- Add statistical test for asymmetry (Egger's test p-value)
- Export residuals data as CSV
- Interactive tooltips showing study names on hover

---
**Implementation Date**: December 10, 2025
**NMA Pro Version**: v6.2
**Canvas ID**: compAdjFunnelCanvas

# Comparison-Adjusted Funnel Plot - Visual Guide

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HETEROGENEITY TAB                                        │
├─────────────────────────────────────┬───────────────────────────────────────┤
│  📉 Heterogeneity Statistics        │   🎯 Funnel Plot                     │
│  ┌──────────────────────────────┐   │   ┌──────────────────────────────┐  │
│  │ τ²      τ      I²      H²    │   │   │                              │  │
│  │ 0.05   0.22   65%     2.86   │   │   │      Standard Plotly         │  │
│  │                              │   │   │      Funnel Plot             │  │
│  │ Interpretation: Moderate-    │   │   │                              │  │
│  │ high heterogeneity           │   │   │                              │  │
│  └──────────────────────────────┘   │   └──────────────────────────────┘  │
├─────────────────────────────────────┴───────────────────────────────────────┤
│  📊 Comparison-Adjusted Funnel Plot                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  SE ↑                                                    LEGEND     │  │
│  │   │                                                      ━ A vs B   │  │
│  │   │    ╱         ●  ●         ╲                         ━ A vs C   │  │
│  │   │   ╱         ●    ●         ╲                        ━ B vs C   │  │
│  │   │  ╱        ●  │●  ●  ●       ╲                       ━ B vs D   │  │
│  │   │ ╱      ●  ●  │ ●  ●  ●  ●    ╲                     ━ C vs D   │  │
│  │   │╱    ●  ●  ● ━┼━● ● ● ●  ●  ●  ╲                                │  │
│  │   ──────────────────0──────────────────→ Residual                   │  │
│  │                     │    ╲                                          │  │
│  │                     │      regression line (asymmetry)              │  │
│  │                     │                                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## How It Works - Step by Step

### Step 1: Data Preparation
```
Original Data (from NMA):
Study        Comparison   Effect (yi)   SE
─────────────────────────────────────────
Study1       A vs B        0.45        0.12
Study2       A vs B        0.52        0.15
Study3       A vs C        0.30        0.18
Study4       B vs C       -0.15        0.10
Study5       B vs C       -0.20        0.12
```

### Step 2: Calculate Comparison-Specific Pooled Effects
```
For each unique comparison, calculate weighted mean:

A vs B:  pooled = (0.45/0.12² + 0.52/0.15²) / (1/0.12² + 1/0.15²)
         pooled = 0.47

A vs C:  pooled = 0.30  (single study)

B vs C:  pooled = (−0.15/0.10² + −0.20/0.12²) / (1/0.10² + 1/0.12²)
         pooled = −0.17
```

### Step 3: Calculate Residuals
```
Residual = Observed Effect − Pooled Effect

Study        Comparison   Observed   Pooled   Residual    SE
─────────────────────────────────────────────────────────────
Study1       A vs B        0.45      0.47     −0.02      0.12
Study2       A vs B        0.52      0.47      0.05      0.15
Study3       A vs C        0.30      0.30      0.00      0.18
Study4       B vs C       −0.15     −0.17      0.02      0.10
Study5       B vs C       −0.20     −0.17     −0.03      0.12
```

### Step 4: Plot on Canvas
```
X-axis: Residual (centered at 0)
Y-axis: Standard Error (inverted)

Each point colored by its comparison:
● Blue    = A vs B
● Purple  = A vs C
● Green   = B vs C
● etc.
```

## Key Visual Elements

### 1. Pseudo-Confidence Funnel
```
Funnel boundaries at ±1.96 × SE:

For SE = 0.1:  ±0.196
For SE = 0.2:  ±0.392
For SE = 0.3:  ±0.588

Creates a triangular funnel shape expanding downward
```

### 2. Regression Line (Egger's Test)
```
Linear regression: Residual ~ 1/SE

If slope ≠ 0:  Small-study effects present
               (potential publication bias)

Visualized as orange dashed line
```

### 3. Color Legend
```
Right panel shows:
■ A vs B
■ A vs C
■ B vs C
■ B vs D
...

Helps identify which comparisons drive asymmetry
```

## Canvas Coordinates

```
Canvas dimensions: 800 × 400 pixels

Padding: {
  left:   60px  (for Y-axis labels)
  right: 200px  (for legend)
  top:    40px  (for title space)
  bottom: 50px  (for X-axis labels)
}

Plot area: 540 × 310 pixels
```

## Mathematical Details

### Inverse-Variance Weighting
```javascript
For comparison j with k studies:

        Σ (effect_i / SE_i²)
pooled = ─────────────────────
           Σ (1 / SE_i²)

Where i indexes studies within comparison j
```

### Regression for Asymmetry
```javascript
Model: residual_i = β₀ + β₁ × (1/SE_i) + ε_i

Interpretation:
β₁ = 0:  No asymmetry
β₁ > 0:  Small studies show larger effects
β₁ < 0:  Small studies show smaller effects
```

### Funnel Boundaries
```javascript
Upper boundary: residual = +1.96 × SE
Lower boundary: residual = −1.96 × SE

Creates pseudo 95% confidence region
Assumes normal distribution of residuals
```

## Interpretation Examples

### Example 1: Symmetric Plot (No Bias)
```
   SE
    ↑
    │    ╱   ● ●   ╲
    │   ╱  ●  │  ●  ╲
    │  ╱ ●  ● │ ●  ● ╲
    │ ╱● ●  ● │ ● ●  ●╲
    └─────────0─────────→ Residual

✓ Points symmetric around zero
✓ Regression line near-horizontal
✓ Most points within funnel
✓ Interpretation: No evidence of bias
```

### Example 2: Asymmetric Plot (Bias Present)
```
   SE
    ↑
    │    ╱     ●   ╲
    │   ╱    ●  ●   ╲
    │  ╱  ● ●│●      ╲
    │ ╱ ●●● ●│     ╱  ╲
    └─────────0─────────→ Residual
              ↑
         Regression line slopes →

⚠ Points clustered to left of zero
⚠ Regression line has positive slope
⚠ Small studies missing on right
⚠ Interpretation: Possible publication bias
```

### Example 3: Comparison-Specific Asymmetry
```
   SE
    ↑
    │    ╱ ●(blue) ●(green) ╲
    │   ╱●(blue) │ ●(green)  ╲
    │  ╱●(blue)  │ ●(green)   ╲
    │ ╱●(blue)   │  ●(green)   ╲
    └────────────0──────────────→ Residual

⚠ Blue points (A vs B) asymmetric
✓ Green points (B vs C) symmetric
⚠ Interpretation: Bias specific to A vs B comparison
```

## Technical Implementation Notes

### Canvas Drawing Order
1. Clear canvas and fill background
2. Draw grid lines (horizontal and vertical)
3. Draw vertical line at zero (red dashed)
4. Draw pseudo-confidence funnel (gray triangular lines)
5. Draw regression line (orange dashed)
6. Draw data points (colored circles with white border)
7. Draw axis labels and tick marks
8. Draw legend with comparison colors

### Color Palette (8 colors, cycling)
- #06b6d4 (Cyan)
- #8b5cf6 (Purple)
- #10b981 (Green)
- #f59e0b (Amber)
- #ec4899 (Pink)
- #ef4444 (Red)
- #3b82f6 (Blue)
- #f97316 (Orange)

### Theme Integration
Uses `getThemeColors()` function for:
- `colors.background` - Canvas background
- `colors.text` - Axis labels
- `colors.textSecondary` - Tick labels
- `colors.grid` - Grid lines
- `colors.danger` - Zero line
- `colors.warning` - Regression line

Supports both light and dark modes automatically.

---
**Last Updated**: December 10, 2025

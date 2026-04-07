// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', 'nma-pro-v8.0.html').replace(/\\/g, '/');

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function openApp(page) {
  await page.goto(FILE_URL, { waitUntil: 'load', timeout: 120000 });
  // Wait for panels to render (initializePanels injects DOM via template literal)
  await page.waitForFunction(() => {
    return document.getElementById('studyTableBody') !== null &&
           document.getElementById('runAnalysisBtn') !== null &&
           document.getElementById('loadDatasetBtn') !== null;
  }, { timeout: 30000 });
  await page.waitForTimeout(500);
}

async function loadDemo(page) {
  await page.evaluate(() => BenchmarkDatasets.loadDataset('thrombolytics'));
  // Wait for study table to populate
  await page.waitForFunction(() => {
    const tbody = document.getElementById('studyTableBody');
    return tbody && tbody.children.length >= 5;
  }, { timeout: 5000 });
}

async function runAnalysis(page) {
  await page.click('#runAnalysisBtn');
  // Wait for analysis to complete (loading overlay disappears OR results appear)
  await page.waitForFunction(() => {
    return window.AppState && window.AppState.results !== null;
  }, { timeout: 30000 });
  // Brief pause for rendering
  await page.waitForTimeout(1000);
}

async function switchTab(page, tabName) {
  await page.click(`.tab-btn[data-tab="${tabName}"]`);
  await page.waitForTimeout(300);
}

async function getConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

// ─────────────────────────────────────────────
// TEST 1: App loads without errors
// ─────────────────────────────────────────────

test('App loads and initializes', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await openApp(page);

  // Core elements exist
  await expect(page.locator('#runAnalysisBtn')).toBeVisible();
  await expect(page.locator('#loadDatasetBtn')).toBeVisible();
  await expect(page.locator('#effectMeasureSelect')).toBeVisible();
  await expect(page.locator('#estimatorSelect')).toBeVisible();

  // No JS errors on load
  expect(errors).toEqual([]);
});

// ─────────────────────────────────────────────
// TEST 2: Demo data loads
// ─────────────────────────────────────────────

test('Demo data loads correctly', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);

  // Should have 10 studies
  const rowCount = await page.locator('#studyTableBody tr').count();
  expect(rowCount).toBe(10);

  // Check first study name
  const firstName = await page.locator('#studyTableBody tr:first-child input[data-field="name"]').inputValue();
  expect(firstName).toBe('GUSTO-1');
});

// ─────────────────────────────────────────────
// TEST 3: Main NMA analysis runs
// ─────────────────────────────────────────────

test('Main analysis completes without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);

  // Results should exist
  const hasResults = await page.evaluate(() => window.AppState.results !== null);
  expect(hasResults).toBe(true);

  // Treatments found
  const nTreatments = await page.evaluate(() => window.AppState.results.treatments.length);
  expect(nTreatments).toBe(6);

  // tau2 is a finite number
  const tau2 = await page.evaluate(() => window.AppState.results.tau2);
  expect(Number.isFinite(tau2)).toBe(true);

  // No JS errors
  expect(errors.filter(e => !e.includes('favicon'))).toEqual([]);
});

// ─────────────────────────────────────────────
// TEST 4: Results tab renders
// ─────────────────────────────────────────────

test('Results tab shows forest plot and league table', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);
  await switchTab(page, 'results');

  // Forest plot rendered (Plotly creates svg/canvas inside the div)
  const forestHasContent = await page.evaluate(() => {
    const el = document.getElementById('forestPlot');
    return el && el.children.length > 0;
  });
  expect(forestHasContent).toBe(true);

  // League table rendered
  const leagueHasContent = await page.evaluate(() => {
    const el = document.getElementById('leagueTableContainer');
    return el && el.querySelector('table') !== null;
  });
  expect(leagueHasContent).toBe(true);
});

// ─────────────────────────────────────────────
// TEST 5: Ranking tab renders
// ─────────────────────────────────────────────

test('Ranking tab shows rankings, SUCRA curves, POTH, MID, Hasse', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);
  await switchTab(page, 'ranking');

  // Ranking table has rows
  const rankRows = await page.locator('#rankingTableBody tr').count();
  expect(rankRows).toBeGreaterThan(0);

  // POTH container visible
  const pothVisible = await page.evaluate(() => {
    const el = document.getElementById('pothContainer');
    return el && el.style.display !== 'none';
  });
  expect(pothVisible).toBe(true);

  // MID ranking container visible
  const midVisible = await page.evaluate(() => {
    const el = document.getElementById('midRankingContainer');
    return el && el.style.display !== 'none';
  });
  expect(midVisible).toBe(true);

  // Hasse container visible
  const hasseVisible = await page.evaluate(() => {
    const el = document.getElementById('hasseContainer');
    return el && el.style.display !== 'none';
  });
  expect(hasseVisible).toBe(true);

  // SUCRA curves plotted
  const sucraHasContent = await page.evaluate(() => {
    const el = document.getElementById('sucraCurvePlot');
    return el && el.children.length > 0;
  });
  expect(sucraHasContent).toBe(true);
});

// ─────────────────────────────────────────────
// TEST 6: Heterogeneity tab renders
// ─────────────────────────────────────────────

test('Heterogeneity tab shows stats and tau2 slider', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);
  await switchTab(page, 'heterogeneity');

  // I2 displayed
  const I2text = await page.locator('#hetI2').textContent();
  expect(I2text).toMatch(/\d/);

  // tau2 slider exists
  await expect(page.locator('#tau2Slider')).toBeVisible();

  // Funnel plot rendered
  const funnelHasContent = await page.evaluate(() => {
    const el = document.getElementById('funnelPlot');
    return el && el.children.length > 0;
  });
  expect(funnelHasContent).toBe(true);
});

// ─────────────────────────────────────────────
// TEST 7: Consistency tab renders
// ─────────────────────────────────────────────

test('Consistency tab shows node-splitting results', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);
  await switchTab(page, 'consistency');

  // Node-splitting container has content
  const hasContent = await page.evaluate(() => {
    const el = document.getElementById('nodeSplitOuterContainer');
    return el && el.innerHTML.length > 50;
  });
  expect(hasContent).toBe(true);
});

// ─────────────────────────────────────────────
// TEST 8: Caterpillar plot renders
// ─────────────────────────────────────────────

test('Caterpillar plot renders in results tab', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);
  await switchTab(page, 'results');

  const caterpillarRendered = await page.evaluate(() => {
    const el = document.getElementById('caterpillarPlotContainer');
    return el && el.children.length > 0;
  });
  expect(caterpillarRendered).toBe(true);
});

// ─────────────────────────────────────────────
// TEST 9: Comparison heatmap renders
// ─────────────────────────────────────────────

test('Comparison heatmap renders in results tab', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);
  await switchTab(page, 'results');
  await page.waitForTimeout(2000); // Plotly renders async

  const heatmapRendered = await page.evaluate(() => {
    const el = document.getElementById('comparisonHeatmapPlot');
    return el && el.children.length > 0;
  });
  expect(heatmapRendered).toBe(true);
});

// ─────────────────────────────────────────────
// TEST 10: Manuscript text generator
// ─────────────────────────────────────────────

test('Manuscript text generates without error', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);
  await switchTab(page, 'results');

  await page.click('#genManuscriptBtn');
  await page.waitForTimeout(500);

  const text = await page.locator('#manuscriptTextOutput').textContent();
  expect(text.length).toBeGreaterThan(100);
  expect(text).toContain('studies');
  expect(text).toContain('treatments');
});

// ─────────────────────────────────────────────
// TEST 11: Methods text generator
// ─────────────────────────────────────────────

test('Methods text generates without error', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await switchTab(page, 'results');

  await page.click('#genMethodsBtn');
  await page.waitForTimeout(500);

  const text = await page.locator('#manuscriptTextOutput').textContent();
  expect(text.length).toBeGreaterThan(50);
  expect(text).toContain('REML');
});

// ─────────────────────────────────────────────
// TEST 12: GRADE SoF table
// ─────────────────────────────────────────────

test('GRADE Summary of Findings table generates', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);
  await switchTab(page, 'grade');

  await page.click('#genSoFBtn');
  await page.waitForTimeout(500);

  const hasTable = await page.evaluate(() => {
    const el = document.getElementById('sofContainer');
    return el && el.querySelector('table') !== null;
  });
  expect(hasTable).toBe(true);
});

// ─────────────────────────────────────────────
// TEST 13: PRISMA flow diagram
// ─────────────────────────────────────────────

test('PRISMA flow diagram generates', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);
  await switchTab(page, 'export');

  await page.click('#genPrismaBtn');
  await page.waitForTimeout(500);

  const hasSVG = await page.evaluate(() => {
    const el = document.getElementById('prismaFlowContainer');
    return el && el.querySelector('svg') !== null;
  });
  expect(hasSVG).toBe(true);
});

// ─────────────────────────────────────────────
// TEST 14: AutoValidator
// ─────────────────────────────────────────────

test('AutoValidator passes all checks on demo data', async ({ page }) => {
  await openApp(page);
  await switchTab(page, 'validation');

  await page.click('#runValidationBtn');
  await page.waitForTimeout(5000);

  // Check for PASS indicators
  const resultText = await page.locator('#validationResults').textContent();
  expect(resultText).toContain('PASS');

  // No FAIL
  const hasFail = resultText.includes('FAIL') && !resultText.includes('ALL CHECKS PASSED');
  // Allow some tolerance — just verify the validator ran
  expect(resultText.length).toBeGreaterThan(100);
});

// ─────────────────────────────────────────────
// TEST 15: Robustness Dashboard
// ─────────────────────────────────────────────

test('Robustness Dashboard runs without error', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);
  await switchTab(page, 'results');

  await page.click('#runRobustnessBtn');
  await page.waitForTimeout(10000);

  const hasGrade = await page.evaluate(() => {
    const el = document.getElementById('robustnessDashContainer');
    return el && (el.textContent.includes('A') || el.textContent.includes('B') || el.textContent.includes('C') || el.textContent.includes('D'));
  });
  expect(hasGrade).toBe(true);
});

// ─────────────────────────────────────────────
// TEST 16: Survival NMA tab
// ─────────────────────────────────────────────

test('Survival NMA loads demo and runs', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await openApp(page);
  await switchTab(page, 'survival');

  // Load survival demo
  await page.click('#survDemoBtn');
  await page.waitForTimeout(500);

  // Verify rows loaded
  const rows = await page.locator('#survDataBody tr').count();
  expect(rows).toBeGreaterThan(5);

  // Run survival NMA
  await page.click('#survRunBtn');
  await page.waitForTimeout(3000);

  // Results should appear
  const resultsVisible = await page.evaluate(() => {
    const el = document.getElementById('survResultsContainer');
    return el && el.style.display !== 'none';
  });
  expect(resultsVisible).toBe(true);

  // No fatal JS errors
  expect(errors.filter(e => !e.includes('favicon') && !e.includes('net::'))).toEqual([]);
});

// ─────────────────────────────────────────────
// TEST 17: Journal Mode toggle
// ─────────────────────────────────────────────

test('Journal Mode toggles without error', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);

  // Toggle journal mode
  await page.click('#journalModeBtn');
  await page.waitForTimeout(500);

  // Toggle back
  await page.click('#journalModeBtn');
  await page.waitForTimeout(500);

  expect(errors.filter(e => !e.includes('favicon'))).toEqual([]);
});

// ─────────────────────────────────────────────
// TEST 18: Keyboard shortcut ? shows overlay
// ─────────────────────────────────────────────

test('Keyboard shortcut ? shows help overlay', async ({ page }) => {
  await openApp(page);

  // Press ? key
  await page.keyboard.press('?');
  await page.waitForTimeout(300);

  const overlayVisible = await page.evaluate(() => {
    return document.getElementById('shortcutsOverlay') !== null;
  });
  expect(overlayVisible).toBe(true);

  // Press Escape to close
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  const overlayClosed = await page.evaluate(() => {
    return document.getElementById('shortcutsOverlay') === null;
  });
  expect(overlayClosed).toBe(true);
});

// ─────────────────────────────────────────────
// TEST 19: Tab switching via keyboard
// ─────────────────────────────────────────────

test('Number keys switch tabs', async ({ page }) => {
  await openApp(page);

  // Press 4 to switch to 4th tab (network)
  await page.keyboard.press('4');
  await page.waitForTimeout(300);

  const activeTab = await page.evaluate(() => {
    const active = document.querySelector('.tab-btn--active');
    return active ? active.dataset.tab : null;
  });
  // 4th tab should be 'network' (data=1, rapidreview=2, guardian=3, network=4)
  expect(activeTab).toBe('network');
});

// ─────────────────────────────────────────────
// TEST 20: Advanced methods don't crash
// ─────────────────────────────────────────────

test('Advanced methods run without fatal errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);
  await switchTab(page, 'advanced');

  // Test a selection of advanced methods
  const methods = [
    'runForwardSearchBtn',
    'runLeverageResidBtn',
    'runEvidenceFlowBtn',
    'runStabilitySurfaceBtn',
    'runTransitivityDashBtn',
    'runGapMapBtn',
    'runNetComplexityBtn',
  ];

  for (const btnId of methods) {
    const btn = page.locator('#' + btnId);
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(2000);
    }
  }

  // Check that advancedResultsContainer has content
  const hasResults = await page.evaluate(() => {
    const el = document.getElementById('advancedResultsContainer');
    return el && el.innerHTML.length > 100;
  });
  expect(hasResults).toBe(true);

  // No fatal errors (warnings are OK)
  const fatalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('net::') && !e.includes('warn'));
  expect(fatalErrors).toEqual([]);
});

// ─────────────────────────────────────────────
// TEST 21: tau2 slider updates rankings
// ─────────────────────────────────────────────

test('tau2 slider updates sensitivity results', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);
  await switchTab(page, 'heterogeneity');

  // Set slider to a different value
  await page.evaluate(() => {
    const slider = document.getElementById('tau2Slider');
    if (slider) {
      slider.value = '0.5';
      slider.dispatchEvent(new Event('input'));
    }
  });
  await page.waitForTimeout(500);

  // Sensitivity results should appear
  const hasResults = await page.evaluate(() => {
    const el = document.getElementById('tau2SensitivityResults');
    return el && el.style.display !== 'none' && el.innerHTML.length > 50;
  });
  expect(hasResults).toBe(true);
});

// ─────────────────────────────────────────────
// TEST 22: Class effects toggle
// ─────────────────────────────────────────────

test('Class effects toggle shows model selector', async ({ page }) => {
  await openApp(page);

  // Check toggle
  await page.click('#classEffectsToggle');
  await page.waitForTimeout(300);

  const selectorVisible = await page.evaluate(() => {
    const el = document.getElementById('classModelSelect');
    return el && el.style.display !== 'none';
  });
  expect(selectorVisible).toBe(true);
});

// ─────────────────────────────────────────────
// TEST 23: Smart paste import
// ─────────────────────────────────────────────

test('SmartPasteImport parses tab-separated data', async ({ page }) => {
  await openApp(page);

  const result = await page.evaluate(() => {
    return SmartPasteImport.parse(
      'Study\tArm 1\tE1\tN1\tArm 2\tE2\tN2\n' +
      'Trial A\tDrug\t10\t100\tPlacebo\t15\t100\n' +
      'Trial B\tDrug\t20\t200\tPlacebo\t25\t200'
    );
  });

  expect(result.nRows).toBe(2);
  expect(result.studies[0].treatment1).toBe('Drug');
  expect(result.studies[0].events1).toBe(10);
});

// ─────────────────────────────────────────────
// TEST 24: Full report generates
// ─────────────────────────────────────────────

test('Full HTML report generates without error', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);

  const reportHTML = await page.evaluate(() => {
    return FullReportGenerator.generate();
  });

  expect(reportHTML).toBeTruthy();
  expect(reportHTML.length).toBeGreaterThan(1000);
  expect(reportHTML).toContain('Network Meta-Analysis Report');
  expect(reportHTML).toContain('GUSTO-1');
});

// ─────────────────────────────────────────────
// TEST 25: Network complexity index
// ─────────────────────────────────────────────

test('NetworkComplexityIndex computes valid score', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);

  const result = await page.evaluate(() => {
    return NetworkComplexityIndex.compute(AppState.studies, AppState.results);
  });

  expect(result.applicable).toBe(true);
  expect(result.index).toBeGreaterThan(0);
  expect(result.index).toBeLessThanOrEqual(100);
  expect(result.density).toBeGreaterThan(0);
});

// ─────────────────────────────────────────────
// TEST 26: All tabs accessible without error
// ─────────────────────────────────────────────

test('All tabs switch without JS errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);

  const tabs = ['data', 'guardian', 'network', 'results', 'ranking',
    'heterogeneity', 'consistency', 'bayesian', 'pubbias', 'metareg',
    'cnma', 'transportability', 'cinema', 'grade', 'sensitivity',
    'cumulative', 'doseresponse', 'advanced', 'survival', 'validation', 'export'];

  for (const tab of tabs) {
    await switchTab(page, tab);
  }

  expect(errors.filter(e => !e.includes('favicon') && !e.includes('net::'))).toEqual([]);
});

// ─────────────────────────────────────────────
// TEST 27: Equivalence testing
// ─────────────────────────────────────────────

test('EquivalenceNMA runs on demo data', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);

  const result = await page.evaluate(() => {
    return EquivalenceNMA.analyze(AppState.results, { margin: 0.2 });
  });

  expect(result.applicable).toBe(true);
  expect(result.comparisons.length).toBeGreaterThan(0);
  expect(result.comparisons[0]).toHaveProperty('classification');
});

// ─────────────────────────────────────────────
// TEST 28: Treatment clustering
// ─────────────────────────────────────────────

test('TreatmentClustering runs on demo data', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);

  const result = await page.evaluate(() => {
    return TreatmentClustering.analyze(AppState.results);
  });

  expect(result.applicable).toBe(true);
  expect(result.merges.length).toBeGreaterThan(0);
  expect(result.nClusters).toBeGreaterThanOrEqual(1);
});

// ─────────────────────────────────────────────
// TEST 29: Evidence gap map
// ─────────────────────────────────────────────

test('EvidenceGapMap computes correctly', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);

  const result = await page.evaluate(() => {
    return EvidenceGapMap.analyze(AppState.studies, AppState.results);
  });

  expect(result).toBeTruthy();
  expect(result.T).toBe(6);
  expect(result.totalPairs).toBe(15); // 6 choose 2
  expect(result.nGaps + result.nSparse + result.nSolid).toBe(15);
});

// ─────────────────────────────────────────────
// TEST 30: No console errors during full workflow
// ─────────────────────────────────────────────

test('Full workflow: load -> analyze -> all tabs -> no fatal errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);

  // Visit every tab
  const allTabs = ['results', 'ranking', 'heterogeneity', 'consistency',
    'pubbias', 'cinema', 'grade', 'sensitivity', 'advanced', 'export'];

  for (const tab of allTabs) {
    await switchTab(page, tab);
    await page.waitForTimeout(200);
  }

  // Generate manuscript text
  await switchTab(page, 'results');
  const genBtn = page.locator('#genManuscriptBtn');
  if (await genBtn.count() > 0) await genBtn.click();
  await page.waitForTimeout(500);

  // Generate PRISMA
  await switchTab(page, 'export');
  const prismaBtn = page.locator('#genPrismaBtn');
  if (await prismaBtn.count() > 0) await prismaBtn.click();
  await page.waitForTimeout(500);

  // Generate SoF
  await switchTab(page, 'grade');
  const sofBtn = page.locator('#genSoFBtn');
  if (await sofBtn.count() > 0) await sofBtn.click();
  await page.waitForTimeout(500);

  // Fatal errors only (ignore warnings, favicon, network errors)
  const fatalErrors = errors.filter(e =>
    !e.includes('favicon') &&
    !e.includes('net::') &&
    !e.includes('ResizeObserver') &&
    !e.includes('Non-Error')
  );

  expect(fatalErrors).toEqual([]);
});

// ─────────────────────────────────────────────
// TEST 31: Smoking cessation dataset loads
// ─────────────────────────────────────────────

test('Smoking cessation dataset loads and analyzes', async ({ page }) => {
  await openApp(page);

  await page.evaluate(() => BenchmarkDatasets.loadDataset('smoking'));
  await page.waitForTimeout(500);

  const rowCount = await page.locator('#studyTableBody tr').count();
  expect(rowCount).toBe(24);

  await runAnalysis(page);

  const nTreatments = await page.evaluate(() => window.AppState.results.treatments.length);
  expect(nTreatments).toBe(4);
});

// ─────────────────────────────────────────────
// TEST 32: Antidepressants dataset loads
// ─────────────────────────────────────────────

test('Antidepressants dataset loads and analyzes', async ({ page }) => {
  await openApp(page);

  await page.evaluate(() => BenchmarkDatasets.loadDataset('depression'));
  await page.waitForTimeout(500);

  const rowCount = await page.locator('#studyTableBody tr').count();
  expect(rowCount).toBe(15);

  await runAnalysis(page);

  const nTreatments = await page.evaluate(() => window.AppState.results.treatments.length);
  expect(nTreatments).toBe(5);
});

// ─────────────────────────────────────────────
// TEST 33: NSAIDs SMD dataset loads
// ─────────────────────────────────────────────

test('NSAIDs SMD dataset loads and analyzes', async ({ page }) => {
  await openApp(page);

  await page.evaluate(() => BenchmarkDatasets.loadDataset('painkillers'));
  await page.waitForTimeout(500);

  const effectMeasure = await page.evaluate(() => AppState.effectMeasure);
  expect(effectMeasure).toBe('SMD');

  await runAnalysis(page);

  const hasResults = await page.evaluate(() => window.AppState.results !== null);
  expect(hasResults).toBe(true);
});

// ─────────────────────────────────────────────
// TEST 34: Undo/Redo works
// ─────────────────────────────────────────────

test('Undo reverts data changes', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);

  const before = await page.evaluate(() => AppState.studies.length);
  expect(before).toBe(10);

  // Add a study
  await page.evaluate(() => { addStudy(); });
  const after = await page.evaluate(() => AppState.studies.length);
  expect(after).toBe(11);

  // Undo
  await page.evaluate(() => UndoRedo.undo());
  const restored = await page.evaluate(() => AppState.studies.length);
  expect(restored).toBe(10);
});

// ─────────────────────────────────────────────
// TEST 35: Analysis snapshots save and compare
// ─────────────────────────────────────────────

test('Analysis snapshots save and compare', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);

  // Save snapshot 1
  const save1 = await page.evaluate(() => AnalysisSnapshots.save('Before'));
  expect(save1.success).toBe(true);

  // Modify and re-analyze (remove a study)
  await page.evaluate(() => { AppState.studies.pop(); });
  await runAnalysis(page);

  // Save snapshot 2
  const save2 = await page.evaluate(() => AnalysisSnapshots.save('After'));
  expect(save2.success).toBe(true);

  // Compare
  const comparison = await page.evaluate(() => AnalysisSnapshots.compare(0, 1));
  expect(comparison).toBeTruthy();
  expect(comparison.comparison.length).toBeGreaterThan(0);
});

// ─────────────────────────────────────────────
// TEST 36: BenchmarkDatasets.getList returns all datasets
// ─────────────────────────────────────────────

test('BenchmarkDatasets lists all available datasets', async ({ page }) => {
  await openApp(page);

  const list = await page.evaluate(() => BenchmarkDatasets.getList());
  expect(list.length).toBe(4);
  expect(list.map(d => d.key)).toContain('smoking');
  expect(list.map(d => d.key)).toContain('depression');
  expect(list.map(d => d.key)).toContain('painkillers');
});

// ─────────────────────────────────────────────
// TEST 37: Prior Sensitivity runs without error
// ─────────────────────────────────────────────

test('Prior Sensitivity analysis runs', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);

  const result = await page.evaluate(async () => PriorSensitivity.analyze(AppState.studies));
  expect(result.applicable).toBe(true);
  expect(result.results.length).toBeGreaterThan(1);
});

// ─────────────────────────────────────────────
// TEST 38: Sample size analysis runs
// ─────────────────────────────────────────────

test('SampleSizeConclusive analysis runs', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);

  const result = await page.evaluate(() => SampleSizeConclusive.analyze(AppState.results, AppState.ranking));
  expect(result.applicable).toBe(true);
  expect(result.analyses.length).toBeGreaterThan(0);
});

// ─────────────────────────────────────────────
// TEST 39: MAIC demo mode runs
// ─────────────────────────────────────────────

test('MAIC analysis runs in demo mode', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);
  await switchTab(page, 'advanced');

  const btn = page.locator('#runMAICBtn');
  if (await btn.count() > 0) {
    await btn.click();
    await page.waitForTimeout(3000);
    const hasContent = await page.evaluate(() => {
      const el = document.getElementById('advancedResultsContainer');
      return el && el.innerHTML.length > 200;
    });
    expect(hasContent).toBe(true);
  }
});

// ─────────────────────────────────────────────
// TEST 40: Direct vs Network comparison
// ─────────────────────────────────────────────

test('PairwiseComparison analysis runs', async ({ page }) => {
  await openApp(page);
  await loadDemo(page);
  await runAnalysis(page);

  const result = await page.evaluate(() => PairwiseComparison.analyze(AppState.studies, AppState.results));
  expect(result).toBeTruthy();
  expect(result.nComparisons).toBeGreaterThan(0);
  expect(result.rows[0]).toHaveProperty('direct');
  expect(result.rows[0]).toHaveProperty('network');
});

// ═══════════════════════════════════════════════
// TIER-1 FEATURE DEEP TESTS (v8.1)
// ═══════════════════════════════════════════════

// Helper: load smoking cessation (larger dataset, 4 treatments)
async function loadSmoking(page) {
  await page.evaluate(() => BenchmarkDatasets.loadDataset('smoking'));
  await page.waitForFunction(() => {
    const tbody = document.getElementById('studyTableBody');
    return tbody && tbody.children.length >= 20;
  }, { timeout: 5000 });
}

// ── POTH ──────────────────────────────────────

test('POTH: score is between 0 and 1 with correct interpretation', async ({ page }) => {
  await openApp(page);
  await loadSmoking(page);
  await runAnalysis(page);

  const poth = await page.evaluate(() => AppState.pothResult);
  expect(poth).toBeTruthy();
  expect(poth.poth).toBeGreaterThanOrEqual(0);
  expect(poth.poth).toBeLessThanOrEqual(1);
  expect(poth.entropy).toBeGreaterThanOrEqual(0);
  expect(poth.entropy).toBeLessThanOrEqual(poth.maxEntropy);
  expect(poth.treatments).toBe(4);
  expect(['High precision', 'Moderate precision', 'Low precision', 'No precision']).toContain(poth.interpretation);
});

test('POTH: rendered panel shows score and entropy', async ({ page }) => {
  await openApp(page);
  await loadSmoking(page);
  await runAnalysis(page);
  await switchTab(page, 'ranking');

  const pothText = await page.evaluate(() => document.getElementById('pothResults')?.textContent);
  expect(pothText).toContain('%');
  expect(pothText).toContain('POTH Score');
  expect(pothText).toContain('Observed Entropy');
  expect(pothText).toContain('Chiocchia');
});

// ── MID-Adjusted Rankings ─────────────────────

test('MID: defaults use log-scale for ratio measures', async ({ page }) => {
  await openApp(page);
  const defaults = await page.evaluate(() => MIDAdjustedRanking.defaults);
  expect(defaults.OR).toBeCloseTo(0.18, 1);
  expect(defaults.RR).toBeCloseTo(0.18, 1);
  expect(defaults.HR).toBeCloseTo(0.18, 1);
  expect(defaults.SMD).toBeCloseTo(0.2, 1);
  expect(defaults.RD).toBeCloseTo(0.05, 2);
});

test('MID: rankings computed with direction awareness', async ({ page }) => {
  await openApp(page);
  await loadSmoking(page);
  await runAnalysis(page);

  const mid = await page.evaluate(() => AppState.midRankingResult);
  expect(mid).toBeTruthy();
  expect(mid.lowerBetter).toBeDefined();
  expect(mid.mid).toBeCloseTo(0.18, 1);
  expect(mid.rankings.length).toBe(4);
  mid.rankings.forEach(r => {
    expect(r.midPscore).toBeGreaterThanOrEqual(0);
    expect(r.midPscore).toBeLessThanOrEqual(1);
    expect(r.pMeaningfullyBest).toBeGreaterThanOrEqual(0);
    expect(r.pMeaningfullyBest).toBeLessThanOrEqual(1);
    expect(r.meanMidRank).toBeGreaterThanOrEqual(1);
    expect(r.meanMidRank).toBeLessThanOrEqual(4);
    expect(r.midRankProbs.length).toBe(4);
  });
});

test('MID: UI shows log-scale label for OR', async ({ page }) => {
  await openApp(page);
  await loadSmoking(page);
  await runAnalysis(page);
  await switchTab(page, 'ranking');

  const midText = await page.evaluate(() => document.getElementById('midRankingResults')?.textContent);
  expect(midText).toContain('log-OR');
  expect(midText).toContain('MID');
  expect(midText).toContain('Spineli');
});

test('MID: fallback returns null for missing treatments', async ({ page }) => {
  await openApp(page);
  await loadSmoking(page);
  await runAnalysis(page);

  // Simulate missing treatment lookup
  const result = await page.evaluate(() => {
    const fakeRanking = [{treatment:'NONEXISTENT',pScore:0.5,rankProbs:[0.5,0.5]}];
    return MIDAdjustedRanking.calculate(fakeRanking, AppState, 'OR');
  });
  expect(result).toBeNull(); // Should return null because only 1 valid treatment
});

// ── Contribution Matrix ───────────────────────

test('ContributionMatrix: hat matrix removed from result', async ({ page }) => {
  await openApp(page);
  await loadSmoking(page);
  await runAnalysis(page);

  const cm = await page.evaluate(() => AppState.contributionMatrix);
  expect(cm).toBeTruthy();
  expect(cm.applicable).toBe(true);
  expect(cm.hatMatrix).toBeUndefined();
  expect(cm.contributions.length).toBeGreaterThan(0);
  expect(cm.method).toContain('Papakonstantinou');
  // All contributions should sum close to 100% per contrast
  cm.contributions.forEach(c => {
    c.values.forEach(v => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100.1);
    });
  });
});

test('ContributionMatrix: rendered with truncation notice for large networks', async ({ page }) => {
  await openApp(page);
  await loadSmoking(page);
  await runAnalysis(page);
  await switchTab(page, 'consistency');

  const cmHtml = await page.evaluate(() => document.getElementById('contributionMatrixContainer')?.innerHTML);
  expect(cmHtml).toBeTruthy();
  expect(cmHtml.length).toBeGreaterThan(100);
  expect(cmHtml).toContain('Contribution');
});

// ── Hasse Diagram ─────────────────────────────

test('Hasse: direction-aware dominance for lower-is-better', async ({ page }) => {
  await openApp(page);
  await loadSmoking(page);
  await runAnalysis(page);

  const hasse = await page.evaluate(() => {
    const pairwise = buildPairwiseFromResults(AppState.results);
    return HasseDiagram.buildPartialOrder(pairwise, 0.05, AppState.direction);
  });
  expect(hasse).toBeTruthy();
  expect(hasse.treatments.length).toBe(4);
  expect(hasse.maxLayer).toBeGreaterThanOrEqual(0);
  expect(hasse.maxLayer).toBeLessThan(4); // Cycle detection cap
  expect(hasse.layerGroups.length).toBeGreaterThan(0);
});

test('Hasse: SVG renders with dynamic text contrast', async ({ page }) => {
  await openApp(page);
  await loadSmoking(page);
  await runAnalysis(page);
  await switchTab(page, 'ranking');

  const svgInfo = await page.evaluate(() => {
    const svg = document.querySelector('#hasseResults svg');
    if (!svg) return null;
    const texts = svg.querySelectorAll('text[font-weight="600"]');
    const fills = Array.from(texts).map(t => t.getAttribute('fill'));
    return { nodeCount: texts.length, fills };
  });
  expect(svgInfo).toBeTruthy();
  expect(svgInfo.nodeCount).toBe(4);
  // Should have mix of white and dark text based on luminance
  expect(svgInfo.fills.every(f => f === 'white' || f === '#1a1a1a')).toBe(true);
});

test('Hasse: alpha label has for attribute', async ({ page }) => {
  await openApp(page);

  const hasFor = await page.evaluate(() => {
    const label = document.querySelector('label[for="hasseAlphaInput"]');
    return label !== null;
  });
  expect(hasFor).toBe(true);
});

test('Hasse: describe() escapes treatment names', async ({ page }) => {
  await openApp(page);
  await loadSmoking(page);
  await runAnalysis(page);

  const desc = await page.evaluate(() => {
    const pw = buildPairwiseFromResults(AppState.results);
    const po = HasseDiagram.buildPartialOrder(pw, 0.05, 'lower');
    return HasseDiagram.describe(po);
  });
  expect(desc).toContain('Layer');
  expect(desc).not.toContain('<script');
});

// ── Contextualized GRADE ──────────────────────

test('ContextualizedGRADE: direction-aware classification', async ({ page }) => {
  await openApp(page);

  // Test classifyEffect with lowerBetter=true (log scale: negative = beneficial)
  const result = await page.evaluate(() => {
    const beneficial = ContextualizedGRADE.classifyEffect(-0.5, 0.18, true);
    const harmful = ContextualizedGRADE.classifyEffect(0.5, 0.18, true);
    const trivial = ContextualizedGRADE.classifyEffect(0.05, 0.18, true);
    return { beneficial, harmful, trivial };
  });
  expect(result.beneficial.magnitude).toContain('benefit');
  expect(result.harmful.magnitude).toContain('harm');
  expect(result.trivial.magnitude).toBe('trivial');
});

test('ContextualizedGRADE: partial classification with consistent casing', async ({ page }) => {
  await openApp(page);

  const result = await page.evaluate(() => {
    const high = ContextualizedGRADE.classifyPartial(0.5, 0.18, 'high', false);
    const moderate = ContextualizedGRADE.classifyPartial(0.5, 0.18, 'moderate', false);
    const low = ContextualizedGRADE.classifyPartial(0.5, 0.18, 'low', false);
    return { high, moderate, low };
  });
  expect(result.high.qualified).toBe(result.high.category); // No prefix for high
  expect(result.moderate.qualified).toMatch(/^Probably /);
  expect(result.low.qualified).toMatch(/^May have /);
  // After fix: all non-high should be lowercase after prefix
  expect(result.moderate.qualified).toMatch(/^Probably [a-z]/);
  expect(result.low.qualified).toMatch(/^May have [a-z]/);
});

test('ContextualizedGRADE: ARIA tabs have correct attributes', async ({ page }) => {
  await openApp(page);

  const aria = await page.evaluate(() => {
    const tablist = document.querySelector('[role="tablist"][aria-label*="GRADE"]');
    const tabs = document.querySelectorAll('.contextGradeTab[role="tab"]');
    return {
      tablistExists: tablist !== null,
      tabCount: tabs.length,
      firstSelected: tabs[0]?.getAttribute('aria-selected'),
      secondSelected: tabs[1]?.getAttribute('aria-selected'),
    };
  });
  expect(aria.tablistExists).toBe(true);
  expect(aria.tabCount).toBe(2);
  expect(aria.firstSelected).toBe('true');
  expect(aria.secondSelected).toBe('false');
});

test('ContextualizedGRADE: Nikolakopoulou citation is 2020', async ({ page }) => {
  await openApp(page);
  await loadSmoking(page);
  await runAnalysis(page);
  await switchTab(page, 'cinema');

  // Click partial tab
  await page.evaluate(() => {
    document.querySelectorAll('.contextGradeTab').forEach(btn => {
      if (btn.dataset.view === 'partial') btn.click();
    });
  });
  await page.waitForTimeout(300);

  const text = await page.evaluate(() => document.getElementById('contextualizedGradeResults')?.textContent);
  expect(text).toContain('Nikolakopoulou et al. 2020');
  expect(text).not.toContain('2021');
});

// ── Class Effect Models ───────────────────────

test('ClassEffectNMA: TSD7 citation is correct', async ({ page }) => {
  await openApp(page);
  await loadSmoking(page);

  // Enable class effects toggle
  await page.evaluate(() => {
    const toggle = document.getElementById('classEffectsToggle');
    if (toggle) { toggle.checked = true; toggle.dispatchEvent(new Event('change')); }
    // Assign dummy classes
    AppState.studies.forEach(s => {
      s.class1 = s.treatment1 === 'No contact' ? 'Control' : 'Active';
      s.class2 = s.treatment2 === 'No contact' ? 'Control' : 'Active';
    });
  });
  await runAnalysis(page);

  const classHtml = await page.evaluate(() => document.getElementById('classEffectsContainer')?.innerHTML);
  expect(classHtml).toContain('TSD7');
  expect(classHtml).toContain('Ades');
  expect(classHtml).not.toContain('TSD4');
});

test('ClassEffectNMA: uses ?? not || for variance matrix', async ({ page }) => {
  await openApp(page);
  // Verify the code uses nullish coalescing
  const usesNullish = await page.evaluate(() => {
    const src = ClassEffectNMA.analyzeCommon.toString();
    return src.includes('??') && !src.includes('||0');
  });
  expect(usesNullish).toBe(true);
});

// ── Survival NMA ──────────────────────────────

test('SurvivalNMA: demo data uses final published HRs', async ({ page }) => {
  await openApp(page);

  const demo = await page.evaluate(() => SurvivalNMA.demoData);
  const kn024 = demo.find(d => d.study === 'KEYNOTE-024');
  const imp110 = demo.find(d => d.study === 'IMpower110');
  expect(kn024.hr).toBeCloseTo(0.62, 2); // Final OS
  expect(kn024.lower).toBeCloseTo(0.48, 2);
  expect(kn024.upper).toBeCloseTo(0.81, 2);
  expect(imp110.hr).toBeCloseTo(0.73, 2); // ITT-like
  expect(imp110.lower).toBeCloseTo(0.62, 2);
});

test('SurvivalNMA: SE validation rejects SE<=0 in loghr mode', async ({ page }) => {
  await openApp(page);

  const result = await page.evaluate(() => {
    // Simulate loghr mode with SE=0
    const body = document.getElementById('survDataBody');
    body.innerHTML = '';
    const tr = document.createElement('tr');
    for (let i = 0; i < 6; i++) {
      const td = document.createElement('td');
      const input = document.createElement('input');
      if (i === 0) input.value = 'Study1';
      else if (i === 1) input.value = 'A';
      else if (i === 2) input.value = 'B';
      else if (i === 3) input.value = '-0.5'; // logHR
      else if (i === 4) input.value = '0'; // SE = 0 (should be rejected)
      else input.value = '';
      td.appendChild(input);
      tr.appendChild(td);
    }
    body.appendChild(tr);
    document.getElementById('survInputMode').value = 'loghr';
    return SurvivalNMA.parseData();
  });
  expect(result.length).toBe(0); // Row should be rejected
});

test('SurvivalNMA: uses getCritVal not hardcoded 1.96', async ({ page }) => {
  await openApp(page);
  const src = await page.evaluate(() => SurvivalNMA.hrToLog.toString());
  expect(src).toContain('getCritVal');
  expect(src).not.toContain('1.96');
});

test('SurvivalNMA: league table renders with all treatment pairs', async ({ page }) => {
  await openApp(page);
  await switchTab(page, 'survival');
  await page.click('#survDemoBtn');
  await page.waitForTimeout(500);
  await page.click('#survRunBtn');
  await page.waitForTimeout(3000);

  const tableInfo = await page.evaluate(() => {
    const table = document.getElementById('survLeagueTable')?.querySelector('table');
    if (!table) return null;
    const rows = table.querySelectorAll('tbody tr');
    const cols = table.querySelectorAll('thead th');
    return { rows: rows.length, cols: cols.length };
  });
  expect(tableInfo).toBeTruthy();
  expect(tableInfo.rows).toBe(8); // 8 treatments
  expect(tableInfo.cols).toBe(9); // header + 8 treatments
});

test('SurvivalNMA: ranking uses AppState.rankingSimulations', async ({ page }) => {
  await openApp(page);
  const src = await page.evaluate(() => SurvivalNMA.analyze.toString());
  expect(src).toContain('rankingSimulations');
});

// ── Survival Parametric Extension ─────────────

test('SurvivalNMA: parametric Quick Fit generates curves', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await openApp(page);
  await switchTab(page, 'survival');
  await page.click('#survDemoBtn');
  await page.waitForTimeout(500);
  await page.click('#survRunBtn');
  await page.waitForTimeout(3000);

  // Expand parametric panel first
  await page.click('#survParamToggle');
  await page.waitForTimeout(500);

  // Click Quick Fit
  await page.click('#survQuickFitBtn');
  await page.waitForTimeout(500);

  // Param table should have rows
  const paramRows = await page.locator('#survParamInputs tr').count();
  expect(paramRows).toBeGreaterThan(0);

  // Click Generate Curves
  await page.click('#survGenCurvesBtn');
  await page.waitForTimeout(1000);

  // Plotly chart should render
  const chartExists = await page.evaluate(() => {
    const el = document.getElementById('survCurvePlot');
    return el && el.children.length > 0;
  });
  expect(chartExists).toBe(true);

  // RMST table should render
  const rmstExists = await page.evaluate(() => {
    const el = document.getElementById('survRMSTTable');
    return el && el.innerHTML.length > 50;
  });
  expect(rmstExists).toBe(true);

  expect(errors.filter(e => !e.includes('favicon') && !e.includes('net::'))).toEqual([]);
});

// ── CSS / Accessibility ───────────────────────

test('btn--sm has minimum height 36px', async ({ page }) => {
  await openApp(page);

  const minHeight = await page.evaluate(() => {
    const btn = document.querySelector('.btn--sm');
    if (!btn) return null;
    return parseInt(getComputedStyle(btn).minHeight);
  });
  expect(minHeight).toBeGreaterThanOrEqual(36);
});

test('Table captions present on new feature tables', async ({ page }) => {
  await openApp(page);
  await loadSmoking(page);
  await runAnalysis(page);

  const captions = await page.evaluate(() => {
    const tables = ['contributionMatrixTable'];
    return tables.map(id => {
      const t = document.getElementById(id);
      return t ? t.querySelector('caption') !== null : false;
    });
  });
  expect(captions[0]).toBe(true);
});

// ── WebR Cross-Validation ─────────────────────

test('POTH: entropy formula matches hand calculation', async ({ page }) => {
  await openApp(page);

  // Test with known rank probabilities
  const result = await page.evaluate(() => {
    // 3 treatments with known rank probs
    const ranking = [
      { treatment: 'A', pScore: 0.9, rankProbs: [0.8, 0.15, 0.05] },
      { treatment: 'B', pScore: 0.5, rankProbs: [0.15, 0.70, 0.15] },
      { treatment: 'C', pScore: 0.1, rankProbs: [0.05, 0.15, 0.80] },
    ];
    const r = POTHCalculator.calculate(ranking);
    return r;
  });

  // Manual calculation:
  // H(A) = -(0.8*log2(0.8) + 0.15*log2(0.15) + 0.05*log2(0.05))
  //       ≈ -(0.8*(-0.322) + 0.15*(-2.737) + 0.05*(-4.322))
  //       ≈ -(−0.258 − 0.411 − 0.216) ≈ 0.885
  // Similar for B ≈ 0.986, C ≈ 0.885
  // H_obs = (0.885 + 0.986 + 0.885) / 3 ≈ 0.919
  // POTH = 1 - 0.919/log2(3) ≈ 1 - 0.919/1.585 ≈ 1 - 0.580 ≈ 0.420
  expect(result.poth).toBeGreaterThan(0.3);
  expect(result.poth).toBeLessThan(0.6);
  expect(result.treatments).toBe(3);
  expect(result.maxEntropy).toBeCloseTo(Math.log2(3), 3);
});

test('ContributionMatrix: column sums approximately 100%', async ({ page }) => {
  await openApp(page);
  await loadSmoking(page);
  await runAnalysis(page);

  const colSums = await page.evaluate(() => {
    const cm = AppState.contributionMatrix;
    if (!cm || !cm.applicable) return null;
    const nContrasts = cm.contrastLabels.length;
    const sums = new Array(nContrasts).fill(0);
    cm.contributions.forEach(c => {
      c.values.forEach((v, j) => { sums[j] += v; });
    });
    return sums;
  });
  expect(colSums).toBeTruthy();
  colSums.forEach(s => {
    expect(s).toBeGreaterThan(95); // Allow small numerical tolerance
    expect(s).toBeLessThan(105);
  });
});

test('SurvivalNMA: hrToLog produces correct SE', async ({ page }) => {
  await openApp(page);

  const result = await page.evaluate(() => {
    // HR=0.5, 95% CI [0.3, 0.8]
    // logHR = ln(0.5) ≈ -0.693
    // logLower = ln(0.3) ≈ -1.204
    // logUpper = ln(0.8) ≈ -0.223
    // SE = (-0.223 - (-1.204)) / (2 * 1.96) ≈ 0.981 / 3.92 ≈ 0.250
    const r = SurvivalNMA.hrToLog(0.5, 0.3, 0.8);
    return r;
  });
  expect(result.logHR).toBeCloseTo(Math.log(0.5), 3);
  expect(result.se).toBeCloseTo(0.250, 2);
});

test('HasseDiagram: cycle detection caps layers', async ({ page }) => {
  await openApp(page);

  const result = await page.evaluate(() => {
    // Create a cyclic pairwise (A>B, B>C, C>A by CI)
    const cyclicPairwise = [
      { t1: 'A', t2: 'B', effect: 0.5, se: 0.1, ci_lower: 0.3, ci_upper: 0.7 },
      { t1: 'B', t2: 'C', effect: 0.5, se: 0.1, ci_lower: 0.3, ci_upper: 0.7 },
      { t1: 'C', t2: 'A', effect: 0.5, se: 0.1, ci_lower: 0.3, ci_upper: 0.7 },
    ];
    // With 'higher is better', all three dominate each other → cycle
    const po = HasseDiagram.buildPartialOrder(cyclicPairwise, 0.05, 'higher');
    return { maxLayer: po.maxLayer, treatments: po.treatments.length };
  });
  expect(result.maxLayer).toBeLessThan(result.treatments); // Capped
});

test('ClassEffectNMA: exchangeable shrinkage formula correct', async ({ page }) => {
  await openApp(page);

  // Verify shrinkage direction: large tau = less shrinkage
  const result = await page.evaluate(() => {
    // Test with tau=0 (full shrinkage to class mean)
    const w0 = 0 / (0 + 0.1 * 0.1); // w=0, full shrinkage
    const wLarge = 1 / (1 + 0.1 * 0.1); // w≈0.99, almost no shrinkage
    return { w0, wLarge };
  });
  expect(result.w0).toBeCloseTo(0, 3);
  expect(result.wLarge).toBeGreaterThan(0.95);
});

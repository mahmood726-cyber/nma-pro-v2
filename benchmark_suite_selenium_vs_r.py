import json
import pathlib
import subprocess
import tempfile
import time
from dataclasses import dataclass
from typing import Dict, List, Tuple

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.options import Options
from selenium.webdriver.support.ui import WebDriverWait


R_EXE = pathlib.Path(r"C:\Program Files\R\R-4.5.2\bin\Rscript.exe")
APP_HTML = pathlib.Path(r"C:\HTML apps\NMAhtml\nma-pro-v8.0.html")
OUT_DIR = pathlib.Path(r"C:\HTML apps\NMAhtml\selenium-downloads")

TOL = {
    "tau2": 0.005,
    "i2_pct": 5.0,
    "q": 0.5,
    "effect": 0.03,
    "pscore": 0.05,
}


DATA_THROMBOLYSIS = [
    {"name": "GUSTO-1", "treatment1": "SK", "events1": 1135, "n1": 13780, "treatment2": "tPA", "events2": 1021, "n2": 13746},
    {"name": "ASSENT-2", "treatment1": "TNK", "events1": 749, "n1": 8461, "treatment2": "tPA", "events2": 753, "n2": 8488},
    {"name": "INJECT", "treatment1": "SK", "events1": 270, "n1": 3004, "treatment2": "rPA", "events2": 285, "n2": 2992},
    {"name": "RAPID-2", "treatment1": "rPA", "events1": 58, "n1": 324, "treatment2": "tPA", "events2": 63, "n2": 325},
    {"name": "GISSI-2", "treatment1": "SK", "events1": 887, "n1": 10372, "treatment2": "tPA", "events2": 862, "n2": 10396},
    {"name": "ISIS-3", "treatment1": "SK", "events1": 1455, "n1": 13773, "treatment2": "tPA", "events2": 1418, "n2": 13746},
]

DATA_NETWORK4 = [
    {"name": "Study 1", "treatment1": "A", "events1": 12, "n1": 120, "treatment2": "B", "events2": 18, "n2": 118},
    {"name": "Study 2", "treatment1": "A", "events1": 15, "n1": 150, "treatment2": "C", "events2": 20, "n2": 152},
    {"name": "Study 3", "treatment1": "A", "events1": 10, "n1": 110, "treatment2": "D", "events2": 24, "n2": 112},
    {"name": "Study 4", "treatment1": "B", "events1": 16, "n1": 135, "treatment2": "C", "events2": 14, "n2": 132},
    {"name": "Study 5", "treatment1": "B", "events1": 20, "n1": 140, "treatment2": "D", "events2": 26, "n2": 142},
    {"name": "Study 6", "treatment1": "C", "events1": 11, "n1": 128, "treatment2": "D", "events2": 17, "n2": 130},
]

DATA_NETWORK5 = [
    {"name": "N5-1", "treatment1": "A", "events1": 30, "n1": 200, "treatment2": "B", "events2": 40, "n2": 200},
    {"name": "N5-2", "treatment1": "A", "events1": 20, "n1": 180, "treatment2": "C", "events2": 35, "n2": 180},
    {"name": "N5-3", "treatment1": "B", "events1": 45, "n1": 210, "treatment2": "C", "events2": 42, "n2": 205},
    {"name": "N5-4", "treatment1": "B", "events1": 50, "n1": 230, "treatment2": "D", "events2": 55, "n2": 225},
    {"name": "N5-5", "treatment1": "C", "events1": 38, "n1": 190, "treatment2": "D", "events2": 50, "n2": 195},
    {"name": "N5-6", "treatment1": "A", "events1": 28, "n1": 175, "treatment2": "D", "events2": 40, "n2": 180},
    {"name": "N5-7", "treatment1": "D", "events1": 60, "n1": 240, "treatment2": "E", "events2": 58, "n2": 235},
    {"name": "N5-8", "treatment1": "C", "events1": 44, "n1": 210, "treatment2": "E", "events2": 49, "n2": 208},
    {"name": "N5-9", "treatment1": "A", "events1": 35, "n1": 190, "treatment2": "E", "events2": 43, "n2": 192},
]

DATA_CONTINUOUS4 = [
    {"name": "CStudy 1", "treatment1": "A", "n1": 120, "mean1": 48.2, "sd1": 10.1, "treatment2": "B", "n2": 118, "mean2": 51.8, "sd2": 10.4},
    {"name": "CStudy 2", "treatment1": "A", "n1": 150, "mean1": 47.1, "sd1": 9.8, "treatment2": "C", "n2": 152, "mean2": 50.5, "sd2": 10.0},
    {"name": "CStudy 3", "treatment1": "A", "n1": 110, "mean1": 49.0, "sd1": 11.2, "treatment2": "D", "n2": 112, "mean2": 53.4, "sd2": 10.9},
    {"name": "CStudy 4", "treatment1": "B", "n1": 135, "mean1": 50.2, "sd1": 9.9, "treatment2": "C", "n2": 132, "mean2": 48.7, "sd2": 10.1},
    {"name": "CStudy 5", "treatment1": "B", "n1": 140, "mean1": 52.1, "sd1": 10.5, "treatment2": "D", "n2": 142, "mean2": 54.0, "sd2": 10.7},
    {"name": "CStudy 6", "treatment1": "C", "n1": 128, "mean1": 49.4, "sd1": 9.7, "treatment2": "D", "n2": 130, "mean2": 52.3, "sd2": 10.2},
]

DATA_HR4 = [
    {"name": "HRStudy 1", "treatment1": "A", "treatment2": "B", "yi": -0.1823215568, "se": 0.115},
    {"name": "HRStudy 2", "treatment1": "A", "treatment2": "C", "yi": -0.0833816089, "se": 0.124},
    {"name": "HRStudy 3", "treatment1": "A", "treatment2": "D", "yi": -0.2231435513, "se": 0.132},
    {"name": "HRStudy 4", "treatment1": "B", "treatment2": "C", "yi": 0.0953101798, "se": 0.118},
    {"name": "HRStudy 5", "treatment1": "B", "treatment2": "D", "yi": -0.0512932944, "se": 0.121},
    {"name": "HRStudy 6", "treatment1": "C", "treatment2": "D", "yi": -0.1397619424, "se": 0.127},
]


@dataclass
class Scenario:
    name: str
    studies: List[Dict[str, object]]
    effect_measure: str
    estimator: str
    reference: str
    direction: str = "lower"
    small_study: str = "none"
    prediction_intervals: bool = False
    data_mode: str = "binary"


SCENARIOS: List[Scenario] = [
    Scenario("thrombolysis_or_reml", DATA_THROMBOLYSIS, "OR", "REML", "tPA"),
    Scenario("thrombolysis_rr_reml", DATA_THROMBOLYSIS, "RR", "REML", "tPA"),
    Scenario("network4_rd_dl", DATA_NETWORK4, "RD", "DL", "A"),
    Scenario("network4_or_dl", DATA_NETWORK4, "OR", "DL", "A"),
    Scenario("network4_rr_dl", DATA_NETWORK4, "RR", "DL", "A"),
    Scenario("network4_smd_reml", DATA_CONTINUOUS4, "SMD", "REML", "A", data_mode="continuous"),
    Scenario("network4_hr_reml", DATA_HR4, "HR", "REML", "A", data_mode="direct"),
    Scenario("network5_or_fe", DATA_NETWORK5, "OR", "FE", "A"),
    Scenario("network5_or_reml", DATA_NETWORK5, "OR", "REML", "A"),
]


def _wait_for_app(driver: webdriver.Edge, timeout: int = 50) -> None:
    wait = WebDriverWait(driver, timeout)
    wait.until(
        lambda d: d.execute_script(
            "return !!(typeof AppState!=='undefined' && typeof runAnalysis==='function' && typeof renderStudyTable==='function');"
        )
    )


def _apply_scenario(driver: webdriver.Edge, s: Scenario) -> None:
    driver.execute_script(
        """
        const studies = arguments[0];
        const cfg = arguments[1];
        AppState.studies = studies.map(x => ({...x}));
        renderStudyTable();
        if (typeof updateReferenceSelect === 'function') updateReferenceSelect();
        const em = document.getElementById('effectMeasureSelect'); if (em) em.value = cfg.effect_measure;
        const est = document.getElementById('estimatorSelect'); if (est) est.value = cfg.estimator;
        const ref = document.getElementById('referenceSelect'); if (ref) ref.value = cfg.reference;
        const sc = document.getElementById('smallStudyCorrectionSelect'); if (sc) sc.value = cfg.small_study;
        const pred = document.getElementById('predictionCheckbox'); if (pred) pred.checked = !!cfg.prediction_intervals;
        const dir = document.querySelector(`input[name="direction"][value="${cfg.direction}"]`); if (dir) dir.checked = true;
        """,
        s.studies,
        {
            "effect_measure": s.effect_measure,
            "estimator": s.estimator,
            "reference": s.reference,
            "small_study": s.small_study,
            "prediction_intervals": s.prediction_intervals,
            "direction": s.direction,
        },
    )


def _run_app_once(driver: webdriver.Edge) -> Dict[str, object]:
    driver.find_element(By.ID, "runAnalysisBtn").click()
    wait = WebDriverWait(driver, 120)
    wait.until(lambda d: d.execute_script("const ov=document.getElementById('loadingOverlay'); return !ov || ov.getAttribute('aria-hidden')==='true';"))
    wait.until(lambda d: d.execute_script("return !!(typeof AppState!=='undefined' && AppState.results && AppState.ranking);"))
    time.sleep(0.3)
    return driver.execute_script(
        """
        const effects = {};
        for (const [k, v] of Object.entries(AppState.results.effects.effects || {})) {
          effects[k] = {estimate: v.estimate, se: v.se};
        }
        return {
          tau2: AppState.results.tau2,
          i2_pct: AppState.results.heterogeneity.I2,
          q: AppState.results.heterogeneity.Q,
          rankingSeed: AppState.rankingSeed,
          rankingNSim: AppState.ranking && AppState.ranking.nSim,
          effects,
          pscore: Object.fromEntries((AppState.ranking || []).map(r => [r.treatment, r.pScore])),
          ranking: (AppState.ranking || []).map(r => ({treatment: r.treatment, rank: r.rank, pScore: r.pScore, meanRank: r.meanRank}))
        };
        """
    )


def run_selenium_scenario(driver: webdriver.Edge, s: Scenario) -> Dict[str, object]:
    _apply_scenario(driver, s)
    first = _run_app_once(driver)
    second = _run_app_once(driver)
    first["deterministic_repro"] = first["ranking"] == second["ranking"]
    return first


def run_r_scenario(s: Scenario) -> Dict[str, float]:
    if not R_EXE.exists():
        raise FileNotFoundError(f"Rscript not found: {R_EXE}")

    sm = s.effect_measure
    estimator = s.estimator
    reference = s.reference
    studies_json = json.dumps(s.studies)

    if s.data_mode == "continuous":
        prep_block = f"""
p1 <- pairwise(
  treat=list(studies$treatment1, studies$treatment2),
  mean=list(studies$mean1, studies$mean2),
  sd=list(studies$sd1, studies$sd2),
  n=list(studies$n1, studies$n2),
  studlab=studies$name,
  data=studies,
  sm='{sm}'
)
"""
    elif s.data_mode == "direct":
        prep_block = """
studies$TE <- as.numeric(studies$yi)
studies$seTE <- if ('se' %in% names(studies) && any(!is.na(studies$se))) as.numeric(studies$se) else sqrt(as.numeric(studies$vi))
p1 <- data.frame(
  TE = studies$TE,
  seTE = studies$seTE,
  treat1 = studies$treatment1,
  treat2 = studies$treatment2,
  studlab = studies$name
)
"""
    else:
        prep_block = f"""
p1 <- pairwise(
  treat=list(studies$treatment1, studies$treatment2),
  event=list(studies$events1, studies$events2),
  n=list(studies$n1, studies$n2),
  studlab=studies$name,
  data=studies,
  sm='{sm}'
)
"""

    r_script = f"""
suppressPackageStartupMessages(library(netmeta))
studies <- jsonlite::fromJSON('{studies_json}')
studies <- as.data.frame(studies)
if (!('name' %in% names(studies))) studies$name <- paste0('S', seq_len(nrow(studies)))
{prep_block}
if ('{estimator}' == 'FE') {{
  net <- netmeta(TE,seTE,treat1,treat2,studlab,data=p1,sm='{sm}',reference.group='{reference}',common=TRUE,random=FALSE)
  te_mat <- net$TE.common
  nr <- netrank(net, small.values='good')
  pscore <- nr$ranking.common
  tau2 <- 0
}} else {{
  method_tau <- ifelse('{estimator}' == 'DL', 'DL', 'REML')
  net <- netmeta(TE,seTE,treat1,treat2,studlab,data=p1,sm='{sm}',reference.group='{reference}',common=FALSE,random=TRUE,method.tau=method_tau)
  te_mat <- net$TE.random
  nr <- netrank(net, small.values='good')
  pscore <- nr$ranking.random
  tau2 <- net$tau^2
}}
cat(sprintf('TAU2=%.12f\\n', tau2))
cat(sprintf('I2_PERCENT=%.12f\\n', net$I2*100))
cat(sprintf('Q=%.12f\\n', net$Q))
for (t in rownames(te_mat)) {{
  cat(sprintf('EFFECT_%s=%.12f\\n', t, te_mat[t, '{reference}']))
}}
for (t in names(pscore)) {{
  cat(sprintf('PSCORE_%s=%.12f\\n', t, pscore[[t]]))
}}
"""

    with tempfile.NamedTemporaryFile("w", suffix=".R", delete=False, encoding="utf-8") as f:
        # jsonlite is base-recommended in many installs but ensure package is present first
        f.write("if(!requireNamespace('jsonlite', quietly=TRUE)) install.packages('jsonlite', repos='https://cloud.r-project.org')\n")
        f.write(r_script)
        r_path = pathlib.Path(f.name)

    proc = subprocess.run([str(R_EXE), str(r_path)], capture_output=True, text=True, check=False)
    if proc.returncode != 0:
        raise RuntimeError(
            f"Rscript failed for scenario {s.name}\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
        )

    out: Dict[str, float] = {}
    for line in proc.stdout.splitlines():
        line = line.strip()
        if "=" not in line:
            continue
        k, v = line.split("=", 1)
        k = k.strip()
        v = v.strip()
        try:
            out[k] = float(v)
        except ValueError:
            continue
    return out


def compare(app: Dict[str, object], r: Dict[str, float]) -> Dict[str, object]:
    tau2_diff = abs(float(app["tau2"]) - float(r["TAU2"]))
    i2_diff = abs(float(app["i2_pct"]) - float(r["I2_PERCENT"]))
    q_diff = abs(float(app["q"]) - float(r["Q"]))

    effect_keys = sorted(set(app["effects"].keys()) & {k.replace("EFFECT_", "") for k in r if k.startswith("EFFECT_")})
    effect_diffs = {}
    for t in effect_keys:
        app_est = float(app["effects"][t]["estimate"])
        r_est = float(r[f"EFFECT_{t}"])
        effect_diffs[t] = abs(app_est - r_est)
    max_effect_diff = max(effect_diffs.values()) if effect_diffs else 0.0

    pscore_keys = sorted(set(app["pscore"].keys()) & {k.replace("PSCORE_", "") for k in r if k.startswith("PSCORE_")})
    pscore_diffs = {}
    for t in pscore_keys:
        pscore_diffs[t] = abs(float(app["pscore"][t]) - float(r[f"PSCORE_{t}"]))
    max_pscore_diff = max(pscore_diffs.values()) if pscore_diffs else 0.0

    passed = (
        bool(app.get("deterministic_repro"))
        and tau2_diff <= TOL["tau2"]
        and i2_diff <= TOL["i2_pct"]
        and q_diff <= TOL["q"]
        and max_effect_diff <= TOL["effect"]
        and max_pscore_diff <= TOL["pscore"]
    )
    return {
        "passed": passed,
        "deterministic_repro": bool(app.get("deterministic_repro")),
        "tau2_diff": tau2_diff,
        "i2_diff": i2_diff,
        "q_diff": q_diff,
        "max_effect_diff": max_effect_diff,
        "max_pscore_diff": max_pscore_diff,
        "effect_diffs": effect_diffs,
        "pscore_diffs": pscore_diffs,
    }


def make_driver() -> webdriver.Edge:
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--allow-file-access-from-files")
    opts.add_argument("--allow-file-access")
    opts.add_argument("--window-size=1440,1000")
    return webdriver.Edge(options=opts)


def run_suite() -> Dict[str, object]:
    if not APP_HTML.exists():
        raise FileNotFoundError(f"App file not found: {APP_HTML}")
    if not R_EXE.exists():
        raise FileNotFoundError(f"Rscript not found: {R_EXE}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    driver = make_driver()
    driver.get(APP_HTML.as_uri())
    _wait_for_app(driver)
    suite_results = []
    for idx, s in enumerate(SCENARIOS, start=1):
        app_out = run_selenium_scenario(driver, s)
        r_out = run_r_scenario(s)
        diff = compare(app_out, r_out)
        suite_results.append(
            {
                "scenario": s.__dict__,
                "app": app_out,
                "r": r_out,
                "diff": diff,
            }
        )
        print(f"[{idx}/{len(SCENARIOS)}] {s.name}: {'PASS' if diff['passed'] else 'FAIL'}")

    overall_pass = all(x["diff"]["passed"] for x in suite_results)
    summary = {
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "app_file": str(APP_HTML),
        "rscript": str(R_EXE),
        "tolerance": TOL,
        "overall_pass": overall_pass,
        "n_scenarios": len(suite_results),
        "n_passed": sum(1 for x in suite_results if x["diff"]["passed"]),
        "results": suite_results,
    }
    # Intentionally avoid driver.quit() here because some environments hang on teardown.
    # The caller can clean up browser processes after reports are written.
    return summary


def write_reports(summary: Dict[str, object]) -> Tuple[pathlib.Path, pathlib.Path]:
    ts = int(time.time())
    json_path = OUT_DIR / f"benchmark_suite_selenium_vs_r_{ts}.json"
    md_path = OUT_DIR / f"benchmark_suite_selenium_vs_r_{ts}.md"

    json_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    lines = []
    lines.append("# Selenium vs R netmeta Benchmark Suite")
    lines.append("")
    lines.append(f"- Generated: {summary['generated_at']}")
    lines.append(f"- App: `{summary['app_file']}`")
    lines.append(f"- Rscript: `{summary['rscript']}`")
    lines.append(f"- Overall: **{'PASS' if summary['overall_pass'] else 'FAIL'}** ({summary['n_passed']}/{summary['n_scenarios']})")
    lines.append("")
    lines.append("## Scenario Summary")
    lines.append("")
    lines.append("| Scenario | Result | Deterministic | tau2 diff | I2 diff | Q diff | Max effect diff | Max P-score diff |")
    lines.append("|---|---:|---:|---:|---:|---:|---:|---:|")
    for r in summary["results"]:
        name = r["scenario"]["name"]
        d = r["diff"]
        lines.append(
            f"| {name} | {'PASS' if d['passed'] else 'FAIL'} | {'PASS' if d['deterministic_repro'] else 'FAIL'} "
            f"| {d['tau2_diff']:.6g} | {d['i2_diff']:.6g} | {d['q_diff']:.6g} | {d['max_effect_diff']:.6g} | {d['max_pscore_diff']:.6g} |"
        )

    lines.append("")
    lines.append("## Tolerance")
    lines.append("")
    lines.append(f"- tau2: {TOL['tau2']}")
    lines.append(f"- I2 (%): {TOL['i2_pct']}")
    lines.append(f"- Q: {TOL['q']}")
    lines.append(f"- Effect (log scale): {TOL['effect']}")
    lines.append(f"- P-score: {TOL['pscore']}")
    lines.append("")
    md_path.write_text("\n".join(lines), encoding="utf-8")
    return json_path, md_path


def main() -> None:
    summary = run_suite()
    json_path, md_path = write_reports(summary)
    print("")
    print("=== Benchmark Suite Complete ===")
    print(f"Overall: {'PASS' if summary['overall_pass'] else 'FAIL'} ({summary['n_passed']}/{summary['n_scenarios']})")
    print(f"JSON report: {json_path}")
    print(f"Markdown report: {md_path}")


if __name__ == "__main__":
    main()

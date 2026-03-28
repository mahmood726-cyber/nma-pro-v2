import json
import math
import pathlib
import subprocess
import tempfile
import time
from typing import Dict, List

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.options import Options
from selenium.webdriver.support.ui import WebDriverWait


STUDIES: List[Dict[str, object]] = [
    {"name": "GUSTO-1", "treatment1": "SK", "events1": 1135, "n1": 13780, "treatment2": "tPA", "events2": 1021, "n2": 13746},
    {"name": "ASSENT-2", "treatment1": "TNK", "events1": 749, "n1": 8461, "treatment2": "tPA", "events2": 753, "n2": 8488},
    {"name": "INJECT", "treatment1": "SK", "events1": 270, "n1": 3004, "treatment2": "rPA", "events2": 285, "n2": 2992},
    {"name": "RAPID-2", "treatment1": "rPA", "events1": 58, "n1": 324, "treatment2": "tPA", "events2": 63, "n2": 325},
    {"name": "GISSI-2", "treatment1": "SK", "events1": 887, "n1": 10372, "treatment2": "tPA", "events2": 862, "n2": 10396},
    {"name": "ISIS-3", "treatment1": "SK", "events1": 1455, "n1": 13773, "treatment2": "tPA", "events2": 1418, "n2": 13746},
]

R_EXE = pathlib.Path(r"C:\Program Files\R\R-4.5.2\bin\Rscript.exe")
APP_HTML = pathlib.Path(r"C:\HTML apps\NMAhtml\nma-pro-v8.0.html")

TOL = {
    "tau2": 0.005,
    "i2_pct": 5.0,
    "q": 0.5,
    "effect": 0.03,
    "pscore": 0.05,
}


def _wait_for_app(driver: webdriver.Edge, timeout: int = 40) -> None:
    wait = WebDriverWait(driver, timeout)
    wait.until(
        lambda d: d.execute_script(
            "return !!(typeof AppState!=='undefined' && typeof runAnalysis==='function' && typeof renderStudyTable==='function');"
        )
    )


def _run_app_once(driver: webdriver.Edge) -> Dict[str, object]:
    driver.execute_script(
        """
        const studies = arguments[0];
        AppState.studies = studies.map(s => ({...s}));
        if (typeof renderStudyTable === 'function') renderStudyTable();
        if (typeof updateReferenceSelect === 'function') updateReferenceSelect();
        const em = document.getElementById('effectMeasureSelect'); if (em) em.value = 'OR';
        const est = document.getElementById('estimatorSelect'); if (est) est.value = 'REML';
        const sc = document.getElementById('smallStudyCorrectionSelect'); if (sc) sc.value = 'hksj';
        const pred = document.getElementById('predictionCheckbox'); if (pred) pred.checked = true;
        const dir = document.querySelector('input[name="direction"][value="lower"]'); if (dir) dir.checked = true;
        if (typeof updateReferenceSelect === 'function') updateReferenceSelect();
        const ref = document.getElementById('referenceSelect'); if (ref) ref.value = 'tPA';
        """,
        STUDIES,
    )

    run_btn = driver.find_element(By.ID, "runAnalysisBtn")
    run_btn.click()

    wait = WebDriverWait(driver, 90)
    wait.until(lambda d: d.execute_script("const ov=document.getElementById('loadingOverlay'); return !ov || ov.getAttribute('aria-hidden')==='true';"))
    wait.until(lambda d: d.execute_script("return !!(typeof AppState!=='undefined' && AppState.results && AppState.ranking);"))
    time.sleep(0.3)

    payload = driver.execute_script(
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
    return payload


def run_selenium_app() -> Dict[str, object]:
    if not APP_HTML.exists():
        raise FileNotFoundError(f"App file not found: {APP_HTML}")

    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--allow-file-access-from-files")
    opts.add_argument("--allow-file-access")
    opts.add_argument("--window-size=1440,1000")

    driver = webdriver.Edge(options=opts)
    try:
        driver.get(APP_HTML.as_uri())
        _wait_for_app(driver)
        first = _run_app_once(driver)
        second = _run_app_once(driver)
        first["deterministic_repro"] = first["ranking"] == second["ranking"]
        return first
    finally:
        driver.quit()


def run_r_netmeta() -> Dict[str, float]:
    if not R_EXE.exists():
        raise FileNotFoundError(f"Rscript not found: {R_EXE}")

    r_script = r"""
suppressPackageStartupMessages(library(netmeta))
studies <- data.frame(
  study=c("GUSTO-1","ASSENT-2","INJECT","RAPID-2","GISSI-2","ISIS-3"),
  treat1=c("SK","TNK","SK","rPA","SK","SK"),
  event1=c(1135,749,270,58,887,1455),
  n1=c(13780,8461,3004,324,10372,13773),
  treat2=c("tPA","tPA","rPA","tPA","tPA","tPA"),
  event2=c(1021,753,285,63,862,1418),
  n2=c(13746,8488,2992,325,10396,13746)
)
p1 <- pairwise(
  treat=list(studies$treat1, studies$treat2),
  event=list(studies$event1, studies$event2),
  n=list(studies$n1, studies$n2),
  studlab=studies$study,
  sm="OR"
)
net <- netmeta(
  TE, seTE, treat1, treat2, studlab,
  data=p1, sm="OR", reference.group="tPA",
  common=FALSE, random=TRUE, method.tau="REML"
)
nr <- netrank(net, small.values="good")
cat(sprintf("TAU2=%.12f\n", net$tau^2))
cat(sprintf("I2_PERCENT=%.12f\n", net$I2 * 100))
cat(sprintf("Q=%.12f\n", net$Q))
for (t in rownames(net$TE.random)) {
  cat(sprintf("EFFECT_%s=%.12f\n", t, net$TE.random[t, "tPA"]))
}
for (t in names(nr$ranking.random)) {
  cat(sprintf("PSCORE_%s=%.12f\n", t, nr$ranking.random[[t]]))
}
"""

    with tempfile.NamedTemporaryFile("w", suffix=".R", delete=False, encoding="ascii") as f:
        f.write(r_script)
        r_path = pathlib.Path(f.name)

    proc = subprocess.run([str(R_EXE), str(r_path)], capture_output=True, text=True, check=False)
    if proc.returncode != 0:
        raise RuntimeError(f"Rscript failed:\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}")

    out: Dict[str, float] = {}
    for line in proc.stdout.splitlines():
        line = line.strip()
        if "=" not in line or line.startswith("During startup"):
            continue
        key, val = line.split("=", 1)
        key = key.strip()
        val = val.strip()
        try:
            out[key] = float(val)
        except ValueError:
            pass
    return out


def _fmt_pass(diff: float, tol: float) -> str:
    return "PASS" if diff <= tol else "FAIL"


def main() -> None:
    app = run_selenium_app()
    r = run_r_netmeta()

    print("=== Selenium vs R netmeta Benchmark ===")
    print(f"App file: {APP_HTML}")
    print(f"Rscript:  {R_EXE}")
    print("")
    print(f"App ranking seed: {app.get('rankingSeed')}")
    print(f"App ranking simulations: {app.get('rankingNSim')}")
    print(f"Deterministic rerun check: {'PASS' if app.get('deterministic_repro') else 'FAIL'}")
    print("")

    tau2_diff = abs(float(app["tau2"]) - float(r["TAU2"]))
    i2_diff = abs(float(app["i2_pct"]) - float(r["I2_PERCENT"]))
    q_diff = abs(float(app["q"]) - float(r["Q"]))

    print(f"tau2    app={float(app['tau2']):.10f}  r={float(r['TAU2']):.10f}  diff={tau2_diff:.10f}  {_fmt_pass(tau2_diff, TOL['tau2'])}")
    print(f"I2(%)   app={float(app['i2_pct']):.6f}  r={float(r['I2_PERCENT']):.6f}  diff={i2_diff:.6f}  {_fmt_pass(i2_diff, TOL['i2_pct'])}")
    print(f"Q       app={float(app['q']):.10f}  r={float(r['Q']):.10f}  diff={q_diff:.10f}  {_fmt_pass(q_diff, TOL['q'])}")
    print("")

    treatments = sorted(set(app["effects"].keys()) & {k.replace("EFFECT_", "") for k in r.keys() if k.startswith("EFFECT_")})
    max_effect_diff = 0.0
    print("Effect estimates vs reference (log OR):")
    for t in treatments:
        app_est = float(app["effects"][t]["estimate"])
        r_est = float(r[f"EFFECT_{t}"])
        diff = abs(app_est - r_est)
        max_effect_diff = max(max_effect_diff, diff)
        print(f"  {t:>4}  app={app_est:.10f}  r={r_est:.10f}  diff={diff:.10f}  {_fmt_pass(diff, TOL['effect'])}")
    print("")

    pscore_treatments = sorted(set(app["pscore"].keys()) & {k.replace("PSCORE_", "") for k in r.keys() if k.startswith("PSCORE_")})
    max_pscore_diff = 0.0
    print("P-scores:")
    for t in pscore_treatments:
        app_p = float(app["pscore"][t])
        r_p = float(r[f"PSCORE_{t}"])
        diff = abs(app_p - r_p)
        max_pscore_diff = max(max_pscore_diff, diff)
        print(f"  {t:>4}  app={app_p:.10f}  r={r_p:.10f}  diff={diff:.10f}  {_fmt_pass(diff, TOL['pscore'])}")
    print("")

    all_pass = (
        app.get("deterministic_repro")
        and tau2_diff <= TOL["tau2"]
        and i2_diff <= TOL["i2_pct"]
        and q_diff <= TOL["q"]
        and max_effect_diff <= TOL["effect"]
        and max_pscore_diff <= TOL["pscore"]
    )
    print(f"OVERALL: {'PASS' if all_pass else 'FAIL'}")

    report = {
        "overall_pass": bool(all_pass),
        "app": app,
        "r": r,
        "diff": {
            "tau2": tau2_diff,
            "i2_pct": i2_diff,
            "q": q_diff,
            "max_effect": max_effect_diff,
            "max_pscore": max_pscore_diff,
        },
        "tolerance": TOL,
    }
    out_path = pathlib.Path(r"C:\HTML apps\NMAhtml\selenium-downloads") / f"benchmark_selenium_vs_r_{int(time.time())}.json"
    out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Saved report: {out_path}")


if __name__ == "__main__":
    main()

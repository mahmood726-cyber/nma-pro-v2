param(
    [Parameter(Mandatory = $true)]
    [string]$InputJson,
    [string]$RscriptPath = 'C:\Program Files\R\R-4.5.2\bin\x64\Rscript.exe',
    [string]$OutputJson = ''
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $InputJson)) {
    throw "Input JSON not found: $InputJson"
}
if (-not (Test-Path -LiteralPath $RscriptPath)) {
    throw "Rscript not found: $RscriptPath"
}

$inputObj = Get-Content -LiteralPath $InputJson -Raw | ConvertFrom-Json
if (-not $inputObj.studies) {
    throw "Input JSON must contain a 'studies' array (use NMA Pro JSON/session export)."
}

$workDir = Join-Path $env:TEMP ("nma_r_benchmark_" + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $workDir | Out-Null

$driverJson = Join-Path $workDir 'driver_input.json'
$driverR = Join-Path $workDir 'run_benchmark.R'

$driverObj = [ordered]@{
    studies = $inputObj.studies
    options = if ($inputObj.options) { $inputObj.options } else { @{} }
}
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($driverJson, ($driverObj | ConvertTo-Json -Depth 12), $utf8NoBom)

if ([string]::IsNullOrWhiteSpace($OutputJson)) {
    $baseDir = Split-Path -Parent $InputJson
    $OutputJson = Join-Path $baseDir ("nma_external_benchmark_" + (Get-Date -Format 'yyyyMMdd_HHmmss') + '.json')
}

$rCode = @'
args <- commandArgs(trailingOnly = TRUE)
in_file <- args[[1]]
out_file <- args[[2]]

if (!requireNamespace("jsonlite", quietly = TRUE)) install.packages("jsonlite", repos = "https://cloud.r-project.org")
if (!requireNamespace("netmeta", quietly = TRUE)) install.packages("netmeta", repos = "https://cloud.r-project.org")

library(jsonlite)
library(netmeta)

payload <- fromJSON(in_file, simplifyDataFrame = TRUE)
studies <- as.data.frame(payload$studies, stringsAsFactors = FALSE)
opts <- payload$options
if (is.null(opts)) opts <- list()

sm <- if (!is.null(opts$effectMeasure)) as.character(opts$effectMeasure) else "OR"
reference_group <- if (!is.null(opts$reference)) as.character(opts$reference) else ""
estimator <- if (!is.null(opts$estimator)) toupper(as.character(opts$estimator)) else "REML"
direction <- if (!is.null(opts$direction)) as.character(opts$direction) else "lower"
small_values <- if (direction == "lower") "good" else "bad"
method_tau <- if (estimator %in% c("REML", "DL", "PM")) estimator else "REML"

if (!all(c("name", "treatment1", "treatment2") %in% names(studies))) {
  stop("Studies must contain at least name, treatment1, treatment2 columns")
}

if (sm %in% c("OR", "RR", "HR", "RD")) {
  required <- c("events1", "n1", "events2", "n2")
  miss <- required[!required %in% names(studies)]
  if (length(miss) > 0) stop(paste("Missing required binary columns:", paste(miss, collapse = ", ")))
  p1 <- pairwise(
    treat = list(studies$treatment1, studies$treatment2),
    event = list(studies$events1, studies$events2),
    n = list(studies$n1, studies$n2),
    studlab = studies$name,
    sm = sm
  )
} else if (sm == "SMD") {
  required <- c("mean1", "sd1", "n1", "mean2", "sd2", "n2")
  miss <- required[!required %in% names(studies)]
  if (length(miss) > 0) stop(paste("Missing required continuous columns:", paste(miss, collapse = ", ")))
  p1 <- pairwise(
    treat = list(studies$treatment1, studies$treatment2),
    mean = list(studies$mean1, studies$mean2),
    sd = list(studies$sd1, studies$sd2),
    n = list(studies$n1, studies$n2),
    studlab = studies$name,
    sm = "SMD"
  )
} else {
  stop(paste("Unsupported effect measure:", sm))
}

is_fe <- estimator == "FE"
net <- netmeta(
  TE, seTE, treat1, treat2, studlab,
  data = p1,
  sm = sm,
  reference.group = reference_group,
  common = is_fe,
  random = !is_fe,
  method.tau = method_tau
)

rank_obj <- tryCatch(netrank(net, small.values = small_values), error = function(e) NULL)
p_scores <- list()
if (!is.null(rank_obj)) {
  p_raw <- NULL
  if (!is.null(rank_obj$ranking.random)) p_raw <- rank_obj$ranking.random
  if (is.null(p_raw) && !is.null(rank_obj$Pscore.random)) p_raw <- rank_obj$Pscore.random
  if (is.null(p_raw) && !is.null(rank_obj$ranking.common)) p_raw <- rank_obj$ranking.common
  if (is.null(p_raw) && !is.null(rank_obj$Pscore.fixed)) p_raw <- rank_obj$Pscore.fixed

  if (!is.null(p_raw)) {
    if (is.matrix(p_raw) || is.data.frame(p_raw)) {
      p_num <- suppressWarnings(as.numeric(p_raw[, 1]))
      p_names <- rownames(p_raw)
    } else {
      p_num <- suppressWarnings(as.numeric(p_raw))
      p_names <- names(p_raw)
    }
    if (is.null(p_names) || any(!nzchar(p_names))) {
      p_names <- tryCatch(as.character(net$trts), error = function(e) character())
    }
    if (length(p_num) == length(p_names) && length(p_num) > 0) {
      names(p_num) <- p_names
      p_scores <- as.list(p_num)
    }
  }
}

i2_raw <- suppressWarnings(as.numeric(net$I2))
i2_val <- if (length(i2_raw) > 0 && is.finite(i2_raw[1])) i2_raw[1] else NA_real_
if (is.finite(i2_val) && i2_val <= 1) i2_val <- i2_val * 100

tau2_raw <- suppressWarnings(as.numeric(net$tau^2))
tau2_val <- if (length(tau2_raw) > 0 && is.finite(tau2_raw[1])) tau2_raw[1] else NA_real_

q_raw <- suppressWarnings(as.numeric(net$Q))
q_val <- if (length(q_raw) > 0 && is.finite(q_raw[1])) q_raw[1] else NA_real_

out <- list(
  source = "R-netmeta",
  timestamp = as.character(Sys.time()),
  tau2 = tau2_val,
  I2 = i2_val,
  Q = q_val,
  pscores = p_scores,
  metadata = list(
    sm = sm,
    reference = reference_group,
    method_tau = method_tau,
    estimator = estimator,
    generated_by = "run-r-benchmark.ps1"
  )
)

write_json(out, out_file, auto_unbox = TRUE, pretty = TRUE)
cat(sprintf("Benchmark JSON written: %s\n", out_file))
'@

[System.IO.File]::WriteAllText($driverR, $rCode, $utf8NoBom)

& $RscriptPath $driverR $driverJson $OutputJson

Write-Host ""
Write-Host "Done. Import this file in NMA Pro Validation > External Benchmark:" -ForegroundColor Green
Write-Host $OutputJson

import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlparse
from urllib.request import Request, urlopen


UPSTREAM_URL = "https://clinicaltrials.gov/api/v2/studies"
HOST = os.environ.get("CTGOV_PROXY_HOST", "127.0.0.1")
PORT = int(os.environ.get("CTGOV_PROXY_PORT", "8765"))
APP_FILE = Path(__file__).with_name("nma-pro-v8.0.html")


class CTGovProxyHandler(BaseHTTPRequestHandler):
    server_version = "CTGovProxy/1.0"

    def log_message(self, fmt, *args):
        return

    def _send_json(self, status_code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, path: Path, content_type: str):
        body = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in {"", "/", "/index.html", "/nma-pro-v8.0.html"}:
            if not APP_FILE.exists():
                self._send_json(500, {"error": "App file not found", "path": str(APP_FILE)})
                return
            self._send_file(APP_FILE, "text/html; charset=utf-8")
            return

        if parsed.path == "/health":
            self._send_json(
                200,
                {
                    "ok": True,
                    "service": "ctgov_proxy",
                    "upstream": UPSTREAM_URL,
                    "host": HOST,
                    "port": PORT,
                    "app": str(APP_FILE.name),
                },
            )
            return

        if parsed.path.startswith("/ctgov/study/"):
            nct_id = parsed.path.rsplit("/", 1)[-1].strip()
            if not nct_id:
                self._send_json(400, {"error": "Missing NCT ID"})
                return

            params = parse_qs(parsed.query)
            fields = (params.get("fields", [""])[0] or "").strip()
            upstream_params = {}
            if fields:
                upstream_params["fields"] = fields

            request = Request(
                f"{UPSTREAM_URL}/{nct_id}" + (f"?{urlencode(upstream_params)}" if upstream_params else ""),
                headers={"Accept": "application/json"},
                method="GET",
            )

            try:
                with urlopen(request, timeout=60) as response:
                    payload = json.loads(response.read().decode("utf-8"))
            except HTTPError as exc:
                detail = exc.read().decode("utf-8", errors="ignore")
                self._send_json(exc.code, {"error": f"Upstream HTTP {exc.code}", "detail": detail[:1000]})
                return
            except URLError as exc:
                self._send_json(502, {"error": "Upstream connection failed", "detail": str(exc.reason)})
                return
            except Exception as exc:
                self._send_json(500, {"error": "Unexpected proxy failure", "detail": str(exc)})
                return

            self._send_json(200, payload if isinstance(payload, dict) else {"study": payload})
            return

        if parsed.path not in {"/ctgov/search", "/search"}:
            self._send_json(404, {"error": "Not found"})
            return

        params = parse_qs(parsed.query)
        query = (params.get("query", [""])[0] or "").strip()
        if len(query) < 3:
            self._send_json(400, {"error": "Query must be at least 3 characters"})
            return

        try:
            page_size = int(params.get("pageSize", ["25"])[0])
        except ValueError:
            page_size = 25
        page_size = max(1, min(100, page_size))

        upstream_params = {
            "query.term": query,
            "pageSize": str(page_size),
            "countTotal": "true",
        }
        page_token = (params.get("pageToken", [""])[0] or "").strip()
        if page_token:
            upstream_params["pageToken"] = page_token

        request = Request(
            f"{UPSTREAM_URL}?{urlencode(upstream_params)}",
            headers={"Accept": "application/json"},
            method="GET",
        )

        try:
            with urlopen(request, timeout=60) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            self._send_json(exc.code, {"error": f"Upstream HTTP {exc.code}", "detail": detail[:1000]})
            return
        except URLError as exc:
            self._send_json(502, {"error": "Upstream connection failed", "detail": str(exc.reason)})
            return
        except Exception as exc:
            self._send_json(500, {"error": "Unexpected proxy failure", "detail": str(exc)})
            return

        studies = payload.get("studies") if isinstance(payload, dict) else None
        result = {
            "query": query,
            "pageSize": page_size,
            "totalCount": payload.get("totalCount") if isinstance(payload, dict) else None,
            "nextPageToken": payload.get("nextPageToken") if isinstance(payload, dict) else None,
            "studies": studies if isinstance(studies, list) else [],
        }
        self._send_json(200, result)


def main():
    server = HTTPServer((HOST, PORT), CTGovProxyHandler)
    print(f"ClinicalTrials.gov proxy listening on http://{HOST}:{PORT}", flush=True)
    print("Health check: /health", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()

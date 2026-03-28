# Decision Analysis WASM module

This module powers the Decision Analysis WASM backend in NMA Pro.

## Build

```powershell
cd "C:\Users\user\OneDrive - NHS\Documents\NMAhtml\decision-wasm"
rustup target add wasm32-unknown-unknown
cargo build --release --target wasm32-unknown-unknown
```

Output: `target/wasm32-unknown-unknown/release/decision_wasm.wasm`

## Use in the app

- A prebuilt `decision_wasm.wasm` is included in this folder for end users.
- Open `nma-pro-v6.2-optimized.html`.
- Go to **Ranking -> Decision Analysis**.
- Set Backend to **WASM** (or **Auto**).
- Load the `decision_wasm.wasm` file via the **WASM Module** input.

Optional: Run `wasm-opt -O decision_wasm.wasm -o decision_wasm.opt.wasm` for extra speed.

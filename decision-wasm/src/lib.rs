#![no_std]

use core::panic::PanicInfo;

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}

struct XorShift64 {
    state: u64,
}

impl XorShift64 {
    fn new(seed: u64) -> Self {
        let s = if seed == 0 { 0x9e3779b97f4a7c15 } else { seed };
        Self { state: s }
    }

    fn next_u64(&mut self) -> u64 {
        let mut x = self.state;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.state = x;
        x
    }

    fn next_f64(&mut self) -> f64 {
        const SCALE: f64 = 1.0 / ((1u64 << 53) as f64);
        ((self.next_u64() >> 11) as f64) * SCALE
    }
}

fn fast_sqrt(x: f64) -> f64 {
    if x <= 0.0 {
        return 0.0;
    }
    let bits = x.to_bits();
    let mut y = f64::from_bits((bits >> 1) + 0x1ff8_0000_0000_0000);
    for _ in 0..6 {
        y = 0.5 * (y + x / y);
    }
    y
}

fn fast_ln(x: f64) -> f64 {
    if x <= 0.0 {
        return f64::NEG_INFINITY;
    }
    let bits = x.to_bits();
    let exp = ((bits >> 52) & 0x7ff) as i32 - 1023;
    let mant_bits = bits & 0x000f_ffff_ffff_ffff;
    let mant = 1.0 + (mant_bits as f64) * (1.0 / ((1u64 << 52) as f64));
    let y = (mant - 1.0) / (mant + 1.0);
    let y2 = y * y;
    let mut term = y;
    let mut sum = term;
    term *= y2;
    sum += term / 3.0;
    term *= y2;
    sum += term / 5.0;
    term *= y2;
    sum += term / 7.0;
    term *= y2;
    sum += term / 9.0;
    term *= y2;
    sum += term / 11.0;
    term *= y2;
    sum += term / 13.0;
    let ln_mant = 2.0 * sum;
    const LN2: f64 = 0.6931471805599453;
    (exp as f64) * LN2 + ln_mant
}

fn randn(rng: &mut XorShift64) -> f64 {
    loop {
        let u = rng.next_f64() * 2.0 - 1.0;
        let v = rng.next_f64() * 2.0 - 1.0;
        let s = u * u + v * v;
        if s > 0.0 && s < 1.0 {
            let mul = fast_sqrt(-2.0 * fast_ln(s) / s);
            return u * mul;
        }
    }
}

#[no_mangle]
pub extern "C" fn decision_run(
    est_ptr: *const f64,
    l_ptr: *const f64,
    n: u32,
    lower: u32,
    n_sim: u32,
    top_k: u32,
    seed: u32,
    out_prob_ptr: *mut f64,
    out_regret_ptr: *mut f64,
    out_regret2_ptr: *mut f64,
    z_ptr: *mut f64,
    sim_ptr: *mut f64,
    idx_ptr: *mut i32,
) {
    if est_ptr.is_null()
        || l_ptr.is_null()
        || out_prob_ptr.is_null()
        || out_regret_ptr.is_null()
    {
        return;
    }
    let n_usize = n as usize;
    if n_usize == 0 {
        return;
    }
    let p = n_usize.saturating_sub(1);
    let k = core::cmp::min(top_k as usize, n_usize).max(1);
    let n_sim_u = if n_sim == 0 { 1 } else { n_sim } as usize;
    let is_lower = lower != 0;

    unsafe {
        let est = core::slice::from_raw_parts(est_ptr, n_usize);
        let l = core::slice::from_raw_parts(l_ptr, p * p);
        let out_prob = core::slice::from_raw_parts_mut(out_prob_ptr, n_usize);
        let out_regret = core::slice::from_raw_parts_mut(out_regret_ptr, n_usize);
        let out_regret2 = if out_regret2_ptr.is_null() {
            &mut []
        } else {
            core::slice::from_raw_parts_mut(out_regret2_ptr, n_usize)
        };
        let z = if z_ptr.is_null() {
            &mut []
        } else {
            core::slice::from_raw_parts_mut(z_ptr, p)
        };
        let sim = if sim_ptr.is_null() {
            &mut []
        } else {
            core::slice::from_raw_parts_mut(sim_ptr, n_usize)
        };
        let idx = if idx_ptr.is_null() {
            &mut []
        } else {
            core::slice::from_raw_parts_mut(idx_ptr, n_usize)
        };

        for i in 0..n_usize {
            out_prob[i] = 0.0;
            out_regret[i] = 0.0;
            if i < out_regret2.len() {
                out_regret2[i] = 0.0;
            }
        }

        let mut rng = XorShift64::new(seed as u64 ^ 0x9e3779b97f4a7c15);
        for _ in 0..n_sim_u {
            for i in 0..p {
                z[i] = randn(&mut rng);
            }
            sim[0] = 0.0;
            let mut best = sim[0];
            for i in 0..p {
                let mut d = 0.0;
                let row = i * p;
                let mut j = 0;
                while j <= i {
                    d += l[row + j] * z[j];
                    j += 1;
                }
                sim[i + 1] = est[i + 1] + d;
                if is_lower {
                    if sim[i + 1] < best {
                        best = sim[i + 1];
                    }
                } else if sim[i + 1] > best {
                    best = sim[i + 1];
                }
            }

            for i in 0..n_usize {
                idx[i] = i as i32;
            }
            for i in 1..n_usize {
                let key = idx[i];
                let kv = sim[key as usize];
                let mut j = i as i32 - 1;
                if is_lower {
                    while j >= 0 && sim[idx[j as usize] as usize] > kv {
                        idx[(j + 1) as usize] = idx[j as usize];
                        j -= 1;
                    }
                } else {
                    while j >= 0 && sim[idx[j as usize] as usize] < kv {
                        idx[(j + 1) as usize] = idx[j as usize];
                        j -= 1;
                    }
                }
                idx[(j + 1) as usize] = key;
            }

            for i in 0..n_usize {
                let regret = if is_lower { sim[i] - best } else { best - sim[i] };
                if regret > 0.0 {
                    out_regret[i] += regret;
                    if i < out_regret2.len() {
                        out_regret2[i] += regret * regret;
                    }
                }
            }
            for r in 0..k {
                let pos = idx[r] as usize;
                out_prob[pos] += 1.0;
            }
        }

        let inv = 1.0 / (n_sim_u as f64);
        for i in 0..n_usize {
            out_prob[i] *= inv;
            out_regret[i] *= inv;
            if i < out_regret2.len() {
                out_regret2[i] *= inv;
            }
        }
    }
}

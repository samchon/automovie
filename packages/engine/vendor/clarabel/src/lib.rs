//! Synchronous engine ABI for the unmodified published Clarabel 0.11.1 numerical solver.
//!
//! The caller provides the same validated diagonal QP and interval-row CSC used
//! by the current engine. This bridge constructs equivalent conic rows, creates
//! one solver, copies the result, and drops all solver state before returning.
//! The affine-row signs also reconstruct original duals. Geometry, physical
//! units, original-row checks and acceptance stay with the caller.
//!
//! No regularization is added to the authored objective. Clarabel's default
//! regularized KKT factorization and refinement remain upstream-owned. Accuracy
//! settings separate full-accuracy residual and duality-gap criteria. The infinite
//! interval sentinel is the current assembled ABI's 1e30; finite data must be
//! strictly inside it. The cold solver intentionally does not use initial x.
use clarabel::algebra::CscMatrix;
use clarabel::solver::*;
use std::mem;
use std::slice;

/// Allocate an eight-byte aligned caller workspace with an owned capacity header.
/// The returned pointer is separate from every native solver allocation. The
/// matching free recovers its vector allocation after WASM memory growth. Fallible
/// reservation treats capacity overflow and memory exhaustion as the same refusal.
#[no_mangle]
pub unsafe extern "C" fn automovie_alloc(bytes: usize) -> *mut u8 {
    // Divide before adding the header, so even usize::MAX cannot overflow.
    let words = bytes.div_ceil(8) + 1;
    let mut buffer = Vec::<u64>::new();
    if buffer.try_reserve_exact(words).is_err() {
        return std::ptr::null_mut();
    }
    buffer.push(buffer.capacity() as u64);
    buffer.resize(words, 0);
    let base = buffer.as_mut_ptr();
    mem::forget(buffer);
    base.add(1).cast()
}

/// Release only an address returned by automovie_alloc, exactly once.
#[no_mangle]
pub unsafe extern "C" fn automovie_free(pointer: *mut u8) {
    let base = pointer.cast::<u64>().sub(1);
    let capacity = *base as usize;
    drop(Vec::from_raw_parts(base, 0, capacity));
}

/// Borrow admitted wasm32 arrays and copy the native result into caller buffers.
/// API setup errors are positive return codes, distinct from native solve status
/// in info[0]. info also contains iterations, primal/dual residual and primal/
/// dual objectives. A non-Solved native status must never become valid geometry.
#[no_mangle]
pub unsafe extern "C" fn automovie_quadratic_solve(
    n: usize,
    m: usize,
    nonzero: usize,
    _objective_columns: *const usize,
    _objective_rows: *const usize,
    diagonal: *const f64,
    linear: *const f64,
    columns: *const usize,
    rows: *const usize,
    values: *const f64,
    lower: *const f64,
    upper: *const f64,
    _initial: *const f64,
    primal: *mut f64,
    dual: *mut f64,
    info: *mut f64,
) -> i32 {
    if n == 0 {
        return 1;
    }
    let p = slice::from_raw_parts(diagonal, n);
    let q = slice::from_raw_parts(linear, n);
    let col = slice::from_raw_parts(columns, n + 1);
    let row = slice::from_raw_parts(rows, nonzero);
    let val = slice::from_raw_parts(values, nonzero);
    let lo = slice::from_raw_parts(lower, m);
    let hi = slice::from_raw_parts(upper, m);

    // Equalities have free duals (zero cone). Each finite inequality side gets
    // one nonnegative slack and dual. Stable original order resolves row order.
    let mut mapping = Vec::new();
    for i in 0..m {
        if lo[i] == hi[i] {
            mapping.push((i, 1., lo[i]));
        }
    }
    let equalities = mapping.len();
    for i in 0..m {
        if lo[i] == hi[i] {
            continue;
        }
        if hi[i] < 1e30 {
            mapping.push((i, 1., hi[i]));
        }
        if lo[i] > -1e30 {
            mapping.push((i, -1., -lo[i]));
        }
    }
    let mut mapped_rows = vec![Vec::new(); m];
    for (mapped, &(original, sign, _)) in mapping.iter().enumerate() {
        mapped_rows[original].push((mapped, sign));
    }
    let mut starts = vec![0];
    let mut indices = Vec::new();
    let mut coefficients = Vec::new();
    for j in 0..n {
        // Sorting each column is required by CSC. No tiny original coefficient
        // is dropped; both solver admission and final checks see its consequence.
        let mut entries = Vec::new();
        for k in col[j]..col[j + 1] {
            for &(mapped, sign) in &mapped_rows[row[k]] {
                entries.push((mapped, sign * val[k]));
            }
        }
        entries.sort_by_key(|&(mapped, _)| mapped);
        for (mapped, value) in entries {
            indices.push(mapped);
            coefficients.push(value);
        }
        starts.push(indices.len());
    }
    let a = CscMatrix::new(mapping.len(), n, starts, indices, coefficients);
    let hessian = CscMatrix::new(n, n, (0..=n).collect(), (0..n).collect(), p.to_vec());
    let b: Vec<f64> = mapping.iter().map(|&(_, _, bound)| bound).collect();
    let mut cones = Vec::new();
    if equalities > 0 {
        cones.push(ZeroConeT(equalities));
    }
    if mapping.len() > equalities {
        cones.push(NonnegativeConeT(mapping.len() - equalities));
    }
    let settings = DefaultSettings {
        verbose: false,
        max_threads: 1,
        direct_solve_method: "qdldl".to_owned(),
        tol_gap_abs: 1e-9,
        tol_gap_rel: 1e-9,
        tol_feas: 1e-9,
        time_limit: f64::INFINITY,
        ..DefaultSettings::default()
    };
    // Match the public assembled domain. Clarabel defaults to 1e20 and would
    // otherwise remove valid finite interval sides between 1e20 and 1e30.
    clarabel::set_infinity(1e30);
    // Dimensions are constructed together above and settings are fixed. The
    // upstream Result only rejects inconsistent dimensions/settings here; such
    // a failure is an internal bridge defect, not numerical infeasibility.
    let mut solver = DefaultSolver::new(&hessian, q, &a, &b, &cones, settings)
        .expect("Bridge constructs consistent conic dimensions and settings");
    solver.solve();
    let result = &solver.solution;
    slice::from_raw_parts_mut(primal, n).copy_from_slice(&result.x);
    let original_dual = slice::from_raw_parts_mut(dual, m);
    original_dual.fill(0.);
    for (&(original, sign, _), value) in mapping.iter().zip(&result.z) {
        original_dual[original] += sign * value;
    }
    slice::from_raw_parts_mut(info, 6).copy_from_slice(&[
        result.status as i32 as f64,
        result.iterations as f64,
        result.r_prim,
        result.r_dual,
        result.obj_val,
        result.obj_val_dual,
    ]);
    0
}

# Constrained-displacement numerical kernel

The engine calls unmodified [Clarabel.rs 0.11.1](https://github.com/oxfordcontrol/Clarabel.rs/tree/v0.11.1) through `src/lib.rs`. Its homogeneous-embedding interior-point method directly supports a convex quadratic objective, as described by [Goulart and Chen (2024)](https://arxiv.org/abs/2405.12762). `Cargo.lock` pins every dependency and registry checksum; the upstream tag resolves to `25540f559592068d0c8a80e46ded1b21760212a1`.

## Equivalent problem and acceptance

The TypeScript adapter supplies `min 1/2 x' diag(P) x + q' x` with interval rows `lower <= A x <= upper`. An equality becomes a zero-cone row. A finite upper side becomes `A x + s = upper`, and a finite lower side becomes `-A x + s = -lower`, each with nonnegative slack. Original-row duals are the signed sum of the corresponding conic duals. No tiny coefficient, geometric constraint or objective term is dropped by this bridge.

Each call creates and destroys its own solver, using Float64 arithmetic, QDLDL, one thread, and `tol_gap_abs`, `tol_gap_rel`, `tol_feas` of `1e-9`. Gap and coordinate accuracy differ: for a positive diagonal objective, feasible primal `x` and dual lower bound `d` give `sum(P_i * (x_i - x*_i)^2) <= 2 * (f(x) - d)`. The bounded-displacement consumer analytically eliminates variables absent from its selected affine rows: their positive diagonal, zero linear cost and nonnegative interval give the exact minimizer zero. It then checks every original row, including inactive rows that may become violated. Tiny nonzero coefficients remain coupled. Native KKT regularization and iterative refinement retain their upstream defaults; the authored objective is unchanged. The infinity sentinel is explicitly `1e30`, matching the admitted TypeScript domain. An optional initial vector is accepted for compatibility and ignored by the cold solver.

Native status `1` is `Solved`; `2` and `3` indicate primal and dual infeasibility; `4` is `AlmostSolved` and is not accepted by geometric consumers. API refusal is a separate negative status. Diagnostics retain primal and dual objectives, native residuals and iterations. The adapter independently computes original-row feasibility and stationarity; mesh consumers retain their own physical tolerance, motion caps, Float32/export checks and failure behavior. Numerical convergence does not establish anatomical validity.

The engine's WASI host supplies only a logical diagnostic clock, zero entropy and an empty environment. Files and process exit are unavailable. The solver has no time limit, timing is not returned, and no host randomness or wall clock enters its result. Heap views refresh after growth; outputs are copied before the owned workspace is released.

## Rebuild

Install Rust 1.90.0 and its `wasm32-wasip1` target, plus CMake 3.19 or newer. From the repository root:

```sh
rustup toolchain install 1.90.0 --profile minimal --target wasm32-wasip1
cmake -DBUILD_DIR=/absolute/path/to/disposable/clarabel-build -P packages/engine/vendor/clarabel/build.cmake
```

The script compiles the locked crate and regenerates `src/math/quadraticKernelBytes.json` with bridge, lockfile and binary digests. `Cargo.toml` owns optimization settings; the script owns the 4 MiB stack and disabled SIMD. Normal package builds use the committed bytes and do not fetch Rust, crates or a native executable. Rebuilding requires reviewing the generated provenance and repeating independent optima, nearly parallel constraints, failure/recovery, Node/browser determinism and actual geometry/export comparisons.

## Provenance and prior comparison

`licenses/inventory.json` records the locked dependency licenses; the adjacent directories preserve upstream license/notice wording, including Rust runtime notices, with trailing whitespace normalized. Clarabel is Apache 2.0 and the AMD ordering crate is BSD 3-Clause; the dependency inventory states each other license. AutoMovie's bridge, host and build recipe are MIT under the engine's license.

The earlier OSQP implementation and its build recipe remain in [the comparison source](../quadratic/README.md). Its generated output goes only to its chosen build directory. The shared-method investigation and independently derived nearly parallel constraint family belong to [issue #2498](https://github.com/samchon/AutoMovie/issues/2498); unsuccessful candidates remain research evidence. Neither a successful solve nor more exported documents is a likeness or full-face review verdict.

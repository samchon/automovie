import { HumanQuadraticCholesky } from "./HumanQuadraticCholesky";

/**
 * The linear algebra of `HumanQuadraticProgram`'s OSQP solve on a banded
 * problem: the banded reduced KKT system and
 * its Cholesky factor, the unscaled residuals, the primal infeasibility
 * certificate and the polishing solve on the active set (Stellato et al.
 * 2020, Math Program Comput 12:637, sections 3.4, 4 and 5.1).
 * Costs use w=band+1, S supplied curvature entries, Z stored row entries
 * and m rows; a row r stores k_r entries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the banded OSQP algebra, scaled input contract, residuals, infeasibility certificate and active-set polish.
 * @evidence contracts/development/design.md#principled-representation Groups scaled quadratic data and residual diagnostics for the reduced OSQP systems; finite admitted data and convex curvature are supplied by the solver and its callers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes only algebra consumed by HumanQuadraticProgram and its numeric preparation; no action vocabulary or external solver interface is added.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeps generic band and sparse-row data, including duplicates and empty rows; the existing Cholesky diagonal floor is a stated numerical guard rather than a convexity validator.
 */
export namespace HumanQuadraticBand {
  /**
   * Equilibrated data: `P̄ = c D P D`, `q̄ = c D q`, `Ā = E A D`,
   * `l̄ = E l`, `ū = E u`, and soft weight `c w / E`.
   *
   * @evidence contracts/development/design.md#principled-representation Stores an upper-band symmetric P, ordered CSR rows and positive D/E/c transformations; Preparation admits finite matrices and preserves absent infinite bounds, while types alone cannot enforce dimensions or convexity.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supplies exactly the matrices, row intervals, penalties and scales used by the existing ADMM, certificate and polish readers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Retains generic dimensions and CSR duplicates without a body category; -1 is the existing hard-row sentinel, and callers treat shared numeric core arrays as read-only.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the scaling equations, compression offsets, hard-weight sentinel and the purpose of each numeric member.
   */
  export interface IScaled {
    /** The variables. */
    n: number;

    /** The rows. */
    m: number;

    /** The half-bandwidth. */
    band: number;

    /** The scaled curvature's band. */
    p: Float64Array[];

    /** The scaled linear term. */
    q: Float64Array;

    /** Each row's first entry, compressed; `start[m]` is the entries' count. */
    start: Int32Array;

    /** Each entry's variable. */
    cols: Int32Array;

    /** Each entry's scaled coefficient. */
    vals: Float64Array;

    /** Each row's scaled lower end. */
    lo: Float64Array;

    /** Each row's scaled upper end. */
    hi: Float64Array;

    /** Each soft row's scaled weight; -1 for a hard row. */
    weight: Float64Array;

    /** The variables' scaling `D`. */
    d: Float64Array;

    /** The rows' scaling `E`. */
    e: Float64Array;

    /** The cost's scaling. */
    c: number;
  }

  /**
   * Infinity-norm residuals and their normalization scales, in both original
   * and equilibrated units. The solver rejects nonfinite iteration values.
   *
   * @evidence contracts/development/design.md#principled-representation Separates original-unit primal/dual residuals from scaled ones and records each normalization magnitude; numeric finiteness remains a runtime solver check.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contains the eight values the existing termination, polishing acceptance and adaptive-rho decisions read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the same infinity norms for all dimensions and actions without invented physical tolerances or fixture-specific fields.
   * @evidence contracts/development/common.md#meaningful-documentation States every residual equation, its units and normalization, and which solver decision consumes it.
   */
  export interface IResiduals {
    /** The unscaled primal residual `‖Ax - z‖∞`. */
    primal: number;

    /** Its scale, `max(‖Ax‖∞, ‖z‖∞)`. */
    primalScale: number;

    /** The unscaled dual residual `‖Px + q + Aᵀy‖∞`. */
    dual: number;

    /** Its scale, `max(‖Px‖∞, ‖Aᵀy‖∞, ‖q‖∞)`. */
    dualScale: number;

    /** The scaled primal residual. */
    scaledPrimal: number;

    /** Its scale. */
    scaledPrimalScale: number;

    /** The scaled dual residual. */
    scaledDual: number;

    /** Its scale. */
    scaledDualScale: number;
  }

  /**
   * The Cholesky factor of the reduced step system `P̄ + σI + Āᵀ diag(ρ) Ā`.
   *
   * @param s The scaled problem.
   * @param rho Each row's step size.
   * @param sigma The proximal term.
   * @returns The factor.
   * @throws {Error} When a row couples variables beyond the band.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Forms the cited indirect OSQP reduced system and banded Cholesky factor; convex P and positive rho/sigma are caller premises, with the existing diagonal guard documented by HumanQuadraticCholesky.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Copies curvature, adds the proximal diagonal and row outer products, then delegates the triangular factorization to one helper.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves all row contributions, including duplicate indices, and the band-coupling rejection; no threshold or physical tolerance changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Assembly takes O(S+n+sum(k_r*k_r)) time, including supplied trailing curvature storage; Cholesky takes O(n*w*w), with O(S+n*w) copied-system and factor storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Preparation may retain the initial factor for identical scaled matrices/rho/sigma; this primitive always builds a fresh factor for requested changed or adaptive systems.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates a copied system and returned factor; the caller owns the factor, and the temporary system becomes unreachable after the call.
   * @evidence contracts/development/common.md#meaningful-documentation Gives the matrix equation, parameter roles, band failure and convex-data premise.
   */
  export function factor(
    s: IScaled,
    rho: Float64Array,
    sigma: number,
  ): Float64Array[] {
    const k: Float64Array[] = s.p.map(
      (row: Float64Array): Float64Array => Float64Array.from(row),
    );
    for (let i: number = 0; i < s.n; ++i) k[i]![0] = k[i]![0]! + sigma;
    for (let r: number = 0; r < s.m; ++r) add(s, k, r, rho[r]!);
    return HumanQuadraticCholesky(k, s.n, s.band);
  }

  /**
   * Solve `L Lᵀ x = b` into `x`.
   *
   * @param l The factor.
   * @param n The size.
   * @param band The half-bandwidth.
   * @param b The right-hand side.
   * @param x The solution.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses forward and backward triangular substitution for the supplied finite nonsingular Cholesky factor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two band-limited sweeps solve L then its transpose directly into the caller's destination.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Solves every in-band contribution without dropping coefficients or changing precision thresholds; valid dimensions and factor remain internal caller premises.
   * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(n*w) time, including diagonal systems, and O(1) auxiliary storage beyond the supplied destination.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads an unchanged factor across ADMM or refinement right-hand sides and never mutates that factor.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates no arrays and retains nothing; only the caller-owned output x is changed.
   * @evidence contracts/development/common.md#meaningful-documentation States the factored equation, band layout, input-factor premise and destination mutation.
   */
  export function substitute(
    l: Float64Array[],
    n: number,
    band: number,
    b: Float64Array,
    x: Float64Array,
  ): void {
    for (let i: number = 0; i < n; ++i) {
      let v: number = b[i]!;
      for (let t: number = Math.max(0, i - band); t < i; ++t)
        v -= l[i]![i - t]! * x[t]!;
      x[i] = v / l[i]![0]!;
    }
    for (let i: number = n - 1; i >= 0; --i) {
      let v: number = x[i]!;
      for (let t: number = i + 1; t <= Math.min(n - 1, i + band); ++t)
        v -= l[t]![t - i]! * x[t]!;
      x[i] = v / l[i]![0]!;
    }
  }

  /**
   * The residuals of an iterate of the scaled problem (section 3.4): the
   * primal `‖Ax - z‖∞` and the dual `‖Px + q + Aᵀy‖∞` of the unscaled
   * problem with the scales the termination test reads, and the same of the
   * scaled problem, which the step size balances.
   *
   * @param s The scaled problem.
   * @param x The scaled variables.
   * @param z The scaled row values.
   * @param y The scaled multipliers.
   * @returns The residuals.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the cited primal Ax-z and dual Px+q+A-transpose-y infinity norms and reverses D/E/c scaling for the original-unit termination check.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Accumulates row products and transpose contributions, then curvature products and both sets of residual scales.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads all stored entries in their original nonzero order and uses the current unscaled and scaled infinity norms without dimension dilution.
   * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(Z+m+n*w) time and O(n) auxiliary vector storage; supplied curvature entries outside the in-range band are not read by this product.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the prepared read-only matrices but recomputes products because x/z/y change at every residual check.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The transpose and curvature work vectors live only for the call; the caller receives one fixed-size diagnostic object.
   * @evidence contracts/development/common.md#meaningful-documentation Defines both residual equations, the unit reversal and the normalization values used by termination and rho adaptation.
   */
  export function residuals(
    s: IScaled,
    x: Float64Array,
    z: Float64Array,
    y: Float64Array,
  ): IResiduals {
    const out: IResiduals = {
      primal: 0,
      primalScale: 0,
      dual: 0,
      dualScale: 0,
      scaledPrimal: 0,
      scaledPrimalScale: 0,
      scaledDual: 0,
      scaledDualScale: 0,
    };
    const aty: Float64Array = new Float64Array(s.n);
    for (let r: number = 0; r < s.m; ++r) {
      let ax: number = 0;
      for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a) {
        ax += s.vals[a]! * x[s.cols[a]!]!;
        aty[s.cols[a]!] = aty[s.cols[a]!]! + s.vals[a]! * y[r]!;
      }
      const e: number = s.e[r]!;
      out.scaledPrimal = Math.max(out.scaledPrimal, Math.abs(ax - z[r]!));
      out.scaledPrimalScale = Math.max(
        out.scaledPrimalScale,
        Math.abs(ax),
        Math.abs(z[r]!),
      );
      out.primal = Math.max(out.primal, Math.abs((ax - z[r]!) / e));
      out.primalScale = Math.max(
        out.primalScale,
        Math.abs(ax / e),
        Math.abs(z[r]! / e),
      );
    }
    const px: Float64Array = curvature(s, x);
    for (let i: number = 0; i < s.n; ++i) {
      const unscale: number = 1 / (s.c * s.d[i]!);
      const r: number = px[i]! + s.q[i]! + aty[i]!;
      out.scaledDual = Math.max(out.scaledDual, Math.abs(r));
      out.scaledDualScale = Math.max(
        out.scaledDualScale,
        Math.abs(px[i]!),
        Math.abs(aty[i]!),
        Math.abs(s.q[i]!),
      );
      out.dual = Math.max(out.dual, Math.abs(r * unscale));
      out.dualScale = Math.max(
        out.dualScale,
        Math.abs(px[i]! * unscale),
        Math.abs(aty[i]! * unscale),
        Math.abs(s.q[i]! * unscale),
      );
    }
    return out;
  }

  /**
   * Whether the multipliers' last change certifies the hard rows primal
   * infeasible (section 3.4): `δy` with `‖Aᵀδy‖∞ <= ε ‖δy‖∞` and
   * `uᵀ max(δy, 0) + lᵀ min(δy, 0) < -ε ‖δy‖∞`, read unscaled. A soft row
   * is never infeasible, so it is left out.
   *
   * @param s The scaled problem.
   * @param y The scaled multipliers.
   * @param before Their values one iteration before.
   * @param epsilon The certificate's tolerance.
   * @returns Whether the rows are certified infeasible.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Tests the cited primal-infeasibility certificate on original-unit hard-row multiplier changes, with the support function of each possibly unbounded interval.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds the hard-row delta and its support, rejects a missing separating direction, then checks its transpose product norm.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Excludes soft rows because their penalties permit interval violations; keeps the existing epsilon and honest infinite-bound support behavior.
   * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(rows plus stored entries plus n) time and O(rows plus n) temporary vector storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads shared matrices but uses this iteration's y and before, so a certificate is not reused for changed iterates or intervals.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Delta and transpose vectors become unreachable on return; only a boolean escapes.
   * @evidence contracts/development/common.md#meaningful-documentation States the certificate inequalities, original units, soft-row exclusion and behavior for absent bounds or a zero direction.
   */
  export function infeasible(
    s: IScaled,
    y: Float64Array,
    before: Float64Array,
    epsilon: number,
  ): boolean {
    const delta: Float64Array = new Float64Array(s.m);
    let size: number = 0;
    let support: number = 0;
    for (let r: number = 0; r < s.m; ++r) {
      if (s.weight[r]! >= 0) continue;
      const v: number = (s.e[r]! * (y[r]! - before[r]!)) / s.c;
      delta[r] = v;
      size = Math.max(size, Math.abs(v));
      const u: number = s.hi[r]! / s.e[r]!;
      const l: number = s.lo[r]! / s.e[r]!;
      if (v > 0) support += u === Infinity ? Infinity : u * v;
      else if (v < 0) support += l === -Infinity ? Infinity : l * v;
    }
    if (!(size > 0) || !(support < -epsilon * size)) return false;
    // Aᵀδy unscaled: D⁻¹ Āᵀ E⁻¹ δy.
    const aty: Float64Array = new Float64Array(s.n);
    for (let r: number = 0; r < s.m; ++r)
      for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a)
        aty[s.cols[a]!] = aty[s.cols[a]!]! + (s.vals[a]! * delta[r]!) / s.e[r]!;
    let norm: number = 0;
    for (let i: number = 0; i < s.n; ++i)
      norm = Math.max(norm, Math.abs(aty[i]! / s.d[i]!));
    return norm <= epsilon * size;
  }

  /**
   * The solution polished on its active set (section 4): the rows held on a
   * bound (a hard row whose value and multiplier say so, a soft row resting
   * on its bound with its multiplier below its weight) as equalities, a soft
   * row past its bound with its multiplier fixed at its weight, every other
   * row free; the KKT system of those rows, regularised by `δ`, solved in
   * its banded reduced form and refined `refine` times toward the system
   * without it.
   *
   * @param s The scaled problem.
   * @param z The scaled row values.
   * @param y The scaled multipliers.
   * @param delta The regularisation.
   * @param refine The refinement steps.
   * @returns The polished iterates, scaled.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Implements the cited active-set regularized KKT solve and iterative refinement; the outer solver accepts its result only when the original residual checks permit it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Selects bound rows and fixed soft multipliers, factors their reduced system once, then shares that factor across the initial solve and refinement passes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps existing delta, active-row rules and refinement count; the Cholesky diagonal guard is retained and a polish is not itself a success certificate.
   * @evidence contracts/development/implementation.md#efficient-algorithms Assembly takes O(S+n+sum(active k_r*k_r)), factorization O(n*w*w), and each refinement O(n*w+Z+m); working storage is O(S+n*w+n+m), including supplied curvature padding.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses one active-system factor for every refinement right-hand side; each new polish recomputes its active set from current bounds, penalties and iterates.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources All active-set and factor work is call-local; newly allocated x/z/y escape to the solver for admission and no history is retained here.
   * @evidence contracts/development/common.md#meaningful-documentation Describes hard and soft active rows, regularized reduction, iterative refinement, scaled outputs and outer acceptance ownership.
   */
  export function polish(
    s: IScaled,
    z: Float64Array,
    y: Float64Array,
    delta: number,
    refine: number,
  ): { x: Float64Array; z: Float64Array; y: Float64Array } {
    const active: number[] = [];
    const bound: number[] = [];
    const fixed: Float64Array = new Float64Array(s.m);
    for (let r: number = 0; r < s.m; ++r) {
      const l: number = s.lo[r]!;
      const u: number = s.hi[r]!;
      const w: number = s.weight[r]!;
      if (w < 0) {
        if (l === u || z[r]! - l < -y[r]!) {
          active.push(r);
          bound.push(l);
        } else if (u - z[r]! < y[r]!) {
          active.push(r);
          bound.push(u);
        }
      } else if (z[r]! > l && z[r]! < u) continue;
      else if (Math.abs(y[r]!) < w && [l, u].includes(z[r]!)) {
        active.push(r);
        bound.push(z[r]!);
      } else fixed[r] = Math.sign(y[r]!) * w;
    }
    // The reduced system P̄ + δI + Σ āᵢ āᵢᵀ / δ over the active rows.
    const k: Float64Array[] = s.p.map(
      (row: Float64Array): Float64Array => Float64Array.from(row),
    );
    for (let i: number = 0; i < s.n; ++i) k[i]![0] = k[i]![0]! + delta;
    for (const r of active) add(s, k, r, 1 / delta);
    const l: Float64Array[] = HumanQuadraticCholesky(k, s.n, s.band);
    // The right-hand side: -q̄ less the fixed multipliers' rows.
    const rhs: Float64Array = new Float64Array(s.n);
    for (let i: number = 0; i < s.n; ++i) rhs[i] = -s.q[i]!;
    for (let r: number = 0; r < s.m; ++r)
      if (fixed[r] !== 0)
        for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a)
          rhs[s.cols[a]!] = rhs[s.cols[a]!]! - s.vals[a]! * fixed[r]!;
    const dot: (r: number, v: Float64Array) => number = (
      r: number,
      v: Float64Array,
    ): number => {
      let out: number = 0;
      for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a)
        out += s.vals[a]! * v[s.cols[a]!]!;
      return out;
    };
    // The regularised KKT system [P̄ + δI, Āᵀ; Ā, -δI] [Δx; Δy] = [r₁; r₂],
    // reduced: Δy = (Ā Δx - r₂) / δ.
    const xs: Float64Array = new Float64Array(s.n);
    const ys: Float64Array = new Float64Array(active.length);
    const step: (r1: Float64Array, r2: Float64Array) => void = (
      r1: Float64Array,
      r2: Float64Array,
    ): void => {
      const b: Float64Array = Float64Array.from(r1);
      active.forEach((r: number, j: number): void => {
        for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a)
          b[s.cols[a]!] = b[s.cols[a]!]! + (s.vals[a]! * r2[j]!) / delta;
      });
      const dx: Float64Array = new Float64Array(s.n);
      substitute(l, s.n, s.band, b, dx);
      for (let i: number = 0; i < s.n; ++i) xs[i] = xs[i]! + dx[i]!;
      active.forEach((r: number, j: number): void => {
        ys[j] = ys[j]! + (dot(r, dx) - r2[j]!) / delta;
      });
    };
    step(rhs, Float64Array.from(bound));
    // Iterative refinement toward the unregularised system.
    for (let pass: number = 0; pass < refine; ++pass) {
      const px: Float64Array = curvature(s, xs);
      const r1: Float64Array = new Float64Array(s.n);
      for (let i: number = 0; i < s.n; ++i) r1[i] = rhs[i]! - px[i]!;
      active.forEach((r: number, j: number): void => {
        for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a)
          r1[s.cols[a]!] = r1[s.cols[a]!]! - s.vals[a]! * ys[j]!;
      });
      const r2: Float64Array = Float64Array.from(
        active,
        (r: number, j: number): number => bound[j]! - dot(r, xs),
      );
      step(r1, r2);
    }
    const zs: Float64Array = new Float64Array(s.m);
    const yo: Float64Array = Float64Array.from(fixed);
    for (let r: number = 0; r < s.m; ++r) {
      const v: number = dot(r, xs);
      zs[r] = s.weight[r]! < 0 ? Math.min(s.hi[r]!, Math.max(s.lo[r]!, v)) : v;
    }
    active.forEach((r: number, j: number): void => {
      yo[r] = ys[j]!;
    });
    return { x: xs, z: zs, y: yo };
  }
}

/**
 * Add `w ā āᵀ` of a row to a banded system.
 *
 * Accumulates the symmetric row outer product in the stored upper band, including cross products of duplicate variable indices.
 * One ordered pair loop owns the sparse-row contribution shared by ADMM factorization and polishing.
 * Preserves entry order and all products; rejects coupling beyond the declared band instead of dropping it.
 * Takes O(k squared) time for k entries in this row and O(1) auxiliary storage.
 * Both factor builders call the same outer-product owner with their current row weight; no product is cached for a changed weight.
 * Mutates only the caller's banded system and retains no row or matrix.
 * States the outer-product operation and the band, ordering and destination-mutation invariants.
 */
function add(
  s: HumanQuadraticBand.IScaled,
  k: Float64Array[],
  r: number,
  w: number,
): void {
  for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a)
    for (let b: number = s.start[r]!; b < s.start[r + 1]!; ++b) {
      const i: number = s.cols[a]!;
      const j: number = s.cols[b]!;
      if (j < i) continue;
      if (j - i > s.band)
        throw new Error("A row couples variables beyond the band");
      k[i]![j - i] = k[i]![j - i]! + w * s.vals[a]! * s.vals[b]!;
    }
}

/**
 * P̄ x for the banded scaled curvature.
 *
 * Multiplies the symmetric matrix by reading each upper-band entry and adding both symmetric contributions.
 * A single band traversal supplies the curvature product to residual and polishing readers.
 * Uses every in-range band entry without a magnitude cutoff or diagonal approximation.
 * Takes O(n*w) time and one O(n) output vector, reading only in-range band entries.
 * Shares the matrix representation while recomputing the product for each current iterate.
 * Returns one caller-owned vector and retains no input or output.
 * Names the scaled symmetric product and its upper-band traversal.
 */
function curvature(
  s: HumanQuadraticBand.IScaled,
  x: Float64Array,
): Float64Array {
  const out: Float64Array = new Float64Array(s.n);
  for (let i: number = 0; i < s.n; ++i) {
    out[i] = out[i]! + s.p[i]![0]! * x[i]!;
    for (let j: number = 1; j <= s.band && i + j < s.n; ++j) {
      out[i] = out[i]! + s.p[i]![j]! * x[i + j]!;
      out[i + j] = out[i + j]! + s.p[i]![j]! * x[i]!;
    }
  }
  return out;
}

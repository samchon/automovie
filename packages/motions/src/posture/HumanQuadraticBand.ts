import type { HumanQuadraticProgram } from "./HumanQuadraticProgram";

/**
 * The linear algebra of `HumanQuadraticProgram`'s OSQP solve on a banded
 * problem: its modified Ruiz equilibration, the banded reduced KKT system and
 * its Cholesky factor, the unscaled residuals, the primal infeasibility
 * certificate and the polishing solve on the active set (Stellato et al.
 * 2020, Math Program Comput 12:637, sections 3.4, 4 and 5.1).
 */
export namespace HumanQuadraticBand {
  /** The problem equilibrated: `P̄ = c D P D`, `q̄ = c D q`, `Ā = E A D`, `l̄ = E l`, `ū = E u`, a soft row's weight `c w / E`. */
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

  /** The residuals of an iterate: unscaled with their scales, for the termination test, and scaled with theirs, for the step size. */
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
   * The problem compressed and equilibrated by the modified Ruiz scaling of
   * the KKT matrix `[P Aᵀ; A 0]` (section 5.1, algorithm 2): `SCALING`
   * passes, each scaling every column of the KKT matrix by the inverse
   * square root of its infinity norm, then the cost by the inverse of the
   * larger of the curvature's mean column norm and the linear term's norm,
   * each norm held within `[MIN_SCALE, MAX_SCALE]`.
   *
   * @param problem The problem.
   * @returns The scaled problem.
   */
  export function scaled(problem: HumanQuadraticProgram.IProblem): IScaled {
    const n: number = problem.n;
    const band: number = problem.band;
    const rows = problem.rows;
    const m: number = rows.length;
    let nnz: number = 0;
    for (const row of rows) nnz += row.index.length;
    const start: Int32Array = new Int32Array(m + 1);
    const cols: Int32Array = new Int32Array(nnz);
    const vals: Float64Array = new Float64Array(nnz);
    let at: number = 0;
    rows.forEach((row, r: number): void => {
      start[r] = at;
      for (let a: number = 0; a < row.index.length; ++a) {
        cols[at] = row.index[a]!;
        vals[at] = row.coef[a]!;
        ++at;
      }
    });
    start[m] = at;
    const p: Float64Array[] = problem.p.map((row: Float64Array): Float64Array => Float64Array.from(row));
    const q: Float64Array = Float64Array.from(problem.q);
    const d: Float64Array = new Float64Array(n).fill(1);
    const e: Float64Array = new Float64Array(m).fill(1);
    let c: number = 1;
    const limit = (v: number): number => (v < MIN_SCALE ? 1 : Math.min(v, MAX_SCALE));
    const dx: Float64Array = new Float64Array(n);
    const dr: Float64Array = new Float64Array(m);
    const curvature: Float64Array = new Float64Array(n);
    for (let pass: number = 0; pass < SCALING; ++pass) {
      // The KKT matrix's column norms: the curvature's and the rows' for a
      // variable, the row's own for a row.
      curvature.fill(0);
      for (let i: number = 0; i < n; ++i)
        for (let j: number = 0; j <= band && i + j < n; ++j) {
          const v: number = Math.abs(p[i]![j]!);
          curvature[i] = Math.max(curvature[i]!, v);
          curvature[i + j] = Math.max(curvature[i + j]!, v);
        }
      dx.set(curvature);
      for (let r: number = 0; r < m; ++r) {
        let row: number = 0;
        for (let a: number = start[r]!; a < start[r + 1]!; ++a) {
          const v: number = Math.abs(vals[a]!);
          row = Math.max(row, v);
          dx[cols[a]!] = Math.max(dx[cols[a]!]!, v);
        }
        dr[r] = 1 / Math.sqrt(limit(row));
      }
      for (let i: number = 0; i < n; ++i) dx[i] = 1 / Math.sqrt(limit(dx[i]!));
      for (let i: number = 0; i < n; ++i) {
        for (let j: number = 0; j <= band && i + j < n; ++j) p[i]![j] = p[i]![j]! * dx[i]! * dx[i + j]!;
        q[i] = q[i]! * dx[i]!;
        d[i] = d[i]! * dx[i]!;
      }
      for (let r: number = 0; r < m; ++r) {
        for (let a: number = start[r]!; a < start[r + 1]!; ++a) vals[a] = vals[a]! * dr[r]! * dx[cols[a]!]!;
        e[r] = e[r]! * dr[r]!;
      }
      // The cost scaled by the larger of its curvature's mean column norm
      // and its linear term's norm.
      curvature.fill(0);
      for (let i: number = 0; i < n; ++i)
        for (let j: number = 0; j <= band && i + j < n; ++j) {
          const v: number = Math.abs(p[i]![j]!);
          curvature[i] = Math.max(curvature[i]!, v);
          curvature[i + j] = Math.max(curvature[i + j]!, v);
        }
      let mean: number = 0;
      for (let i: number = 0; i < n; ++i) mean += curvature[i]!;
      mean /= Math.max(1, n);
      let linear: number = 0;
      for (let i: number = 0; i < n; ++i) linear = Math.max(linear, Math.abs(q[i]!));
      const gamma: number = 1 / limit(Math.max(mean, linear));
      for (let i: number = 0; i < n; ++i) {
        for (let j: number = 0; j <= band && i + j < n; ++j) p[i]![j] = p[i]![j]! * gamma;
        q[i] = q[i]! * gamma;
      }
      c *= gamma;
    }
    const lo: Float64Array = new Float64Array(m);
    const hi: Float64Array = new Float64Array(m);
    const weight: Float64Array = new Float64Array(m);
    rows.forEach((row, r: number): void => {
      lo[r] = row.l * e[r]!;
      hi[r] = row.u * e[r]!;
      weight[r] = row.weight === undefined ? -1 : (c * row.weight) / e[r]!;
    });
    return { n, m, band, p, q, start, cols, vals, lo, hi, weight, d, e, c };
  }

  /**
   * The Cholesky factor of the reduced step system `P̄ + σI + Āᵀ diag(ρ) Ā`.
   *
   * @param s The scaled problem.
   * @param rho Each row's step size.
   * @param sigma The proximal term.
   * @returns The factor.
   * @throws {Error} When a row couples variables beyond the band.
   */
  export function factor(s: IScaled, rho: Float64Array, sigma: number): Float64Array[] {
    const k: Float64Array[] = s.p.map((row: Float64Array): Float64Array => Float64Array.from(row));
    for (let i: number = 0; i < s.n; ++i) k[i]![0] = k[i]![0]! + sigma;
    for (let r: number = 0; r < s.m; ++r) add(s, k, r, rho[r]!);
    return cholesky(k, s.n, s.band);
  }

  /**
   * Solve `L Lᵀ x = b` into `x`.
   *
   * @param l The factor.
   * @param n The size.
   * @param band The half-bandwidth.
   * @param b The right-hand side.
   * @param x The solution.
   */
  export function substitute(l: Float64Array[], n: number, band: number, b: Float64Array, x: Float64Array): void {
    for (let i: number = 0; i < n; ++i) {
      let v: number = b[i]!;
      for (let t: number = Math.max(0, i - band); t < i; ++t) v -= l[i]![i - t]! * x[t]!;
      x[i] = v / l[i]![0]!;
    }
    for (let i: number = n - 1; i >= 0; --i) {
      let v: number = x[i]!;
      for (let t: number = i + 1; t <= Math.min(n - 1, i + band); ++t) v -= l[t]![t - i]! * x[t]!;
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
   */
  export function residuals(s: IScaled, x: Float64Array, z: Float64Array, y: Float64Array): IResiduals {
    const out: IResiduals = { primal: 0, primalScale: 0, dual: 0, dualScale: 0, scaledPrimal: 0, scaledPrimalScale: 0, scaledDual: 0, scaledDualScale: 0 };
    const aty: Float64Array = new Float64Array(s.n);
    for (let r: number = 0; r < s.m; ++r) {
      let ax: number = 0;
      for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a) {
        ax += s.vals[a]! * x[s.cols[a]!]!;
        aty[s.cols[a]!] = aty[s.cols[a]!]! + s.vals[a]! * y[r]!;
      }
      const e: number = s.e[r]!;
      out.scaledPrimal = Math.max(out.scaledPrimal, Math.abs(ax - z[r]!));
      out.scaledPrimalScale = Math.max(out.scaledPrimalScale, Math.abs(ax), Math.abs(z[r]!));
      out.primal = Math.max(out.primal, Math.abs((ax - z[r]!) / e));
      out.primalScale = Math.max(out.primalScale, Math.abs(ax / e), Math.abs(z[r]! / e));
    }
    const px: Float64Array = curvature(s, x);
    for (let i: number = 0; i < s.n; ++i) {
      const unscale: number = 1 / (s.c * s.d[i]!);
      const r: number = px[i]! + s.q[i]! + aty[i]!;
      out.scaledDual = Math.max(out.scaledDual, Math.abs(r));
      out.scaledDualScale = Math.max(out.scaledDualScale, Math.abs(px[i]!), Math.abs(aty[i]!), Math.abs(s.q[i]!));
      out.dual = Math.max(out.dual, Math.abs(r * unscale));
      out.dualScale = Math.max(out.dualScale, Math.abs(px[i]! * unscale), Math.abs(aty[i]! * unscale), Math.abs(s.q[i]! * unscale));
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
   */
  export function infeasible(s: IScaled, y: Float64Array, before: Float64Array, epsilon: number): boolean {
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
      for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a) aty[s.cols[a]!] = aty[s.cols[a]!]! + (s.vals[a]! * delta[r]!) / s.e[r]!;
    let norm: number = 0;
    for (let i: number = 0; i < s.n; ++i) norm = Math.max(norm, Math.abs(aty[i]! / s.d[i]!));
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
    const k: Float64Array[] = s.p.map((row: Float64Array): Float64Array => Float64Array.from(row));
    for (let i: number = 0; i < s.n; ++i) k[i]![0] = k[i]![0]! + delta;
    for (const r of active) add(s, k, r, 1 / delta);
    const l: Float64Array[] = cholesky(k, s.n, s.band);
    // The right-hand side: -q̄ less the fixed multipliers' rows.
    const rhs: Float64Array = new Float64Array(s.n);
    for (let i: number = 0; i < s.n; ++i) rhs[i] = -s.q[i]!;
    for (let r: number = 0; r < s.m; ++r)
      if (fixed[r] !== 0) for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a) rhs[s.cols[a]!] = rhs[s.cols[a]!]! - s.vals[a]! * fixed[r]!;
    const dot = (r: number, v: Float64Array): number => {
      let out: number = 0;
      for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a) out += s.vals[a]! * v[s.cols[a]!]!;
      return out;
    };
    // The regularised KKT system [P̄ + δI, Āᵀ; Ā, -δI] [Δx; Δy] = [r₁; r₂],
    // reduced: Δy = (Ā Δx - r₂) / δ.
    const xs: Float64Array = new Float64Array(s.n);
    const ys: Float64Array = new Float64Array(active.length);
    const step = (r1: Float64Array, r2: Float64Array): void => {
      const b: Float64Array = Float64Array.from(r1);
      active.forEach((r: number, j: number): void => {
        for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a) b[s.cols[a]!] = b[s.cols[a]!]! + (s.vals[a]! * r2[j]!) / delta;
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
        for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a) r1[s.cols[a]!] = r1[s.cols[a]!]! - s.vals[a]! * ys[j]!;
      });
      const r2: Float64Array = Float64Array.from(active, (r: number, j: number): number => bound[j]! - dot(r, xs));
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

/** Passes of the Ruiz equilibration (OSQP's default). */
const SCALING: number = 10;

/** The range a norm is held within before it scales (OSQP's bounds). */
const MIN_SCALE: number = 1e-4;
const MAX_SCALE: number = 1e4;

/** Add `w ā āᵀ` of a row to a banded system. */
function add(s: HumanQuadraticBand.IScaled, k: Float64Array[], r: number, w: number): void {
  for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a)
    for (let b: number = s.start[r]!; b < s.start[r + 1]!; ++b) {
      const i: number = s.cols[a]!;
      const j: number = s.cols[b]!;
      if (j < i) continue;
      if (j - i > s.band) throw new Error("A row couples variables beyond the band");
      k[i]![j - i] = k[i]![j - i]! + w * s.vals[a]! * s.vals[b]!;
    }
}

/** P̄ x for the banded scaled curvature. */
function curvature(s: HumanQuadraticBand.IScaled, x: Float64Array): Float64Array {
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

/** A banded Cholesky factor L (lower), stored as `l[i][j]` = L(i, i - j). */
function cholesky(k: Float64Array[], n: number, band: number): Float64Array[] {
  const l: Float64Array[] = [];
  for (let i: number = 0; i < n; ++i) l.push(new Float64Array(band + 1));
  for (let i: number = 0; i < n; ++i)
    for (let j: number = Math.max(0, i - band); j <= i; ++j) {
      let v: number = k[j]![i - j]!;
      for (let t: number = Math.max(0, i - band); t < j; ++t) v -= l[i]![i - t]! * l[j]![j - t]!;
      if (i === j) l[i]![0] = Math.sqrt(Math.max(v, 1e-300));
      else l[i]![i - j] = v / l[j]![0]!;
    }
  return l;
}

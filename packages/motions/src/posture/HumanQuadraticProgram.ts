/**
 * A convex quadratic program with banded curvature and sparse rows, solved
 * by the alternating direction method of multipliers in the operator
 * splitting form of OSQP (Stellato et al. 2020, Math Program Comput
 * 12:637): minimise `½ xᵀPx + qᵀx` over rows `l <= a·x <= u`, each row hard
 * (projected onto its interval) or soft (an exact l1 penalty `weight ×` its
 * distance from the interval, whose proximal step is a soft threshold
 * toward it), the form of the convex subproblem of TrajOpt's sequential
 * convex optimisation (Schulman et al. 2014, IJRR 33:1251).
 *
 * The curvature and the rows only couple variables within `band` of each
 * other, so the step's linear system is factored once per solve by a banded
 * Cholesky factorisation. The iteration stops on OSQP's primal and dual
 * residual test, or after `ITERATIONS`; a warm start carries the iterates of
 * a solve of the same rows with other bounds.
 */
export namespace HumanQuadraticProgram {
  /** One row: `l <= Σ coef·x[index] <= u`. */
  export interface IRow {
    /** The constraint the row linearises, so a later solve of the next convexification starts from its multiplier. */
    key?: string;
    /** The variables the row reads. */
    index: readonly number[];
    /** Each variable's coefficient, in `index`'s order. */
    coef: readonly number[];
    /** The interval's lower end; `-Infinity` for none. */
    l: number;
    /** The interval's upper end; `Infinity` for none. */
    u: number;
    /** The l1 penalty weight; absent for a hard row. */
    weight?: number;
  }

  /** The problem. */
  export interface IProblem {
    /** The number of variables. */
    n: number;
    /** Half-bandwidth of the curvature and of every row's coupling. */
    band: number;
    /** The curvature's band, `p[i][j]` the entry `(i, i + j)`. */
    p: Float64Array[];
    /** The linear term. */
    q: Float64Array;
    /** The rows, hard or soft. */
    rows: readonly IRow[];
  }

  /** A solve's iterates, to warm-start another solve of the same rows. */
  export interface IState {
    /** The variables. */
    x: Float64Array;
    /** Each row's value as the splitting holds it, inside or penalised toward its interval. */
    z: Float64Array;
    /** Each row's multiplier. */
    y: Float64Array;
  }

  /**
   * A solve's multipliers by its rows' keys, for the next convexification to
   * start from.
   *
   * @param problem The problem solved.
   * @param state Its solve's iterates.
   * @returns Each keyed row's multiplier.
   */
  export function multipliers(problem: IProblem, state: IState): Map<string, number> {
    const out: Map<string, number> = new Map();
    problem.rows.forEach((row: IRow, r: number): void => {
      if (row.key !== undefined) out.set(row.key, state.y[r]!);
    });
    return out;
  }

  /**
   * The minimiser.
   *
   * @param problem The problem.
   * @param warm The iterates of a solve of the same rows; zero when absent.
   * @param duals Multipliers by row key from a solve of other rows that linearise the same constraints, read when `warm` is absent.
   * @returns The iterates; `x` is the minimiser.
   */
  export function solve(
    problem: IProblem,
    warm?: IState,
    duals?: ReadonlyMap<string, number>,
  ): IState {
    const n: number = problem.n;
    const band: number = problem.band;
    const rows: readonly IRow[] = problem.rows;
    const m: number = rows.length;
    // The rows compressed.
    let nnz: number = 0;
    for (const row of rows) nnz += row.index.length;
    const start: Int32Array = new Int32Array(m + 1);
    const cols: Int32Array = new Int32Array(nnz);
    const vals: Float64Array = new Float64Array(nnz);
    const lo: Float64Array = new Float64Array(m);
    const hi: Float64Array = new Float64Array(m);
    const weight: Float64Array = new Float64Array(m);
    let at: number = 0;
    rows.forEach((row: IRow, r: number): void => {
      start[r] = at;
      for (let a: number = 0; a < row.index.length; ++a) {
        cols[at] = row.index[a]!;
        vals[at] = row.coef[a]!;
        ++at;
      }
      lo[r] = row.l;
      hi[r] = row.u;
      weight[r] = row.weight ?? -1;
    });
    start[m] = at;
    // The step's system P + σI + ρ AᵀA, banded, factored again when the
    // step size is adapted.
    let RHO: number = RHO0;
    const factored = (): Float64Array[] => {
      const k: Float64Array[] = problem.p.map((row: Float64Array) =>
        Float64Array.from(row),
      );
      for (let i: number = 0; i < n; ++i) k[i]![0]! += SIGMA;
      for (let r: number = 0; r < m; ++r)
        for (let a: number = start[r]!; a < start[r + 1]!; ++a)
          for (let b: number = start[r]!; b < start[r + 1]!; ++b) {
            const i: number = cols[a]!;
            const j: number = cols[b]!;
            if (j < i) continue;
            if (j - i > band)
              throw new Error("A row couples variables beyond the band");
            k[i]![j - i]! += RHO * vals[a]! * vals[b]!;
          }
      return cholesky(k, n, band);
    };
    let factor: Float64Array[] = factored();
    const x: Float64Array = warm === undefined ? new Float64Array(n) : Float64Array.from(warm.x);
    const z: Float64Array = warm === undefined ? new Float64Array(m) : Float64Array.from(warm.z);
    const y: Float64Array = warm === undefined ? new Float64Array(m) : Float64Array.from(warm.y);
    // A solve of new rows starts from the multipliers of the rows they
    // linearise again (`IRow.key`), the primal at the iterate itself.
    if (warm === undefined && duals !== undefined)
      rows.forEach((row: IRow, r: number): void => {
        const known: number | undefined = row.key === undefined ? undefined : duals.get(row.key);
        if (known !== undefined) y[r] = known;
        z[r] = Math.min(row.u, Math.max(row.l, 0));
      });
    const rhs: Float64Array = new Float64Array(n);
    const xt: Float64Array = new Float64Array(n);
    const tilde: Float64Array = new Float64Array(m);
    const zPrev: Float64Array = new Float64Array(m);
    for (let it: number = 0; it < ITERATIONS; ++it) {
      for (let i: number = 0; i < n; ++i) rhs[i] = SIGMA * x[i]! - problem.q[i]!;
      for (let r: number = 0; r < m; ++r) {
        const w: number = RHO * z[r]! - y[r]!;
        for (let a: number = start[r]!; a < start[r + 1]!; ++a)
          rhs[cols[a]!]! += vals[a]! * w;
      }
      substitute(factor, n, band, rhs, xt);
      for (let r: number = 0; r < m; ++r) {
        let s: number = 0;
        for (let a: number = start[r]!; a < start[r + 1]!; ++a)
          s += vals[a]! * xt[cols[a]!]!;
        tilde[r] = s;
      }
      for (let i: number = 0; i < n; ++i) x[i] = ALPHA * xt[i]! + (1 - ALPHA) * x[i]!;
      for (let r: number = 0; r < m; ++r) {
        zPrev[r] = z[r]!;
        const relaxed: number = ALPHA * tilde[r]! + (1 - ALPHA) * z[r]!;
        const v: number = relaxed + y[r]! / RHO;
        const l: number = lo[r]!;
        const u: number = hi[r]!;
        let next: number;
        if (weight[r]! < 0) next = Math.min(u, Math.max(l, v));
        else {
          const t: number = weight[r]! / RHO;
          next = v > u + t ? v - t : v > u ? u : v < l - t ? v + t : v < l ? l : v;
        }
        y[r] = y[r]! + RHO * (relaxed - next);
        z[r] = next;
      }
      // OSQP's termination on the primal and dual residuals, and its
      // adaptive step size (Stellato et al. 2020, sections 3.4 and 5.2).
      if ((it + 1) % CHECK === 0) {
        let primal: number = 0;
        let scaleP: number = 0;
        for (let r: number = 0; r < m; ++r) {
          let s: number = 0;
          for (let a: number = start[r]!; a < start[r + 1]!; ++a)
            s += vals[a]! * x[cols[a]!]!;
          primal = Math.max(primal, Math.abs(s - z[r]!));
          scaleP = Math.max(scaleP, Math.abs(s), Math.abs(z[r]!));
        }
        const px: Float64Array = curvature(problem, x);
        const aty: Float64Array = new Float64Array(n);
        for (let r: number = 0; r < m; ++r)
          for (let a: number = start[r]!; a < start[r + 1]!; ++a)
            aty[cols[a]!]! += vals[a]! * y[r]!;
        let dual: number = 0;
        let scaleD: number = 0;
        for (let i: number = 0; i < n; ++i) {
          dual = Math.max(dual, Math.abs(px[i]! + problem.q[i]! + aty[i]!));
          scaleD = Math.max(scaleD, Math.abs(px[i]!), Math.abs(aty[i]!), Math.abs(problem.q[i]!));
        }
        if (primal <= ABSOLUTE + RELATIVE * scaleP && dual <= ABSOLUTE + RELATIVE * scaleD) break;
        const next: number =
          RHO * Math.sqrt((primal / Math.max(1e-12, scaleP)) / Math.max(1e-12, dual / Math.max(1e-12, scaleD)));
        if (next > 5 * RHO || next < RHO / 5) {
          RHO = Math.min(1e6, Math.max(1e-6, next));
          factor = factored();
        }
      }
    }
    return { x, z, y };
  }

  /**
   * The value of `½ xᵀPx + qᵀx` plus each soft row's penalty: a trust
   * region's model of the merit.
   *
   * @param problem The problem.
   * @param x The variables.
   * @returns The value.
   */
  export function value(problem: IProblem, x: Float64Array): number {
    let v: number = 0;
    for (let i: number = 0; i < problem.n; ++i) {
      v += problem.q[i]! * x[i]!;
      v += 0.5 * problem.p[i]![0]! * x[i]! * x[i]!;
      for (let j: number = 1; j <= problem.band && i + j < problem.n; ++j)
        v += problem.p[i]![j]! * x[i]! * x[i + j]!;
    }
    for (const row of problem.rows) {
      if (row.weight === undefined) continue;
      let s: number = 0;
      for (let a: number = 0; a < row.index.length; ++a)
        s += row.coef[a]! * x[row.index[a]!]!;
      v += row.weight * Math.max(0, row.l - s, s - row.u);
    }
    return v;
  }
}

/** The ADMM's initial step size. */
const RHO0: number = 0.1;

/** The proximal term that keeps the step's system definite. */
const SIGMA: number = 1e-6;

/** Over-relaxation. */
const ALPHA: number = 1.6;

/** ADMM iterations per solve at most. */
const ITERATIONS: number = 800;

/** Iterations between two residual tests. */
const CHECK: number = 25;

/** The residual tests' absolute tolerance. */
const ABSOLUTE: number = 1e-3;

/** The residual tests' tolerance relative to the residuals' scale. */
const RELATIVE: number = 1e-3;

/** P x for the banded curvature. */
function curvature(problem: HumanQuadraticProgram.IProblem, x: Float64Array): Float64Array {
  const out: Float64Array = new Float64Array(problem.n);
  for (let i: number = 0; i < problem.n; ++i) {
    out[i]! += problem.p[i]![0]! * x[i]!;
    for (let j: number = 1; j <= problem.band && i + j < problem.n; ++j) {
      out[i]! += problem.p[i]![j]! * x[i + j]!;
      out[i + j]! += problem.p[i]![j]! * x[i]!;
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
      let s: number = k[j]![i - j]!;
      for (let t: number = Math.max(0, i - band); t < j; ++t)
        s -= l[i]![i - t]! * l[j]![j - t]!;
      if (i === j) l[i]![0] = Math.sqrt(Math.max(s, 1e-12));
      else l[i]![i - j] = s / l[j]![0]!;
    }
  return l;
}

/** Solve L Lᵀ x = b into `x`. */
function substitute(
  l: Float64Array[],
  n: number,
  band: number,
  b: Float64Array,
  x: Float64Array,
): void {
  for (let i: number = 0; i < n; ++i) {
    let s: number = b[i]!;
    for (let t: number = Math.max(0, i - band); t < i; ++t) s -= l[i]![i - t]! * x[t]!;
    x[i] = s / l[i]![0]!;
  }
  for (let i: number = n - 1; i >= 0; --i) {
    let s: number = x[i]!;
    for (let t: number = i + 1; t <= Math.min(n - 1, i + band); ++t)
      s -= l[t]![t - i]! * x[t]!;
    x[i] = s / l[i]![0]!;
  }
}

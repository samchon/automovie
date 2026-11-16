import { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import type { HumanQuadraticProgram as Q } from "./HumanQuadraticProgram";

/**
 * Numeric preparation shared by solves of one convexification. Modified Ruiz
 * equilibration follows Stellato et al. 2020, section 5.1, algorithm 2.
 * The curvature array only locates a candidate: dimensions and every P, q
 * and nonzero A entry must still match its copied data. Bounds and weights
 * belong to each solve; iterates and adaptive step sizes are never retained.
 * Costs use w=band+1, S supplied curvature entries, R original row entries,
 * Z stored entries after exact-zero compression and m rows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the Ruiz source, exact dependency checks, solve-local intervals and absence of retained iterates or adaptive parameters.
 * @evidence contracts/development/design.md#principled-representation Groups only admitted numeric preparation and its initial factor; positive scaling preserves the original variable and row units.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The internal scaled and factor functions serve the existing quadratic solver without changing its public problem or state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses no body, plan, fixture key or approximate numeric equivalence; the weak p owner only locates copied dependencies to compare.
 */
export namespace HumanQuadraticPreparation {
  /**
   * Admit every original entry, omit exact zero coefficients and equilibrate
   * P, q and A. Nonzero order, duplicate indices and empty rows are preserved.
   * A matching numeric core reuses its scaling; q participates in the cost
   * scaling and therefore also invalidates preparation when it changes.
   *
   * @param problem The convex banded program; bounds may be infinite on their absent sides.
   * @returns Shared numeric core with fresh scaled bounds and weights.
   * @throws {RangeError} For malformed or nonfinite data, an original row outside the band, or noninvertible scaling.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses modified Ruiz equilibration from Stellato et al. 2020, algorithm 2, with the existing ten passes and scaling limits; exact zero omission preserves the finite real quadratic program.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns admission, compression and numeric preparation once for the public quadratic solver; banded algebra remains in HumanQuadraticBand.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses exact comparisons and exact zero omission, preserving small coefficients, duplicate entries, row order, penalties and solver tolerances.
   * @evidence contracts/development/implementation.md#efficient-algorithms Admission and exact comparison take O(S+R+n+m), including supplied trailing curvature storage; misses add preparation's documented scaling cost, while hits allocate three row-sized bound and weight arrays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Compares dimensions, copied P and q values, and each row's ordered nonzero indices and coefficients; the p array identity only retrieves a candidate and bounds and weights are always refreshed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each live weak curvature-array owner retains one numeric preparation and initial factor, O(S+n*w+Z+n+m), including all copied supplied curvature entries; replacement drops the former preparation and collection releases an unreachable owner.
   * @evidence contracts/development/common.md#meaningful-documentation States the scaling source, zero and duplicate semantics, validation failures, exact reuse dependencies and retained-data lifetime.
   */
  export function scaled(problem: Q.IProblem): B.IScaled {
    let prepared: IPrepared | undefined = PREPARATIONS.get(problem.p);
    const admitted: { entries: number; same: boolean } = admit(
      problem,
      prepared,
    );
    if (prepared === undefined || !admitted.same)
      prepared = create(problem, admitted.entries);
    const core: ICore = prepared.core;
    const lo: Float64Array = new Float64Array(core.m);
    const hi: Float64Array = new Float64Array(core.m);
    const weight: Float64Array = new Float64Array(core.m);
    problem.rows.forEach((row: Q.IRow, r: number): void => {
      lo[r] = row.l * core.e[r]!;
      hi[r] = row.u * core.e[r]!;
      weight[r] =
        row.weight === undefined ? -1 : (core.c * row.weight) / core.e[r]!;
      if (
        (Number.isFinite(row.l) && !Number.isFinite(lo[r]!)) ||
        (Number.isFinite(row.u) && !Number.isFinite(hi[r]!)) ||
        !Number.isFinite(weight[r]!)
      )
        throw new RangeError(`Quadratic row ${r} overflows its scaling`);
    });
    PREPARATIONS.set(problem.p, prepared);
    return { ...core, lo, hi, weight };
  }

  /**
   * The initial ADMM factor for these scaled matrices, row step sizes and
   * proximal term. A different bound classification changes rho and rebuilds
   * the factor. Later adaptive factors and polishing remain solve-local.
   *
   * @param problem The owner whose preparation supplied the scaled matrices.
   * @param s The scaled program with this solve's bounds and weights.
   * @param rho This solve's initial positive row step sizes.
   * @param sigma The positive proximal term.
   * @returns The immutable initial Cholesky factor.
   * @throws {RangeError} For nonpositive or nonfinite parameters or a nonfinite factor.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reuses the Cholesky factor only for the same reduced system Pbar plus sigma I plus Abar transpose diag(rho) Abar, the OSQP indirect system.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Supplies only the initial factor to HumanQuadraticProgram; adaptive rho updates and active-set polishing keep their existing banded-algebra calls.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Compares the complete rho vector and sigma exactly and preserves every current solver parameter and convergence check.
   * @evidence contracts/development/implementation.md#efficient-algorithms A hit validates and compares m step sizes; a miss adds Band.factor's O(S+n+sum(k_r*k_r)+n*w*w) assembly and factorization, including diagonal systems and supplied padding; speed is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Requires the retained scaled curvature identity supplied by scaled, then identical rho and sigma; bounds, weights and iterates do not enter this matrix.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Stores one initial factor and copied rho vector per live prepared owner, replacing the former factor when parameters change and sharing no mutable iterates.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the matrix, factor invalidation, read-only consumption and failure cases.
   */
  export function factor(
    problem: Q.IProblem,
    s: B.IScaled,
    rho: Float64Array,
    sigma: number,
  ): Float64Array[] {
    if (
      !(sigma > 0) ||
      !Number.isFinite(sigma) ||
      rho.length !== s.m ||
      rho.some(
        (value: number): boolean => !(value > 0) || !Number.isFinite(value),
      )
    )
      throw new RangeError("Quadratic step sizes must be finite and positive");
    const prepared: IPrepared | undefined = PREPARATIONS.get(problem.p);
    const retained: IInitial | undefined = prepared?.initial;
    if (
      prepared?.core.p === s.p &&
      retained !== undefined &&
      Object.is(retained.sigma, sigma) &&
      retained.rho.length === rho.length &&
      rho.every((value: number, r: number): boolean =>
        Object.is(value, retained.rho[r]),
      )
    )
      return retained.factor;
    const out: Float64Array[] = B.factor(s, rho, sigma);
    for (const row of out) finite(row, "Quadratic factor");
    if (prepared?.core.p === s.p)
      prepared.initial = { rho: Float64Array.from(rho), sigma, factor: out };
    return out;
  }
}

/**
 * Shared scaled matrices and positive invertible scales, without intervals.
 *
 * Reuses Band.IScaled's numeric matrix and scale representation while excluding lo, hi and weight, which vary independently per solve.
 * Defines exactly the fields preparation retains and every algebra consumer reads; the existing scaled representation remains owned by Band.
 * Uses Omit on the owning type rather than a parallel matrix contract and stores no solver iterates.
 * Names the shared numeric core and why intervals and weights are excluded.
 */
type ICore = Omit<B.IScaled, "lo" | "hi" | "weight">;

/**
 * Copied dependencies and current immutable preparation for one weak owner.
 *
 * Stores original P/q and ordered nonzero coefficients to prove equivalence with a scaled core; array dimensions and finite values are admitted before creation.
 * Contains only copied numeric dependencies, the algebra core and one optional initial factor consumed by the two preparation functions.
 * Holds no original problem, body, plan or result references and does not treat mutable input identity as proof.
 * Describes original snapshots, their relation to CSR columns and the sole optional retained factor.
 */
interface IPrepared {
  /** Original curvature, including its supplied row lengths. */
  p: Float64Array[];

  /** Original linear term, since it controls cost equilibration. */
  q: Float64Array;

  /** Original ordered nonzero coefficients, parallel to core.cols. */
  vals: Float64Array;

  /** Equilibrated matrices, compression and scales. */
  core: ICore;

  /** At most one initial factor; no adapted parameters or solve results. */
  initial?: IInitial;
}

/**
 * Initial factor dependencies; rho is copied before the solve adapts its vector.
 *
 * Couples the numeric Cholesky factor with the exact rho vector and sigma that formed its reduced matrix; matrix identity belongs to its enclosing prepared core.
 * Records only the initial-factor dependencies read by factor; adaptive parameters remain inside the solve.
 * Stores copied positive numeric parameters without a solve outcome, active-set history or approximate key.
 * States why rho is copied and why substitution may share the factor read-only.
 */
interface IInitial {
  /** Initial step size of each retained row. */
  rho: Float64Array;

  /** Proximal term used for this factor. */
  sigma: number;

  /** Factor read by substitution, which never changes it. */
  factor: Float64Array[];
}

/** One numeric preparation per live curvature-array owner; values retain no problem or body. */
const PREPARATIONS: WeakMap<Float64Array[], IPrepared> = new WeakMap();

/** Maximum entry count and column index representable by the signed Int32 CSR arrays. */
const MAX_CSR: number = 0x7fffffff;

/**
 * Validate all original entries and compare copied dependencies in one scan.
 *
 * Checks the finite convex-program storage contract before zero omission, then compares exact copied P/q and ordered nonzero A; positive semidefiniteness remains the documented caller premise.
 * Combines admission and comparison so changed data never skip validation and matching data need no second full traversal.
 * Checks zero-coefficient indices and original spans, sparse row holes and every supplied matrix entry; preserves unsorted duplicates and rejects Int32 overflow rather than truncating it.
 * Takes O(S+n+R+m) time with scalar auxiliary storage, validating supplied curvature padding and original zero entries as well as stored contributions.
 * Returns a match only after dimensions and every numerical dependency compare exactly; bounds and weights are validated but remain independently refreshed inputs.
 * Allocates only the fixed-size admission result and retains neither the original problem nor the candidate beyond the call.
 * Defines whole-input admission, exact comparison, original zero-entry validation and the nonzero count result.
 */
function admit(
  problem: Q.IProblem,
  prepared: IPrepared | undefined,
): { entries: number; same: boolean } {
  const { n, band, p, q, rows }: Q.IProblem = problem;
  if (
    !Number.isSafeInteger(n) ||
    n < 0 ||
    !Number.isSafeInteger(band) ||
    band < 0 ||
    p.length !== n ||
    q.length !== n ||
    rows.length > MAX_CSR
  )
    throw new RangeError("Malformed quadratic dimensions");
  let same: boolean =
    prepared !== undefined &&
    prepared.core.n === n &&
    prepared.core.band === band &&
    prepared.core.m === rows.length;
  for (let i: number = 0; i < n; ++i) {
    const row: Float64Array | undefined = p[i];
    const previous: Float64Array | undefined = prepared?.p[i];
    if (row === undefined || row.length < Math.min(band + 1, n - i))
      throw new RangeError(`Malformed quadratic curvature row ${i}`);
    if (!Number.isFinite(q[i]!))
      throw new RangeError(`Quadratic linear term entry ${i} must be finite`);
    if (!Object.is(q[i], prepared?.q[i]) || row.length !== previous?.length)
      same = false;
    for (let j: number = 0; j < row.length; ++j) {
      if (!Number.isFinite(row[j]!))
        throw new RangeError(
          `Quadratic curvature row ${i} entry ${j} must be finite`,
        );
      if (same && !Object.is(row[j], previous![j])) same = false;
    }
  }
  let entries: number = 0;
  for (let r: number = 0; r < rows.length; ++r) {
    const row: Q.IRow | undefined = rows[r];
    if (
      row === undefined ||
      row.index.length !== row.coef.length ||
      !(Number.isFinite(row.l) || row.l === -Infinity) ||
      !(Number.isFinite(row.u) || row.u === Infinity) ||
      row.l > row.u ||
      (row.weight !== undefined &&
        (!Number.isFinite(row.weight) || row.weight < 0))
    )
      throw new RangeError(`Malformed quadratic row ${r}`);
    let first: number = Infinity;
    let last: number = -Infinity;
    let at: number = prepared?.core.start[r] ?? 0;
    const end: number = prepared?.core.start[r + 1] ?? 0;
    for (let a: number = 0; a < row.index.length; ++a) {
      const index: number = row.index[a]!;
      const coef: number = row.coef[a]!;
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= n ||
        index > MAX_CSR ||
        !Number.isFinite(coef)
      )
        throw new RangeError(`Malformed quadratic row ${r} entry ${a}`);
      first = Math.min(first, index);
      last = Math.max(last, index);
      if (coef !== 0) {
        ++entries;
        if (
          same &&
          (at >= end ||
            index !== prepared!.core.cols[at] ||
            !Object.is(coef, prepared!.vals[at]))
        )
          same = false;
        ++at;
      }
    }
    if (at !== end) same = false;

    // Preserve the original band contract even when a distant entry is zero.
    if (last - first > band)
      throw new RangeError(
        `Quadratic row ${r} couples variables beyond the band`,
      );
  }
  if (entries > MAX_CSR)
    throw new RangeError("Quadratic rows exceed Int32 storage");
  return { entries, same };
}

/**
 * Compress exact zeros and run the ten-pass modified Ruiz algorithm.
 *
 * Applies Stellato et al. 2020 algorithm 2 to admitted matrices using the existing ten passes, norm limits and q-dependent cost equilibration.
 * Builds ordered CSR and copied snapshots, computes variable/row/cost scales, then admits finite invertible prepared data.
 * Omits only coefficients equal to zero, retaining all nonzeros, duplicate indices and empty-row offsets; no cutoff, sorting, merged cancellation or changed scaling constants is used.
 * Compression and copies plus ten scaling passes take O(S+R+10*(n*w+Z+m)) time and O(S+Z+n+m) retained space before the initial factor; supplied padding is copied and validated.
 * Runs only when admission finds a changed dependency and copies raw numeric inputs so later mutation cannot make a stale preparation appear equal.
 * Returns one numeric prepared value for weak-owner replacement; temporary norm vectors become unreachable after creation.
 * States exact-zero compression, the unchanged Ruiz policy, copied dependencies and finite invertibility check.
 */
function create(problem: Q.IProblem, entries: number): IPrepared {
  const { n, band, rows }: Q.IProblem = problem;
  const m: number = rows.length;
  const start: Int32Array = new Int32Array(m + 1);
  const cols: Int32Array = new Int32Array(entries);
  const original: Float64Array = new Float64Array(entries);
  let at: number = 0;
  rows.forEach((row: Q.IRow, r: number): void => {
    start[r] = at;
    for (let a: number = 0; a < row.index.length; ++a) {
      if (row.coef[a] === 0) continue;
      cols[at] = row.index[a]!;
      original[at] = row.coef[a]!;
      ++at;
    }
  });
  start[m] = at;
  const originalP: Float64Array[] = problem.p.map(
    (row: Float64Array): Float64Array => Float64Array.from(row),
  );
  const originalQ: Float64Array = Float64Array.from(problem.q);
  const p: Float64Array[] = originalP.map(
    (row: Float64Array): Float64Array => Float64Array.from(row),
  );
  const q: Float64Array = Float64Array.from(originalQ);
  const vals: Float64Array = Float64Array.from(original);
  const d: Float64Array = new Float64Array(n).fill(1);
  const e: Float64Array = new Float64Array(m).fill(1);
  let c: number = 1;
  const limit: (v: number) => number = (v: number): number =>
    v < MIN_SCALE ? 1 : Math.min(v, MAX_SCALE);
  const dx: Float64Array = new Float64Array(n);
  const dr: Float64Array = new Float64Array(m);
  const curvature: Float64Array = new Float64Array(n);
  for (let pass: number = 0; pass < SCALING; ++pass) {
    // Infinity norms of the KKT columns determine the variable and row scales.
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
      for (let j: number = 0; j <= band && i + j < n; ++j)
        p[i]![j] = p[i]![j]! * dx[i]! * dx[i + j]!;
      q[i] = q[i]! * dx[i]!;
      d[i] = d[i]! * dx[i]!;
    }
    for (let r: number = 0; r < m; ++r) {
      for (let a: number = start[r]!; a < start[r + 1]!; ++a)
        vals[a] = vals[a]! * dr[r]! * dx[cols[a]!]!;
      e[r] = e[r]! * dr[r]!;
    }

    // Cost equilibration depends on q as well as the scaled curvature.
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
    for (let i: number = 0; i < n; ++i)
      linear = Math.max(linear, Math.abs(q[i]!));
    const gamma: number = 1 / limit(Math.max(mean, linear));
    for (let i: number = 0; i < n; ++i) {
      for (let j: number = 0; j <= band && i + j < n; ++j)
        p[i]![j] = p[i]![j]! * gamma;
      q[i] = q[i]! * gamma;
    }
    c *= gamma;
  }
  for (const row of p) finite(row, "Scaled quadratic curvature");
  finite(q, "Scaled quadratic linear term");
  finite(vals, "Scaled quadratic rows");
  if (
    !(c > 0) ||
    !Number.isFinite(c) ||
    d.some(
      (value: number): boolean => !(value > 0) || !Number.isFinite(value),
    ) ||
    e.some((value: number): boolean => !(value > 0) || !Number.isFinite(value))
  )
    throw new RangeError("Quadratic scaling must be finite and invertible");
  return {
    p: originalP,
    q: originalQ,
    vals: original,
    core: { n, m, band, p, q, start, cols, vals, d, e, c },
  };
}

/**
 * Reject nonfinite numeric data before retention can conceal it.
 *
 * Requires finite prepared matrix and factor entries, preventing NaN or infinity from being retained as reusable numeric data.
 * One indexed scan supplies the same finite-value rejection for each prepared buffer.
 * Tests finiteness directly without a magnitude cutoff, coercion or replacement value.
 * Takes O(buffer length) time and O(1) auxiliary storage.
 * Reads each newly computed buffer before retention; previously admitted immutable buffers need no repeated scan here.
 * Retains no buffer; a rejection throws a position-bearing RangeError to the caller.
 * Describes finite-buffer admission and its indexed failure without changing numeric values.
 */
function finite(values: Float64Array, label: string): void {
  for (let i: number = 0; i < values.length; ++i)
    if (!Number.isFinite(values[i]!))
      throw new RangeError(`${label} entry ${i} must be finite`);
}

/** Passes of the Ruiz equilibration (OSQP's default). */
const SCALING: number = 10;

/** The range a norm is held within before it scales (OSQP's bounds). */
const MIN_SCALE: number = 1e-4;
const MAX_SCALE: number = 1e4;

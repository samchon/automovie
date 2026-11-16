import { HumanQuadraticAdmission } from "./HumanQuadraticAdmission";
import { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import type { HumanQuadraticProgram as Q } from "./HumanQuadraticProgram";
import type { HumanQuadraticWorkspace as Work } from "./HumanQuadraticWorkspace";

/**
 * Numeric preparation shared by solves of one convexification. Modified Ruiz
 * equilibration follows Stellato et al. 2020, section 5.1, algorithm 2.
 * The curvature array only locates a candidate: dimensions and every P, q
 * and nonzero A entry must still match its copied data. Initial factors
 * belong to their immutable scaled cores. Bounds and weights belong to each
 * solve; iterates and adaptive step sizes are never retained here.
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Compares dimensions, copied P/q and ordered nonzero A; identical cores share residual inverse scales, scaled/unscaled q norms and exact diagonal metadata, while one-shot bounds and weights refresh and source p identity only locates a candidate.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each live weak source owner retains one numeric preparation, O(S+n*w+Z+n+m), including inverse scales; replacement and collection release it. Initial factors have their own weak scaled-core owner. Fresh solve wrappers borrow raw rows, fixed models replace that loan with copies, and neither enters the retained core. A miss consumes fresh lo as scale scratch before overwriting it.
   * @evidence contracts/development/common.md#meaningful-documentation States the scaling source, zero and duplicate semantics, validation failures, exact reuse dependencies and retained-data lifetime.
   */
  export function scaled(problem: Q.IProblem): B.IScaled {
    let prepared: IPrepared | undefined = PREPARATIONS.get(problem.p);
    const admitted: { entries: number; same: boolean } = HumanQuadraticAdmission(
      problem,
      prepared,
    );
    const lo: Float64Array = new Float64Array(problem.rows.length);
    if (prepared === undefined || !admitted.same)
      prepared = create(problem, admitted.entries, lo);
    const core: ICore = prepared.core;
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
    return { ...core, lo, hi, weight, raw: problem.rows };
  }

  /**
   * The initial ADMM factor for these scaled matrices, row step sizes and
   * proximal term. A different bound classification changes rho and rebuilds
   * the factor. Adaptive factors and polishing belong to their separate
   * one-shot or persistent workspace owner.
   *
   * @param s The scaled program with this solve's bounds and weights.
   * @param rho This solve's initial positive row step sizes.
   * @param sigma The positive proximal term.
   * @returns The immutable initial Cholesky factor.
   * @throws {RangeError} For nonpositive or nonfinite parameters or a nonfinite factor.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reuses the Cholesky factor only for the same reduced system Pbar plus sigma I plus Abar transpose diag(rho) Abar, the OSQP indirect system.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Supplies only the initial factor to HumanQuadraticProgram; adaptive rho updates and active-set polishing keep their existing banded-algebra calls.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Compares the complete rho vector and sigma exactly and preserves every current solver parameter and convergence check.
   * @evidence contracts/development/implementation.md#efficient-algorithms A hit validates and compares m step sizes; a miss adds Band.factor's O(n*w+sum(k_r*k_r)+n*w*w) canonical-band assembly and factorization; original supplied padding is already admitted and speed is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Requires the retained scaled curvature identity supplied by scaled, then identical rho and sigma; bounds, weights and iterates do not enter this matrix.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Stores one initial factor and copied rho vector per live scaled core, replacing the former factor when parameters change; the factor remains valid when a fixed model releases its mutable source and shares no iterates.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the matrix, factor invalidation, read-only consumption and failure cases.
   */
  export function factor(
    s: B.IScaled,
    rho: Float64Array,
    sigma: number,
  ): Work.IFactor {
    if (
      !(sigma > 0) ||
      !Number.isFinite(sigma) ||
      rho.length !== s.m
    )
      throw new RangeError("Quadratic step sizes must be finite and positive");
    const retained: IInitial | undefined = INITIALS.get(s.p);
    let same: boolean =
      retained !== undefined &&
      Object.is(retained.sigma, sigma) &&
      retained.rho.length === rho.length;
    for (let r: number = 0; r < rho.length; ++r) {
      const value: number = rho[r]!;
      if (!(value > 0) || !Number.isFinite(value))
        throw new RangeError("Quadratic step sizes must be finite and positive");
      if (same && !Object.is(value, retained!.rho[r])) same = false;
    }
    if (same) return retained!.factor;
    const out: Work.IFactor = B.factor(s, rho, sigma);
    for (const row of out.system) finite(row, "Quadratic factor");
    INITIALS.set(s.p, { rho: Float64Array.from(rho), sigma, factor: out });
    return out;
  }

  /**
   * Copied dependencies and current immutable preparation for one weak owner.
   *
   * @evidence contracts/development/design.md#principled-representation Stores admitted original-unit P/q and ordered nonzero A snapshots beside their equilibrated core, allowing exact dependency comparison while the owning factory enforces compatible dimensions and finite storage.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supplies Preparation's retained matrices and the Admission helper's copied dependencies through one internal type; initial factors retain separate scaled-core ownership and public solver state is unchanged.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Holds no original problem, body, plan or result reference; copied dependencies prove equivalence rather than trusting mutable source identity or an approximate numeric key.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the copied raw snapshots, their ordered CSR correspondence, internal admission consumer and separate factor lifetime.
   */
  export interface IPrepared {
    /** Original curvature, including its supplied row lengths. */
    p: Float64Array[];

    /** Original linear term, since it controls cost equilibration. */
    q: Float64Array;

    /** Original ordered nonzero coefficients, parallel to core.cols. */
    vals: Float64Array;

    /** Equilibrated matrices, compression and scales. */
    core: ICore;
  }
}

/**
 * Shared scaled matrices/scales without solve-local intervals or raw loans.
 *
 * Reuses Band.IScaled's numeric representation but excludes lo/hi/weight, raw layouts and lazy exceptional restoration, which belong to one-shot wrappers or fixed models.
 * Defines exactly the fields preparation retains and every algebra consumer reads; the existing scaled representation remains owned by Band.
 * Uses Omit on the owning type rather than a parallel matrix contract and stores no solver iterates.
 * Names the shared numeric core and why intervals, weights and original-input loans are excluded.
 */
type ICore = Omit<B.IScaled, "lo" | "hi" | "weight" | "raw" | "restored">;

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
  factor: Work.IFactor;
}

/** One numeric preparation per live curvature-array owner; values retain no problem or body. */
const PREPARATIONS: WeakMap<Float64Array[], HumanQuadraticPreparation.IPrepared> = new WeakMap();

/** One immutable initial factor per live scaled numeric core, including fixed models whose mutable source has been released. */
const INITIALS: WeakMap<Float64Array[], IInitial> = new WeakMap();

/**
 * Compress exact zeros and run the ten-pass modified Ruiz algorithm.
 *
 * Applies Stellato et al. 2020 algorithm 2 to admitted matrices using the existing ten passes, norm limits and q-dependent cost equilibration.
 * Builds ordered CSR and full raw snapshots, then scales the canonical band; exact diagonal inputs omit only unchanged off-diagonal signed zeros, and post-column-scaling P/q norms are accumulated as entries are written in the original reduction order.
 * Omits only coefficients equal to zero, retaining all nonzeros, duplicate indices and empty-row offsets; no cutoff, sorting, merged cancellation or changed scaling constants is used.
 * Compression and snapshots take O(S+R+n*w) before ten O(K+Z+m) scaling passes, with K=n for diagonal P, stored positions for sparse P and the full band for dense P; space remains O(S+n*w+Z+n+m), including exact position metadata and full input/final finite admission.
 * Runs only when admission finds a changed dependency, copies numeric inputs and classifies exact diagonal curvature once. The original 1/(c*d[i]) and both q infinity norms are computed after equilibration without a clamp or added finite rejection; max of nonnegative magnitudes preserves the original NaN/infinity normalization behavior.
 * Returns one numeric prepared value without retaining row-scale scratch; its caller reuses that fresh m-entry buffer as lo only after all scaling reads finish.
 * States exact-zero compression, the unchanged Ruiz policy, copied dependencies and finite invertibility check.
 */
function create(
  problem: Q.IProblem,
  entries: number,
  dr: Float64Array,
): HumanQuadraticPreparation.IPrepared {
  const { n, band, rows }: Q.IProblem = problem;
  const m: number = rows.length;
  const start: Int32Array = new Int32Array(m + 1);
  const cols: Int32Array = new Int32Array(entries);
  const ordered: Uint8Array = new Uint8Array(m).fill(1);
  const singleton: Int32Array = new Int32Array(m).fill(-1);
  const original: Float64Array = new Float64Array(entries);
  let at: number = 0;
  rows.forEach((row: Q.IRow, r: number): void => {
    start[r] = at;
    let previous: number = -1;
    for (let a: number = 0; a < row.index.length; ++a) {
      if (row.coef[a] === 0) continue;
      const index: number = row.index[a]!;
      if (index < previous) ordered[r] = 0;
      previous = index;
      cols[at] = index;
      original[at] = row.coef[a]!;
      ++at;
    }
    if (at === start[r]! + 1) singleton[r] = start[r]!;
  });
  start[m] = at;
  const originalP: Float64Array[] = problem.p.map(
    (row: Float64Array): Float64Array => Float64Array.from(row),
  );
  const originalQ: Float64Array = Float64Array.from(problem.q);
  const p: Float64Array[] = originalP.map(
    (row: Float64Array, i: number): Float64Array =>
      row.slice(0, Math.min(band + 1, n - i)),
  );
  let diagonal: boolean = true;
  let sparse: boolean = false;
  let positions: number = n;
  for (const row of p) {
    for (let j: number = 1; j < row.length; ++j)
      if (row[j] === 0) sparse = true;
      else {
        diagonal = false;
        ++positions;
      }
  }
  let pPattern: B.IScaled["pPattern"];

  // Finite positive Ruiz multipliers preserve every original signed zero;
  // retain all originally nonzero positions even when scaling underflows.
  if (!diagonal && sparse) {
    const pStart: Float64Array = new Float64Array(n + 1);
    const pOffsets: Float64Array = new Float64Array(positions);
    let cursor: number = 0;
    for (let i: number = 0; i < n; ++i) {
      const row: Float64Array = p[i]!;
      pStart[i] = cursor;
      pOffsets[cursor++] = 0;
      for (let j: number = 1; j < row.length; ++j)
        if (row[j] !== 0) pOffsets[cursor++] = j;
    }
    pStart[n] = cursor;
    pPattern = { start: pStart, offsets: pOffsets };
  }
  const q: Float64Array = Float64Array.from(originalQ);
  const vals: Float64Array = Float64Array.from(original);
  const d: Float64Array = new Float64Array(n).fill(1);
  const e: Float64Array = new Float64Array(m).fill(1);
  let c: number = 1;
  const limit: (v: number) => number = (v: number): number =>
    v < MIN_SCALE ? 1 : Math.min(v, MAX_SCALE);
  const dx: Float64Array = new Float64Array(n);
  const curvature: Float64Array = new Float64Array(n);
  for (let pass: number = 0; pass < SCALING; ++pass) {
    // Infinity norms of the KKT columns determine the variable and row scales.
    curvature.fill(0);
    for (let i: number = 0; i < n; ++i) {
      const row: Float64Array = p[i]!;
      const first: number = pPattern?.start[i] ?? 0;
      const end: number = diagonal ? 1 : pPattern === undefined
        ? row.length : pPattern.start[i + 1]! - first;
      for (let a: number = 0; a < end; ++a) {
        const j: number = pPattern?.offsets[first + a] ?? a;
        const v: number = Math.abs(row[j]!);
        curvature[i] = Math.max(curvature[i]!, v);
        curvature[i + j] = Math.max(curvature[i + j]!, v);
      }
    }
    dx.set(curvature);
    for (let r: number = 0; r < m; ++r) {
      let row: number = 0;
      const single: number = singleton[r]!;
      if (single >= 0) {
        const v: number = Math.abs(vals[single]!);
        row = Math.max(0, v);
        dx[cols[single]!] = Math.max(dx[cols[single]!]!, v);
      } else {
        const end: number = start[r + 1]!;
        for (let a: number = start[r]!; a < end; ++a) {
          const v: number = Math.abs(vals[a]!);
          row = Math.max(row, v);
          dx[cols[a]!] = Math.max(dx[cols[a]!]!, v);
        }
      }
      dr[r] = 1 / Math.sqrt(limit(row));
    }
    for (let i: number = 0; i < n; ++i) dx[i] = 1 / Math.sqrt(limit(dx[i]!));

    // The cost reads these transformed entries; reduce them at their producer.
    curvature.fill(0);
    let linear: number = 0;
    for (let i: number = 0; i < n; ++i) {
      const row: Float64Array = p[i]!;
      const scale: number = dx[i]!;
      const first: number = pPattern?.start[i] ?? 0;
      const end: number = diagonal ? 1 : pPattern === undefined
        ? row.length : pPattern.start[i + 1]! - first;
      for (let a: number = 0; a < end; ++a) {
        const j: number = pPattern?.offsets[first + a] ?? a;
        const coefficient: number = row[j]! * scale * dx[i + j]!;
        row[j] = coefficient;
        const magnitude: number = Math.abs(coefficient);
        curvature[i] = Math.max(curvature[i]!, magnitude);
        curvature[i + j] = Math.max(curvature[i + j]!, magnitude);
      }
      q[i] = q[i]! * scale;
      d[i] = d[i]! * scale;
      linear = Math.max(linear, Math.abs(q[i]!));
    }
    for (let r: number = 0; r < m; ++r) {
      const scale: number = dr[r]!;
      const single: number = singleton[r]!;
      if (single >= 0)
        vals[single] = vals[single]! * scale * dx[cols[single]!]!;
      else {
        const end: number = start[r + 1]!;
        for (let a: number = start[r]!; a < end; ++a)
          vals[a] = vals[a]! * scale * dx[cols[a]!]!;
      }
      e[r] = e[r]! * scale;
    }

    // Cost equilibration depends on q as well as the scaled curvature.
    let mean: number = 0;
    for (let i: number = 0; i < n; ++i) mean += curvature[i]!;
    mean /= Math.max(1, n);
    const gamma: number = 1 / limit(Math.max(mean, linear));
    for (let i: number = 0; i < n; ++i) {
      const row: Float64Array = p[i]!;
      const first: number = pPattern?.start[i] ?? 0;
      const end: number = diagonal ? 1 : pPattern === undefined
        ? row.length : pPattern.start[i + 1]! - first;
      for (let a: number = 0; a < end; ++a) {
        const j: number = pPattern?.offsets[first + a] ?? a;
        row[j] = row[j]! * gamma;
      }
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
  let qNorm: number = 0;
  let unscaledQNorm: number = 0;
  const unscale: Float64Array = d.map((scale: number, i: number): number => {
    const inverse: number = 1 / (c * scale);
    qNorm = Math.max(qNorm, Math.abs(q[i]!));
    unscaledQNorm = Math.max(unscaledQNorm, Math.abs(q[i]! * inverse));
    return inverse;
  });
  return {
    p: originalP,
    q: originalQ,
    vals: original,
    core: {
      n, m, band, p, diagonal, pPattern, q, qNorm, unscaledQNorm,
      start, cols, vals, ordered, singleton, d, e, c, unscale,
    },
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


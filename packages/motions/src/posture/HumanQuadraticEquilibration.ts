import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import type { HumanQuadraticAdmission } from "./HumanQuadraticAdmission";
import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import { HumanQuadraticFactorOrder } from "./HumanQuadraticFactorOrder";
import type { HumanQuadraticPreparation } from "./HumanQuadraticPreparation";
import { HumanQuadraticTranspose } from "./HumanQuadraticTranspose";

/**
 * Compress exact zeros and run the ten-pass modified Ruiz algorithm, or, given
 * an earlier program's variable and cost scales (`fixed`), apply them and one
 * Ruiz row step in one pass.
 *
 * @param problem The admitted program.
 * @param admitted What the admission proved equal to the previous preparation.
 * @param dr Row-sized scratch, the row scales' work, left holding the last row
 *   step.
 * @param previous The caller's previous preparation, whose proved-equal raw
 *   data and topology are shared.
 * @param fixed The variables' and the cost's scales to apply in place of the
 *   ten passes.
 * @returns The new preparation.
 * @throws {RangeError} For nonfinite scaled data or noninvertible scaling.
 */
export function HumanQuadraticEquilibration(
  problem: IAutoMovieMotionHumanQuadraticProgram.IProblem,
  admitted: ReturnType<typeof HumanQuadraticAdmission>,
  dr: Float64Array,
  previous?: HumanQuadraticPreparation.IPrepared,
  fixed?: HumanQuadraticPreparation.IScaling,
): HumanQuadraticPreparation.IPrepared {
  const { n, band, rows }: IAutoMovieMotionHumanQuadraticProgram.IProblem =
    problem;
  const m: number = rows.length;
  const start: Int32Array = admitted.topology
    ? previous!.core.start
    : new Int32Array(m + 1);
  const cols: Int32Array = admitted.topology
    ? previous!.core.cols
    : new Int32Array(admitted.entries);
  const ordered: Uint8Array = admitted.topology
    ? previous!.core.ordered
    : new Uint8Array(m).fill(1);
  const singleton: Int32Array = admitted.topology
    ? previous!.core.singleton
    : new Int32Array(m).fill(-1);
  const original: Float64Array = admitted.rows
    ? previous!.vals
    : new Float64Array(admitted.entries);
  if (!admitted.rows) {
    let at: number = 0;
    rows.forEach(
      (row: IAutoMovieMotionHumanQuadraticProgram.IRow, r: number): void => {
        if (!admitted.topology) start[r] = at;
        let previousColumn: number = -1;
        for (let a: number = 0; a < row.index.length; ++a) {
          if (row.coef[a] === 0) continue;
          const index: number = row.index[a]!;
          if (!admitted.topology) {
            if (index < previousColumn) ordered[r] = 0;
            previousColumn = index;
            cols[at] = index;
          }
          original[at++] = row.coef[a]!;
        }
        if (!admitted.topology && at === start[r]! + 1)
          singleton[r] = start[r]!;
      },
    );
    if (!admitted.topology) start[m] = at;
  }
  const factorOrder: B.IScaled["factorOrder"] = admitted.topology
    ? previous!.core.factorOrder
    : HumanQuadraticFactorOrder(start, cols, ordered);
  const transpose: B.IScaled["transpose"] = admitted.topology
    ? previous!.core.transpose
    : HumanQuadraticTranspose(n, start, cols);
  const originalP: Float64Array[] = admitted.curvature
    ? previous!.p
    : problem.p.map(
        (row: Float64Array): Float64Array => Float64Array.from(row),
      );
  const originalQ: Float64Array = admitted.linear
    ? previous!.q
    : Float64Array.from(problem.q);
  let p: Float64Array[] = originalP.map(
    (row: Float64Array, i: number): Float64Array =>
      row.slice(0, Math.min(band + 1, n - i)),
  );
  let diagonal: boolean = admitted.curvature ? previous!.core.diagonal : true;
  let pPattern: B.IScaled["pPattern"] = admitted.curvature
    ? previous!.core.pPattern
    : undefined;

  // Finite positive Ruiz multipliers preserve every original signed zero;
  // retain all originally nonzero positions even when scaling underflows.
  if (!admitted.curvature) {
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
  }
  const q: Float64Array = Float64Array.from(originalQ);
  let vals: Float64Array = Float64Array.from(original);
  const d: Float64Array = new Float64Array(n).fill(1);
  const e: Float64Array = new Float64Array(m).fill(1);
  let c: number = 1;

  // These buffers never enter a numeric core. The first fill/set of every
  // pass overwrites them completely, including after a failed preparation.
  const scaling: HumanQuadraticPreparation.IPrepared["scaling"] =
    previous?.core.n === n
      ? previous.scaling
      : { dx: new Float64Array(n), curvature: new Float64Array(n) };
  const { dx, curvature }: HumanQuadraticPreparation.IPrepared["scaling"] =
    scaling;

  // Scales an earlier program of the same variables found: P, q and A in
  // one pass on them, and each row by one Ruiz row step on the scaled
  // columns, the step every pass of the loop below takes.
  if (fixed !== undefined) {
    c = fixed.c;
    for (let i: number = 0; i < n; ++i) {
      d[i] = fixed.d[i]!;
      const row: Float64Array = p[i]!;
      const first: number = pPattern?.start[i] ?? 0;
      const end: number = diagonal
        ? 1
        : pPattern === undefined
          ? row.length
          : pPattern.start[i + 1]! - first;
      for (let a: number = 0; a < end; ++a) {
        const j: number = pPattern?.offsets[first + a] ?? a;
        row[j] = row[j]! * fixed.d[i]! * fixed.d[i + j]! * c;
      }
      q[i] = q[i]! * fixed.d[i]! * c;
    }
    for (let r: number = 0; r < m; ++r) {
      const end: number = start[r + 1]!;
      let norm: number = 0;
      for (let a: number = start[r]!; a < end; ++a)
        norm = Math.max(norm, Math.abs(vals[a]! * d[cols[a]!]!));
      const scale: number = inverseScale(norm);
      dr[r] = scale;
      e[r] = scale;
      for (let a: number = start[r]!; a < end; ++a)
        vals[a] = vals[a]! * scale * d[cols[a]!]!;
    }
  }
  for (
    let pass: number = 0;
    pass < (fixed === undefined ? SCALING : 0);
    ++pass
  ) {
    // Infinity norms of the KKT columns determine variable and row scales.
    // A diagonal has one column target; its symmetric repeated max is idempotent.
    curvature.fill(0);
    for (let i: number = 0; i < n; ++i) {
      const row: Float64Array = p[i]!;
      curvature[i] = Math.max(curvature[i]!, Math.abs(row[0]!));
      const first: number = pPattern?.start[i] ?? 0;
      const end: number = diagonal
        ? 1
        : pPattern === undefined
          ? row.length
          : pPattern.start[i + 1]! - first;
      for (let a: number = 1; a < end; ++a) {
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
      dr[r] = inverseScale(row);
    }
    for (let i: number = 0; i < n; ++i) dx[i] = inverseScale(dx[i]!);

    // The cost reads these transformed entries; reduce them at their producer.
    curvature.fill(0);
    let linear: number = 0;
    for (let i: number = 0; i < n; ++i) {
      const row: Float64Array = p[i]!;
      const scale: number = dx[i]!;
      const value: number = row[0]! * scale * dx[i]!;
      row[0] = value;
      curvature[i] = Math.max(curvature[i]!, Math.abs(value));
      const first: number = pPattern?.start[i] ?? 0;
      const end: number = diagonal
        ? 1
        : pPattern === undefined
          ? row.length
          : pPattern.start[i + 1]! - first;
      for (let a: number = 1; a < end; ++a) {
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
    const norm: number = Math.max(mean, linear);
    const gamma: number = norm < MIN_SCALE ? 1 : 1 / Math.min(norm, MAX_SCALE);
    for (let i: number = 0; i < n; ++i) {
      const row: Float64Array = p[i]!;
      const first: number = pPattern?.start[i] ?? 0;
      const end: number = diagonal
        ? 1
        : pPattern === undefined
          ? row.length
          : pPattern.start[i + 1]! - first;
      for (let a: number = 0; a < end; ++a) {
        const j: number = pPattern?.offsets[first + a] ?? a;
        row[j] = row[j]! * gamma;
      }
      q[i] = q[i]! * gamma;
    }
    c *= gamma;
  }
  let sameMatrices: boolean = admitted.topology && previous!.core.band === band;
  for (let i: number = 0; i < n; ++i) {
    const matches: boolean = HumanQuadraticEquilibration.finite(
      p[i]!,
      "Scaled quadratic curvature",
      sameMatrices ? previous!.core.p[i] : undefined,
    );
    if (!matches) sameMatrices = false;
  }
  HumanQuadraticEquilibration.finite(q, "Scaled quadratic linear term");
  if (
    !HumanQuadraticEquilibration.finite(
      vals,
      "Scaled quadratic rows",
      sameMatrices ? previous!.core.vals : undefined,
    )
  )
    sameMatrices = false;
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
  if (sameMatrices) {
    p = previous!.core.p;
    vals = previous!.core.vals;
  }
  return {
    p: originalP,
    q: originalQ,
    vals: original,
    scaling,
    ...(fixed === undefined
      ? {}
      : { fixed: { d: Float64Array.from(fixed.d), c: fixed.c } }),
    core: {
      n,
      m,
      band,
      p,
      diagonal,
      pPattern,
      q,
      qNorm,
      unscaledQNorm,
      start,
      cols,
      vals,
      ordered,
      singleton,
      factorOrder,
      transpose,
      d,
      e,
      c,
      unscale,
    },
  };
}

/**
 * The equilibration of one quadratic program's data: exact-zero compression and
 * modified Ruiz scaling (Stellato et al. 2020, section 5.1, algorithm 2), and
 * the finite admission of what it produces, the numeric work
 * `HumanQuadraticPreparation` runs on a miss.
 */
export namespace HumanQuadraticEquilibration {
  /**
   * Reject nonfinite numeric data before retention can conceal it.
   *
   * @param values The buffer.
   * @param label What it is, for the refusal.
   * @param previous An admitted buffer to compare it with exactly.
   * @returns Whether the buffer equals `previous` entry by entry.
   * @throws {RangeError} At the first nonfinite entry.
   */
  export function finite(
    values: Float64Array,
    label: string,
    previous?: Float64Array,
  ): boolean {
    let same: boolean =
      previous !== undefined && previous.length === values.length;
    for (let i: number = 0; i < values.length; ++i) {
      const value: number = values[i]!;
      if (same && Object.is(value, previous![i])) continue;
      if (value !== 0 && !Number.isFinite(value))
        throw new RangeError(`${label} entry ${i} must be finite`);
      same = false;
    }
    return same;
  }
}

/**
 * Return the original reciprocal square root of a bounded Ruiz norm.
 *
 * Uses the existing minimum/maximum scale rule; norms below MIN_SCALE and
 * exactly one both produce exactly one in the original formula. Owns the
 * identical column/row norm transformation for all ten preparation passes; cost
 * equilibration retains its separate reciprocal norm. Folds only exact unit
 * results, with no approximate comparison or changed threshold; all other
 * values use the original min, square root and division association, including
 * nonfinite propagation. Takes O(1) time/space and avoids square root/division
 * for exact unit-scale rows/columns, including unchanged unit trust rows.
 * Reuses the generic norm transformation as one private function, retaining no
 * numeric input or cached result. Allocates and retains nothing; the current
 * scaling pass owns the returned dimensionless factor. States the unchanged
 * rule, exact unit cases, arithmetic order and ownership.
 */
function inverseScale(norm: number): number {
  return norm < MIN_SCALE || norm === 1
    ? 1
    : 1 / Math.sqrt(Math.min(norm, MAX_SCALE));
}

/** Passes of the Ruiz equilibration (OSQP's default). */
const SCALING: number = 10;

/** The range a norm is held within before it scales (OSQP's bounds). */
const MIN_SCALE: number = 1e-4;
const MAX_SCALE: number = 1e4;

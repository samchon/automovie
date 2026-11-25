import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import type { HumanQuadraticPreparation as Prep } from "./HumanQuadraticPreparation";

/** The record of `IHumanQuadraticAdmissionResult`'s site. */
type IHumanQuadraticAdmissionResult = {
  entries: number;
  same: boolean;
  curvature: boolean;
  linear: boolean;
  rows: boolean;
  topology: boolean;
};

/**
 * Validate all original entries and compare copied dependencies in one scan.
 *
 * @param problem Original storage, including padding and explicit zeros,
 *   unchanged throughout this synchronous call; readonly row-index arrays may
 *   be shared by consecutive rows.
 * @param prepared Optional copied candidate located by the owning Preparation
 *   cache.
 * @returns Nonzero count, complete numeric equality and exact
 *   curvature/linear/row/topology groups for safe independent raw-data reuse.
 * @throws {RangeError} For malformed dimensions, row storage, bounds, weights,
 *   nonfinite values, band violations or Int32 overflow.
 */
export function HumanQuadraticAdmission(
  problem: IAutoMovieMotionHumanQuadraticProgram.IProblem,
  prepared: Prep.IPrepared | undefined,
): IHumanQuadraticAdmissionResult {
  const {
    n,
    band,
    p,
    q,
    rows,
  }: IAutoMovieMotionHumanQuadraticProgram.IProblem = problem;
  if (
    n < 0 ||
    band < 0 ||
    p.length !== n ||
    q.length !== n ||
    rows.length > MAX_CSR
  )
    throw new RangeError("Malformed quadratic dimensions");
  const dimensions: boolean = prepared !== undefined && prepared.core.n === n;
  let curvature: boolean = dimensions && prepared!.core.band === band;
  let linear: boolean = dimensions;
  let topology: boolean = dimensions && prepared!.core.m === rows.length;
  let matchingRows: boolean = topology;
  for (let i: number = 0; i < n; ++i) {
    const row: Float64Array | undefined = p[i];
    const previous: Float64Array | undefined = curvature
      ? prepared!.p[i]
      : undefined;
    if (row === undefined || row.length < Math.min(band + 1, n - i))
      throw new RangeError(`Malformed quadratic curvature row ${i}`);
    const value: number = q[i]!;
    if (!linear || !Object.is(value, prepared!.q[i])) linear = false;
    if (curvature && row.length !== previous?.length) curvature = false;
    for (let j: number = 0; j < row.length; ++j) {
      const coefficient: number = row[j]!;
      if (curvature && Object.is(coefficient, previous![j])) continue;
      curvature = false;
    }
  }
  let entries: number = 0;
  let lastIndices: readonly number[] | undefined;
  for (let r: number = 0; r < rows.length; ++r) {
    const row: IAutoMovieMotionHumanQuadraticProgram.IRow | undefined = rows[r];
    if (row === undefined) throw new RangeError(`Malformed quadratic row ${r}`);
    const indices: readonly number[] = row.index;
    const coefficients: readonly number[] = row.coef;
    if (
      indices.length !== coefficients.length ||
      !(row.l < Infinity) ||
      !(row.u > -Infinity) ||
      row.l > row.u ||
      (row.weight !== undefined && !(row.weight >= 0))
    )
      throw new RangeError(`Malformed quadratic row ${r}`);

    // Consecutive rows may share one readonly variable domain. Its data and
    // n/band stay fixed for this call; no borrowed fact survives the return.
    const sharedIndices: boolean = indices === lastIndices;
    let first: number = Infinity;
    let last: number = -Infinity;
    let at: number = topology ? prepared!.core.start[r]! : 0;
    const end: number = topology ? prepared!.core.start[r + 1]! : 0;
    for (let a: number = 0; a < indices.length; ++a) {
      const index: number = indices[a]!;
      const coef: number = coefficients[a]!;
      const nonzero: boolean = coef !== 0;
      const knownIndex: boolean =
        nonzero && topology && at < end && index === prepared!.core.cols[at];
      const knownCoefficient: boolean =
        knownIndex && matchingRows && Object.is(coef, prepared!.vals[at]);
      if (
        !sharedIndices &&
        !knownIndex &&
        (index < 0 || index >= n || index > MAX_CSR)
      )
        throw new RangeError(`Malformed quadratic row ${r} entry ${a}`);
      if (!sharedIndices) {
        first = Math.min(first, index);
        last = Math.max(last, index);
      }
      if (nonzero) {
        ++entries;
        if (topology) {
          if (!knownIndex) {
            topology = false;
            matchingRows = false;
          } else if (matchingRows && !knownCoefficient) matchingRows = false;
          ++at;
        }
      }
    }
    if (topology && at !== end) {
      topology = false;
      matchingRows = false;
    }

    // Preserve the original band contract even when a distant entry is zero.
    if (!sharedIndices) {
      if (last - first > band)
        throw new RangeError(
          `Quadratic row ${r} couples variables beyond the band`,
        );
      lastIndices = indices;
    }
  }
  if (entries > MAX_CSR)
    throw new RangeError("Quadratic rows exceed Int32 storage");
  return {
    entries,
    same: curvature && linear && matchingRows,
    curvature,
    linear,
    rows: matchingRows,
    topology,
  };
}

/**
 * Maximum entry count and column index representable by the signed Int32 CSR
 * arrays.
 */
const MAX_CSR: number = 0x7fffffff;

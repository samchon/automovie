import type { HumanQuadraticPreparation as Prep } from "./HumanQuadraticPreparation";
import type { HumanQuadraticProgram as Q } from "./HumanQuadraticProgram";

/**
 * Validate all original entries and compare copied dependencies in one scan.
 *
 * @param problem Original numeric storage, including any supplied curvature padding and explicit zero row entries.
 * @param prepared Optional copied candidate located by the owning Preparation cache.
 * @returns Nonzero count, complete numeric equality and exact curvature/linear/row/topology groups for safe independent raw-data reuse.
 * @throws {RangeError} For malformed dimensions, row storage, bounds, weights, nonfinite values, band violations or Int32 overflow.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Admits every original storage fact before zero omission: exact numeric zero is finite, and strict equality with an admitted copied number/index proves its finite/integer/range facts. Other entries execute the original predicates; convexity remains a caller premise.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Combines whole-input admission and independent curvature, q, numeric-row and row-topology comparisons in one scan; the owning Preparation reuses only proven raw groups or the completely equal scaled core.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains complete zero-coefficient index/span, hole, padding and Int32 admission. Reused finite/index proofs require exact copied values with compatible dimensions, never source identity; unsorted duplicates and signed-zero P/q comparisons remain unchanged.
 * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(S+n+R+m) time for S supplied curvature entries, R original row entries and m rows, with scalar auxiliary storage and one fixed-size result object.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Curvature includes n/band, full row lengths and P values; q requires n and exact values; rows require n/m, ordered nonzero indices/values, while topology ignores values. Failed groups stop comparing without suppressing validation; all groups must match for scaled-core reuse, and bounds/weights refresh separately.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns six scalars and retains no original problem, row, candidate or resource after the synchronous call.
 * @evidence contracts/development/common.md#meaningful-documentation Defines original storage admission, independent exact dependency groups, original-zero validation, count/complete-match outputs and failures.
 */
export function HumanQuadraticAdmission(
  problem: Q.IProblem,
  prepared: Prep.IPrepared | undefined,
): {
  entries: number;
  same: boolean;
  curvature: boolean;
  linear: boolean;
  rows: boolean;
  topology: boolean;
} {
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
  const dimensions: boolean = prepared !== undefined && prepared.core.n === n;
  let curvature: boolean = dimensions && prepared!.core.band === band;
  let linear: boolean = dimensions;
  let topology: boolean = dimensions && prepared!.core.m === rows.length;
  let matchingRows: boolean = topology;
  for (let i: number = 0; i < n; ++i) {
    const row: Float64Array | undefined = p[i];
    const previous: Float64Array | undefined = curvature ? prepared!.p[i] : undefined;
    if (row === undefined || row.length < Math.min(band + 1, n - i))
      throw new RangeError(`Malformed quadratic curvature row ${i}`);
    const value: number = q[i]!;
    if (!linear || !Object.is(value, prepared!.q[i])) {
      if (value !== 0 && !Number.isFinite(value))
        throw new RangeError(`Quadratic linear term entry ${i} must be finite`);
      linear = false;
    }
    if (curvature && row.length !== previous?.length) curvature = false;
    for (let j: number = 0; j < row.length; ++j) {
      const coefficient: number = row[j]!;
      if (curvature && Object.is(coefficient, previous![j])) continue;
      if (coefficient !== 0 && !Number.isFinite(coefficient))
        throw new RangeError(
          `Quadratic curvature row ${i} entry ${j} must be finite`,
        );
      curvature = false;
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
    let at: number = topology ? prepared!.core.start[r]! : 0;
    const end: number = topology ? prepared!.core.start[r + 1]! : 0;
    for (let a: number = 0; a < row.index.length; ++a) {
      const index: number = row.index[a]!;
      const coef: number = row.coef[a]!;
      const nonzero: boolean = coef !== 0;
      const knownIndex: boolean = nonzero && topology && at < end &&
        index === prepared!.core.cols[at];
      const knownCoefficient: boolean = knownIndex && matchingRows &&
        Object.is(coef, prepared!.vals[at]);
      if (
        (!knownIndex && (
          !Number.isInteger(index) || index < 0 || index >= n || index > MAX_CSR
        )) ||
        (nonzero && !knownCoefficient && !Number.isFinite(coef))
      )
        throw new RangeError(`Malformed quadratic row ${r} entry ${a}`);
      first = Math.min(first, index);
      last = Math.max(last, index);
      if (nonzero) {
        ++entries;
        if (topology) {
          if (!knownIndex) {
            topology = false;
            matchingRows = false;
          } else if (matchingRows && !knownCoefficient)
            matchingRows = false;
          ++at;
        }
      }
    }
    if (topology && at !== end) {
      topology = false;
      matchingRows = false;
    }

    // Preserve the original band contract even when a distant entry is zero.
    if (last - first > band)
      throw new RangeError(
        `Quadratic row ${r} couples variables beyond the band`,
      );
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

/** Maximum entry count and column index representable by the signed Int32 CSR arrays. */
const MAX_CSR: number = 0x7fffffff;


import type { HumanQuadraticPreparation as Prep } from "./HumanQuadraticPreparation";
import type { HumanQuadraticProgram as Q } from "./HumanQuadraticProgram";

/**
 * Validate all original entries and compare copied dependencies in one scan.
 *
 * @param problem Original numeric storage, including any supplied curvature padding and explicit zero row entries.
 * @param prepared Optional copied candidate located by the owning Preparation cache.
 * @returns Nonzero row-entry count and whether every fixed numeric dependency exactly matches the candidate.
 * @throws {RangeError} For malformed dimensions, row storage, bounds, weights, nonfinite values, band violations or Int32 overflow.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Checks finite convex-program storage before zero omission, then compares copied P/q and ordered nonzero A; positive semidefiniteness remains the documented caller premise.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Combines whole-input admission and exact comparison in one scan for Preparation, so changed data never skip validation and a hit needs no second dependency traversal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Checks zero-coefficient indices, original spans, row holes and supplied padding; preserves unsorted duplicates and exact signed-zero P/q comparisons, rejecting Int32 overflow instead of truncating it.
 * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(S+n+R+m) time for S supplied curvature entries, R original row entries and m rows, with scalar auxiliary storage and one fixed-size result object.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Matching dimensions and every fixed numeric dependency prove reuse; source identity only located this candidate in Preparation. Bounds and weights are admitted here but refresh independently of matrix equivalence.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns only two scalars and retains no original problem, row, candidate or resource after the synchronous call.
 * @evidence contracts/development/common.md#meaningful-documentation Defines original-storage admission, exact comparison, original-zero validation, count/match outputs and failure conditions.
 */
export function HumanQuadraticAdmission(
  problem: Q.IProblem,
  prepared: Prep.IPrepared | undefined,
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
    const previous: Float64Array | undefined = same ? prepared!.p[i] : undefined;
    if (row === undefined || row.length < Math.min(band + 1, n - i))
      throw new RangeError(`Malformed quadratic curvature row ${i}`);
    if (!Number.isFinite(q[i]!))
      throw new RangeError(`Quadratic linear term entry ${i} must be finite`);
    if (same && (!Object.is(q[i], prepared!.q[i]) || row.length !== previous?.length))
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
    let at: number = same ? prepared!.core.start[r]! : 0;
    const end: number = same ? prepared!.core.start[r + 1]! : 0;
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
        if (same) {
          if (
            at >= end ||
            index !== prepared!.core.cols[at] ||
            !Object.is(coef, prepared!.vals[at])
          )
            same = false;
          ++at;
        }
      }
    }
    if (same && at !== end) same = false;

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

/** Maximum entry count and column index representable by the signed Int32 CSR arrays. */
const MAX_CSR: number = 0x7fffffff;


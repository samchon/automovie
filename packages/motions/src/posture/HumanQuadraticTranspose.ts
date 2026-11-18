import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";

/**
 * Prepare column gathers in the original CSR contribution order. Each
 * column retains increasing row and original entry positions, including
 * duplicates, so a scalar accumulator sees exactly the original scatter
 * sequence. Coefficients stay in their owning scaled CSR buffer.
 *
 * @param n Admitted variable count.
 * @param start Original CSR offsets, one per row and a final end.
 * @param cols Original admitted columns, with at most Int32 entries.
 * @returns Column offsets and parallel source row/CSR positions, independent of coefficient values.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Stable counting scatter groups original CSR positions by their column, preserving each column's original row/duplicate sequence for exactly associated A-transpose products.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns topology-only column preparation for Preparation and the ADMM rhs consumer; scaled coefficients remain in CSR, and exceptional nonfinite products keep their original raw-row owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Groups exact integer columns without combining coefficients, reassociating products, sorting duplicates or omitting a stored contribution; no solver parameter or admission is changed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(n+m+Z) time and O(n+Z) retained integers for Z CSR entries, with no temporary numeric arrays; the prefix doubles as insertion cursors and is restored before returning.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Depends only on admitted n and original CSR offsets/columns; Preparation reuses the result only after exact topology equality, independently of coefficients, q, bounds, weights and rho.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one n+1 prefix and two Z-entry integer buffers owned by the immutable numeric topology; it retains no source array, problem, iterate or intermediate cursor after the synchronous call.
 * @evidence contracts/development/common.md#meaningful-documentation Defines original contribution ordering, duplicate preservation, dimensions, coefficient indirection, exact dependency key and bounded ownership.
 */
export function HumanQuadraticTranspose(
  n: number,
  start: Int32Array,
  cols: Int32Array,
): B.IScaled["transpose"] {
  const offsets: Int32Array = new Int32Array(n + 1);
  for (let a: number = 0; a < cols.length; ++a) ++offsets[cols[a]! + 1]!;
  for (let i: number = 0; i < n; ++i) offsets[i + 1]! += offsets[i]!;
  const rows: Int32Array = new Int32Array(cols.length);
  const entries: Int32Array = new Int32Array(cols.length);
  for (let r: number = 0; r + 1 < start.length; ++r) {
    const end: number = start[r + 1]!;
    for (let a: number = start[r]!; a < end; ++a) {
      const column: number = cols[a]!;
      const at: number = offsets[column]!;
      rows[at] = r;
      entries[at] = a;
      offsets[column] = at + 1;
    }
  }

  // Every insertion cursor now equals its column end; shift the ends back
  // into a prefix without allocating a second n-entry cursor vector.
  for (let i: number = n; i > 0; --i) offsets[i] = offsets[i - 1]!;
  offsets[0] = 0;
  return { start: offsets, rows, entries };
}

import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";

/**
 * Prepare factor-only entry positions for rows not already column-ordered.
 * Sorting by column and original CSR position preserves the exact order of
 * duplicate coefficients. Each upper K(i,j) cell still sees its original
 * a-at-i then b-at-j contribution sequence; writes to other cells commute.
 * ADMM and residual products continue reading the untouched original CSR.
 *
 * @param start Admitted original CSR row offsets, m+1 entries.
 * @param cols Admitted original CSR columns; stored entry positions fit Int32.
 * @param ordered One for nondecreasing original columns, zero otherwise, one per row.
 * @returns Packed original entry positions for unordered rows; absent when all rows already have the factor order.
 *
 * @evidence contracts/development/implementation.md#principled-implementation A symmetric row outer product assigns K(i,j) only from a entries at i and b entries at j. Stable column/original-position order preserves each cell's scalar accumulation order while omitting only lower-triangle pairs; original zero restoration stays with Row.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns factor-only index preparation for Preparation and Row; original CSR columns and values remain untouched for every ordered dot product and exceptional raw-row traversal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Orders by exact integer columns with original position as an explicit tie-break, preserving unsorted duplicates without coefficient merging, reassociation, tolerance changes or changed ADMM row order.
 * @evidence contracts/development/implementation.md#efficient-algorithms For Zu entries in unordered rows of lengths k_r, costs O(m+Zu+sum(k_r log k_r)) time and O(m+Zu) retained integers. Already ordered rows allocate no per-row ordering, and one topology preparation serves repeated factors.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Metadata depends only on admitted row offsets and column sequence; Preparation reuses it only with exact matching topology, independently of changed coefficients, q, bounds or rho.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one prefix and one position buffer, at most m+1 and Z entries respectively; temporary sorting views release after the synchronous call, and the numeric core owns the returned metadata until collection.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the factor-only role, per-cell arithmetic-order proof, duplicate tie-break, original CSR preservation, dimensions and ownership.
 */
export function HumanQuadraticFactorOrder(
  start: Int32Array,
  cols: Int32Array,
  ordered: Uint8Array,
): B.IScaled["factorOrder"] {
  let size: number = 0;
  for (let r: number = 0; r < ordered.length; ++r)
    if (ordered[r] === 0) size += start[r + 1]! - start[r]!;
  if (size === 0) return undefined;
  const offsets: Int32Array = new Int32Array(ordered.length + 1);
  const entries: Int32Array = new Int32Array(size);
  let cursor: number = 0;
  for (let r: number = 0; r < ordered.length; ++r) {
    offsets[r] = cursor;
    if (ordered[r] !== 0) continue;
    const first: number = cursor;
    const end: number = start[r + 1]!;
    for (let a: number = start[r]!; a < end; ++a) entries[cursor++] = a;
    entries.subarray(first, cursor).sort(
      (a: number, b: number): number => cols[a]! - cols[b]! || a - b,
    );
  }
  offsets[ordered.length] = cursor;
  return { start: offsets, entries };
}

import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";

/*
 * Prepare factor-only entry positions for rows not already column-ordered.
 * Sorting by column and original CSR position preserves the exact order of
 * duplicate coefficients. Each upper K(i,j) cell still sees its original a-at-i
 * then b-at-j contribution sequence; writes to other cells commute. ADMM and
 * residual products continue reading the untouched original CSR.
 * Parameter start: Admitted original CSR row offsets, m+1 entries.
 * Parameter cols: Admitted original CSR columns; stored entry positions fit Int32.
 * Parameter ordered: One for nondecreasing original columns, zero otherwise, one
 * per row.
 * Returns: Packed original entry positions for unordered rows; absent when all
 * rows already have the factor order.
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
    entries
      .subarray(first, cursor)
      .sort((a: number, b: number): number => cols[a]! - cols[b]! || a - b);
  }
  offsets[ordered.length] = cursor;
  return { start: offsets, entries };
}

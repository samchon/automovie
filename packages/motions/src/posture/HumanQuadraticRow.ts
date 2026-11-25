import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";

/**
 * Add one weighted row outer product to a banded reduced system. The ADMM and
 * polishing systems both use this operation (Stellato et al. 2020, sections 3.1
 * and 4). An ordered row begins at its first equal column, retaining earlier
 * duplicate-column products. Unsorted rows may borrow a factor-only stable
 * column/original-position order: every K(i,j) cell sees the same a-at-i/b-at-j
 * sequence, while other cells' writes commute. Original CSR dot products remain
 * untouched, and absent metadata keeps the original unsorted traversal.
 *
 * @param s Admitted scaled rows, with ordering metadata for their unchanged CSR
 *   sequence.
 * @param k Owned upper-band system, distinct from the read-only scaled
 *   matrices.
 * @param r Row index in the scaled problem.
 * @param w Current rho or polishing row weight, multiplied on the left.
 */
export function HumanQuadraticRow(
  s: B.IScaled,
  k: Float64Array[],
  r: number,
  w: number,
): void {
  const single: number = s.singleton[r]!;
  if (single >= 0) {
    const coefficient: number = s.vals[single]!;
    const row: Float64Array = k[s.cols[single]!]!;
    row[0] = row[0]! + w * coefficient * coefficient;
    return;
  }
  const begin: number = s.start[r]!;
  let first: number = begin;
  const end: number = s.start[r + 1]!;
  const ordered: boolean = s.ordered[r] === 1;
  const order: B.IScaled["factorOrder"] = ordered ? undefined : s.factorOrder;
  const orderStart: number = order?.start[r] ?? 0;
  for (let a: number = begin; a < end; ++a) {
    const position: number =
      order === undefined ? a : order.entries[orderStart + a - begin]!;
    const i: number = s.cols[position]!;
    const row: Float64Array = k[i]!;
    const weighted: number = w * s.vals[position]!;
    if (order !== undefined) {
      while (s.cols[order.entries[orderStart + first - begin]!]! < i) ++first;
      for (let b: number = first; b < end; ++b) {
        const other: number = order.entries[orderStart + b - begin]!;
        const offset: number = s.cols[other]! - i;
        row[offset] = row[offset]! + weighted * s.vals[other]!;
      }
    } else if (ordered) {
      while (s.cols[first]! < i) ++first;
      for (let b: number = first; b < end; ++b) {
        const offset: number = s.cols[b]! - i;
        row[offset] = row[offset]! + weighted * s.vals[b]!;
      }
    } else
      for (let b: number = first; b < end; ++b) {
        const j: number = s.cols[b]!;
        if (j < i) continue;
        const offset: number = j - i;
        row[offset] = row[offset]! + weighted * s.vals[b]!;
      }
  }
}

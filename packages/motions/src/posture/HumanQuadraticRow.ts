import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import { HumanQuadraticEntries } from "./HumanQuadraticEntries";

/**
 * Add one weighted row outer product to a banded reduced system. The ADMM
 * and polishing systems both use this operation (Stellato et al. 2020,
 * sections 3.1 and 4). An ordered row begins at its first equal column,
 * retaining earlier duplicate-column products. Unsorted rows may borrow a
 * factor-only stable column/original-position order: every K(i,j) cell sees
 * the same a-at-i/b-at-j sequence, while other cells' writes commute.
 * Original CSR dot products remain untouched, and absent metadata keeps the
 * original unsorted traversal.
 *
 * @param s Admitted scaled rows, with ordering metadata for their unchanged CSR sequence.
 * @param k Owned upper-band system, distinct from the read-only scaled matrices.
 * @param r Row index in the scaled problem.
 * @param w Current rho or polishing row weight, multiplied on the left.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Accumulates the symmetric weighted row outer product in the stored upper band, including all cross products of duplicate variable indices.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns one weighted scatter and exceptional original-zero path for Band.factor/polish; Preparation owns admission and FactorOrder owns optional stable factor-only positions, leaving all row dot products unchanged.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves accumulation order, (w*coef[a])*coef[b] association and unsorted fallback; Admission already checks every original index and span, so assembly does not repeat band admission per pair. Overflowing first products restore original zero b terms rather than hiding nonfinite propagation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Finite rows cost O(k squared) worst-case with O(1) local storage; original or factor-only ordered positions avoid visiting lower pairs. Metadata is prepared once per topology, while exceptional weighted products may restore/scan H original b entries, bounded by O(H squared).
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses exact singleton/column-order metadata tied to admitted original CSR topology, including stable duplicate order; every current weighted product recomputes, and exceptional coefficients borrow only the owning unchanged raw layout.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Normal calls allocate nothing and mutate only the owned system; exceptional restoration belongs to its one-shot wrapper or fixed-model owner, without entering prepared core, body state or public iterates.
 * @evidence contracts/development/common.md#meaningful-documentation Defines both system consumers, weighted products, per-cell duplicate/order equivalence, admitted-band premise and original exceptional traversal.
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
    const weighted: number = w * coefficient;
    if (Number.isFinite(weighted)) {
      const row: Float64Array = k[s.cols[single]!]!;
      row[0] = row[0]! + weighted * coefficient;
      return;
    }
  }
  const begin: number = s.start[r]!;
  let first: number = begin;
  const end: number = s.start[r + 1]!;
  const ordered: boolean = s.ordered[r] === 1;
  const order: B.IScaled["factorOrder"] = ordered ? undefined : s.factorOrder;
  const orderStart: number = order?.start[r] ?? 0;
  for (let a: number = begin; a < end; ++a) {
    const position: number = order === undefined ? a : order.entries[orderStart + a - begin]!;
    const i: number = s.cols[position]!;
    const row: Float64Array = k[i]!;
    const weighted: number = w * s.vals[position]!;
    if (!Number.isFinite(weighted)) {
      const original: ReturnType<typeof HumanQuadraticEntries> = HumanQuadraticEntries(s, r);
      for (let b: number = 0; b < original.index.length; ++b) {
        const j: number = original.index[b]!;
        if (j < i) continue;
        const offset: number = j - i;
        row[offset] = row[offset]! + weighted * original.coef[b]!;
      }
      continue;
    }
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

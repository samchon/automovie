import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import { HumanQuadraticEntries } from "./HumanQuadraticEntries";

/**
 * Add one weighted row outer product to a banded reduced system. The ADMM
 * and polishing systems both use this operation (Stellato et al. 2020,
 * sections 3.1 and 4). An ordered row begins at its first equal column,
 * retaining earlier duplicate-column products; an unsorted row retains the
 * full original traversal and lower-triangle continue.
 *
 * @param s Admitted scaled rows, with ordering metadata for their unchanged CSR sequence.
 * @param k Owned upper-band system, distinct from the read-only scaled matrices.
 * @param r Row index in the scaled problem.
 * @param w Current rho or polishing row weight, multiplied on the left.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Accumulates the symmetric weighted row outer product in the stored upper band, including all cross products of duplicate variable indices.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns the weighted outer-product kernel shared by Band.factor and Band.polish, while Preparation owns original-input admission and CSR metadata.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves accumulation order, (w*coef[a])*coef[b] association and unsorted fallback; Admission already checks every original index and span, so assembly does not repeat band admission per pair. Overflowing first products restore original zero b terms rather than hiding nonfinite propagation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Finite rows take O(k squared) time and O(1) auxiliary storage for k CSR entries; ordered rows skip only lower-triangle continues. An overflowing weighted product scans its H original b entries and may acquire one O(H) restored row, bounded by O(H squared) work overall.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Hoists CSR bounds and uses exact singleton/ordering metadata while rebuilding every current weighted product; exceptional original coefficients share only the owning unchanged raw layout, never a product from another weight or solve.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Normal calls allocate nothing and mutate only the owned system; exceptional restoration belongs to its one-shot wrapper or fixed-model owner, without entering prepared core, body state or public iterates.
 * @evidence contracts/development/common.md#meaningful-documentation Defines both actual system consumers, weighted product, duplicate ordering, admitted-band premise and exact singleton/ordered paths.
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
  let first: number = s.start[r]!;
  const end: number = s.start[r + 1]!;
  const ordered: boolean = s.ordered[r] === 1;
  for (let a: number = first; a < end; ++a) {
    const i: number = s.cols[a]!;
    const row: Float64Array = k[i]!;
    const weighted: number = w * s.vals[a]!;
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
    if (ordered) {
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

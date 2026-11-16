import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";

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
 * @throws {Error} When a retained row couples variables beyond the band.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Accumulates the symmetric weighted row outer product in the stored upper band, including all cross products of duplicate variable indices.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns the weighted outer-product kernel shared by Band.factor and Band.polish, while Preparation owns original-input admission and CSR metadata.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the original accumulation order and multiplication association (w*coef[a])*coef[b], the band rejection and unsorted fallback; no coefficient or valid product is dropped.
 * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(k squared) time and O(1) auxiliary storage for k entries; nondecreasing rows skip only the original lower-triangle continue range with an amortized O(k) first-equal cursor.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Hoists the unchanged CSR row end and uses ordering metadata derived from its exact sequence, but recomputes weighted products for each current w; no numeric product is reused after the row weight changes.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates nothing, mutates only the supplied owned system and retains no row, matrix, body or global state.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the two actual system consumers, weighted product, duplicate ordering, fast-path invariant and band failure.
 */
export function HumanQuadraticRow(
  s: B.IScaled,
  k: Float64Array[],
  r: number,
  w: number,
): void {
  let first: number = s.start[r]!;
  const end: number = s.start[r + 1]!;
  const ordered: boolean = s.ordered[r] === 1;
  for (let a: number = first; a < end; ++a) {
    const i: number = s.cols[a]!;
    const row: Float64Array = k[i]!;
    const weighted: number = w * s.vals[a]!;
    if (ordered) while (s.cols[first]! < i) ++first;
    for (let b: number = first; b < end; ++b) {
      const j: number = s.cols[b]!;
      if (j < i) continue;
      const offset: number = j - i;
      if (offset > s.band)
        throw new Error("A row couples variables beyond the band");
      row[offset] = row[offset]! + weighted * s.vals[b]!;
    }
  }
}

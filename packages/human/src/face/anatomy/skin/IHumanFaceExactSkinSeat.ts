import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";

/**
 * Exact barycentric correspondence on one native host triangle. Chart lifting retains rational weights until the host reads a head-frame point once. The same triangle supplies its existing corner-normal field. This internal correspondence is not a personal authoring input.
 *
 * @evidence contracts/common.md#principled-implementation A native triangle and exact represented barycentric fractions identify one material seat.
 * @evidence contracts/common.md#clear-and-simple-design Chart walking and exact host frame interpolation share this internal attachment representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Weights encode the represented affine sum, not a clinically acquired point or exact unit-normal direction.
 * @evidence contracts/common.md#meaningful-documentation Triangle identity stays native and fractions sum to one before exact-coordinate interpolation rounds once.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Rational interpolation and frame construction execute in the chart/host owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same seat feeds exact physical frame acquisition without performed nearest-surface reselection.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased record owns no mesh; consumers retain its small fractions and borrow immutable host incidence.
 *
 * @author Samchon
 */
export interface IHumanFaceExactSkinSeat {
  /** Ordinal in the host's actual complete triangle winding. */
  triangle: number;

  /** Exact affine weights of those three corners, summing to one. */
  weights: readonly [
    IHumanExactFraction,
    IHumanExactFraction,
    IHumanExactFraction,
  ];
}

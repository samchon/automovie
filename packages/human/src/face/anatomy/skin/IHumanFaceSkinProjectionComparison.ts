import type { IHumanPolynomialRoot } from "../../../common/measure/IHumanPolynomialRoot";
import type { IHumanFaceSkinProjectionOwnership } from "./IHumanFaceSkinProjectionOwnership";

/**
 * Certified signs of two native rational squared-distance quadratics,
 * their root enclosures and clipped interval partitions. Clearing rational
 * denominators retains the same exact distance order as the projection
 * owner; independently rounded affine geometry does not enter comparison.
 *
 * @evidence contracts/common.md#principled-implementation Exact rational distance differences reduce to an integer quadratic; root enclosures and exact signs distinguish crossing, tangency and whole-domain equality before represented boundaries are emitted.
 * @evidence contracts/common.md#clear-and-simple-design Root proof, scalar sign and overlap partition share one pair polynomial instead of independently rounded geometric comparisons.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Crossing separation refuses when binary64 boundaries cannot preserve order; an isolated tangent is not mistaken for changed ownership or a whole-domain tie.
 * @evidence contracts/common.md#meaningful-documentation The API explains root-list meaning, closed guide bounds, first-versus-second sign and actual-overlap partitioning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This comparison interface implements no root isolation; its producer owns exact arithmetic cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no cache; its envelope shares the concrete pair result within one guide.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Polynomial and root retention belong to the comparator closure and guide-local owner.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinProjectionComparison {
  /**
   * Finite root-bearing enclosures of a non-identical polynomial on the full
   * guide, including tangencies and boundary roots. An identical polynomial
   * has no isolated root list: this is empty while sign and every partition
   * interval report zero for its whole-interval tie.
   */
  rootIntervals: readonly IHumanPolynomialRoot[];

  /**
   * Partition the actual validity overlap with certified open-interval ownership.
   * Distinct crossing events require distinct represented boundaries. Tangencies
   * retain their root proof without changing open-interval ownership.
   *
   * @evidence contracts/common.md#principled-implementation The comparator clips exact root enclosures to a finite overlap and certifies each open-interval sign; equal bounds return an empty partition and invalid bounds refuse.
   * @evidence contracts/common.md#clear-and-simple-design Validity clipping is separate from the retained pair polynomial so fragmented overlaps share the same root proof.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact crossing counts detect merged or unordered represented roots; no rounded midpoint tie chooses a nonzero-width interval.
   * @evidence contracts/common.md#meaningful-documentation The comment states actual validity overlap, represented crossing separation and tangent ownership semantics.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature implements no partition scan; the comparator owns bounded quadratic-event processing and rational bit cost.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This signature schedules no work; existing pair coefficients and root enclosures are read by the implementation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Partition output arrays belong to the caller and acquire no external resource.
   */
  partition(
    lower: number,
    upper: number,
  ): readonly IHumanFaceSkinProjectionOwnership[];

  /**
   * Negative means the first feature is nearer; zero is an exact distance tie.
   * Parameters outside [0,1] or nonfinite parameters refuse.
   *
   * @evidence contracts/common.md#principled-implementation An admitted binary64 parameter converts to a rational and evaluates the retained integer distance-difference polynomial exactly.
   * @evidence contracts/common.md#clear-and-simple-design The scalar reader shares the same coefficients as root partitioning rather than recomputing two geometric distances.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero is an exact polynomial tie at the supplied parameter, not a floating tolerance or clinical equivalence claim.
   * @evidence contracts/common.md#meaningful-documentation The comment defines sign direction and refusal for nonfinite or out-of-guide parameters.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The method signature implements no polynomial evaluation; the comparator owns its fixed-degree rational arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature coordinates no request cache and reads its producer's existing coefficients.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returning a numeric sign retains no resource; polynomial closure ownership remains with the comparator.
   */
  sign(parameter: number): number;
}

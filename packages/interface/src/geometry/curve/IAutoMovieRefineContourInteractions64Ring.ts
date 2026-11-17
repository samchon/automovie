import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * Source-owned cyclic ring mutated by interaction refinement. Callers provide
 * finite admitted noncollapsed boundary samples in a common millimetre frame;
 * this structural view does not perform geometric admission.
 *
 * @evidence contracts/development/design.md#principled-representation Declared winding selects forward or reverse replacement order while stable point identities connect samples to source restrictions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface refineAutoMovieContourInteractions64 reads identity, points and winding; generic subtypes preserve source-owner callback data without copying rings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Source subdivision retains shared endpoints and does not infer a new winding or certify separation beyond projected chord tests.
 * @evidence contracts/development/common.md#meaningful-documentation Defines caller admission premises, shared mutation and winding-dependent replacement order.
 */
export interface IAutoMovieRefineContourInteractions64Ring {
  /** Stable generated ring identity retained while its shared source restrictions are refined. */
  id: string;
  /** Mutable cyclic millimetre samples. The register callback and ring splice share new source-derived knots across all consumers of this ring object. */
  points: AutoMovieVector3Tuple[];
  /** Declared signed winding governing boundary order; this number is not inferred from a fresh polygon area computation. */
  winding: number;
}

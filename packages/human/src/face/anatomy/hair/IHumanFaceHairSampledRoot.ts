import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRootReference } from "./IHumanFaceHairRootReference";

/**
 * One neutral-area root whose sequence survives subsequent mask and shape changes.
 *
 * @evidence contracts/common.md#principled-implementation Sequence identity and the source triangle's three weights retain one root through mask and shape changes.
 * @evidence contracts/common.md#clear-and-simple-design Extends the shared root reference with the sampler's sequence and neutral vectors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No authored personal vertex replaces the source seat.
 * @evidence contracts/common.md#meaningful-documentation States sequence stability, corner order and neutral vector units.
 * @evidence contracts/modeling.md#spatial-conventions Source point is neutral head-frame metres, normal is unit direction and weights are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The strand producer owns part identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels The root is sampled output rather than a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The sampler owns population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Seating and root-support owners consume the reference.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair consumer observes output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical sampling does not assert follicle measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record admits no biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority These are derived source references.
 *
 * @author Samchon
 */
export interface IHumanFaceHairSampledRoot extends IHumanFaceHairRootReference {
  /** Deterministic sample sequence used for independent strand variation. */
  sequence: number;

  /** Three barycentric weights in the source triangle's original corner order. */
  weights: [number, number, number];

  /** Neutral root position, head-frame metres. */
  point: IAutoMovieVector3;

  /** Neutral outward unit direction of the original oriented triangle. */
  normal: IAutoMovieVector3;
}

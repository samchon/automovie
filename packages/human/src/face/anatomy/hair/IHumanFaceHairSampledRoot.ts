import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRootReference } from "./IHumanFaceHairRootReference";

/**
 * One neutral-area root whose sequence survives subsequent mask and shape changes.
 *
 * @evidence contracts/common.md#principled-implementation Neutral-area sampling records sequence identity, original triangle weights, point and outward normal for later seating.
 * @evidence contracts/common.md#clear-and-simple-design Sampling and live seating are separate stages, preserving sampler identity when masks or shape change.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The point is a numerical neutral attachment, not personal authored data or a measured follicle location.
 * @evidence contracts/common.md#meaningful-documentation Weights keep original corner order; sequence drives independent variation and coordinates use head metres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Area-CDF selection and barycentric sampling are executed by createHumanFaceHairRoots.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Sequence identity preserves retained roots' variation; this result type does not coordinate sampling requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The root population owns its weights and vectors until the caller releases it.
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

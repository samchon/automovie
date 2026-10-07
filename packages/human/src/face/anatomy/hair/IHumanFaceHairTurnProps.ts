import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRootedSteering } from "./IHumanFaceHairRootedSteering";

/**
 * Construction-turn input reusing the rooted steering's preceding direction.
 *
 * @evidence contracts/common.md#principled-implementation Before retains the existing steering direction and step carries the construction length without importing a collider-epsilon precondition.
 * @evidence contracts/common.md#clear-and-simple-design Reuses the shared preceding direction while naming this calculation's requested heading and length.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record transports the actual integration input, not a correction answer.
 * @evidence contracts/common.md#meaningful-documentation Identifies the requested direction and its inherited construction-step context.
 * @evidence contracts/modeling.md#spatial-conventions Directions are head-frame unit vectors and the construction step is metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels This internal construction state defines no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The turn owner computes a direction.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The contact owner controls attachment.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair consumer observes geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Construction directions establish no biological curvature.
 * @evidenceExclude contracts/anatomy.md#permitted-range No clinical range is asserted.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is computed integration input.
 *
 * @author Samchon
 */
export interface IHumanFaceHairTurnProps extends Pick<
  IHumanFaceHairRootedSteering,
  "before"
> {
  /** Requested unit travel direction in the same head frame. */
  direction: IAutoMovieVector3;

  /** Construction length in metres; this direction calculation adds no collider-epsilon precondition. */
  step: number;
}

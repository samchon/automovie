import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The visible eye's spherical curvature basis, in construction millimetres.
 * A fitted surface radius is a portrait control, not a measured globe diameter.
 *
 * @evidence contracts/common.md#principled-implementation A sphere is its centre and a positive radius, which is all the height and ray-intersection formulas use.
 * @evidence contracts/common.md#clear-and-simple-design Two fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitEyeSphere carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States the frame, that the radius is a portrait control and not a measured globe diameter and that the centre lies behind the lid opening.
 * @evidence contracts/modeling.md#spatial-conventions Centre and radius are construction millimetres in the head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitEyeSphere is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitEyeSphere carries no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitEyeSphere decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitEyeSphere constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitEyeSphere is a declaration and displays nothing itself; the parts built from it are observed by their owners.
 * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitEyeSphere defines no input through which a caller shapes a human form.
 * @author Samchon
 */
export interface IPortraitEyeSphere {
  /** Sphere centre behind the fitted lid opening. */
  center: IAutoMovieVector3;

  /** Positive spherical surface radius in millimetres. */
  radius: number;
}

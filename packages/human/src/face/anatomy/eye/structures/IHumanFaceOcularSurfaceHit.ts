import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Nearest point of one analytic ocular exterior to a queried point.
 * Head-frame metres. `signedDistance` is negative inside the cap-replaced
 * solid. Numerical meridian uncertainty is separate from tissue clearance.
 *
 * @evidence contracts/common.md#principled-implementation Foot, outward normal and signed distance are the complete first-order description of a point relative to a smooth surface.
 * @evidence contracts/common.md#clear-and-simple-design Foot, normal, represented signed distance and numerical uncertainty form one query result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no tolerance and no classification.
 * @evidence contracts/common.md#meaningful-documentation States frame, unit and sign.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame metres; the normal is a unit vector pointing out of the globe.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A query result defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The surface owner defines the boundary this reads.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical transport.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Geometry of an already admitted optical profile.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no input.
 *
 * @author Samchon
 */
export interface IHumanFaceOcularSurfaceHit {
  /** Nearest point on the exterior. */
  point: IAutoMovieVector3;

  /** Unit outward normal of the exterior at that point. */
  normal: IAutoMovieVector3;

  /** Distance to the exterior, negative inside it. */
  signedDistance: number;

  /** Certified meridian root/evaluation uncertainty; not a tissue clearance or tolerance. */
  distanceErrorMetres: number;
}

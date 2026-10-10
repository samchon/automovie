import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Nearest point of one analytic ocular exterior to a queried point.
 * Head-frame metres. `signedDistance` is negative inside the cap-replaced
 * solid. Numerical meridian uncertainty is separate from tissue clearance.
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

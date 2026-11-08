import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * An admitted world-space metre sphere for spring positional collision projection. Inflation adds the driver's joint hitRadius; this is not an impulse or iterative multi-contact solver.
 *
 * @evidence contracts/development/design.md#principled-representation Represent one admitted world-space collision sphere; stepSpring projects a penetrating joint outward by sphere radius plus that driver's hitRadius.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A centre/radius pair is the numerical seam between node attachment resolution and spring collision response.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This positional projection is not a full collision/impulse solver and the single collision pass can alter the preceding segment-length projection.
 * @evidence contracts/development/common.md#meaningful-documentation Members state world-space metre centre and positive metre radius; driver thickness remains a separate inflation value.
 */
export interface IAutoMovieSpringSphere {
  /** Sphere center in world space. */
  center: IAutoMovieVector3;

  /** Sphere radius, meters. Strictly positive. */
  radius: number;
}

import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * An admitted world-space metre sphere for spring positional collision projection. Inflation adds the driver's joint hitRadius; this is not an impulse or iterative multi-contact solver.
 *
 * @evidence contracts/common.md#principled-implementation Represent one admitted world-space collision sphere; stepSpring projects a penetrating joint outward by sphere radius plus that driver's hitRadius.
 * @evidence contracts/common.md#clear-and-simple-design A centre/radius pair is the numerical seam between node attachment resolution and spring collision response.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This positional projection is not a full collision/impulse solver and the single collision pass can alter the preceding segment-length projection.
 * @evidence contracts/common.md#meaningful-documentation Members state world-space metre centre and positive metre radius; driver thickness remains a separate inflation value.
 * @evidence contracts/performance.md#efficient-algorithms A sphere occupies fixed vector/scalar storage; the producer/stepper performs O(C) creation and O(J*C) collision checks.
 * @evidence contracts/performance.md#reuse-equivalent-work One resolved sphere list is shared by spring drivers within the same frame, with no assumption that later frames have identical centres.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Frame-local sphere records retain no source nodes, native collision bodies or running tasks; the caller releases the array after stepping.
 */
export interface IAutoMovieSpringSphere {
  /** Sphere center in world space. */
  center: IAutoMovieVector3;

  /** Sphere radius, meters. Strictly positive. */
  radius: number;
}

import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Readings of the closed section loop nearest a seed point.
 *
 * The perimeter follows the contour into every concavity; the girth is the
 * perimeter of the loop's convex hull in the plane, which is what a tape
 * pulled around the body reads. Breadth is the loop's X extent and back its
 * rearmost Z, since the body faces +Z.
 *
 *
 * @evidence contracts/common.md#principled-implementation The result reports the closed loop nearest the seed: contour perimeter, convex-hull tape girth, X breadth, rearmost Z and mean crossing point in a +Z-forward frame.
 * @evidence contracts/common.md#clear-and-simple-design Distinct contour and hull metrics remain explicit rather than overloading one length; measureHumanSection owns selection and computation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No population girth or expected body profile replaces the actual closed-loop metrics.
 * @evidence contracts/common.md#meaningful-documentation The comments explain concavity versus tape behavior, +Z frame, centroid convention and metre units for each member.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This section-result interface performs no loop walk or hull sort.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Stored metrics define no cross-plane reuse; the producing section's geometry and seed decide which loop they describe.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The concrete reading holds scalar/vector results only, with no acquired mesh buffers, handles or tasks.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSectionReading {
  /** Contour length into every concavity, in metres. */
  perimeter: number;

  /** Convex-hull perimeter in the plane, the tape girth, in metres. */
  girth: number;

  /** Loop extent along X, in metres. */
  breadth: number;

  /** Rearmost loop Z, in metres. */
  back: number;

  /** Mean of the loop's crossing points, in metres. */
  centroid: IAutoMovieVector3;
}

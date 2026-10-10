import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Readings of the closed section loop nearest a seed point.
 *
 * The perimeter follows the contour into every concavity; the girth is the
 * perimeter of the loop's convex hull in the plane, which is what a tape
 * pulled around the body reads. Breadth is the loop's X extent and back its
 * rearmost Z, since the body faces +Z.
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

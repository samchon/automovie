import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Readings of the closed section loop nearest a seed point.
 *
 * The perimeter follows the contour into every concavity; the girth is the
 * perimeter of the loop's convex hull in the plane, which is what a tape
 * pulled around the body reads. Breadth is the loop's X extent and back its
 * rearmost Z, since the body faces +Z.
 *
 * @evidence contracts/common.md#principled-implementation Perimeter and tape girth are the contour and convex-hull perimeters of one exact planar loop.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces the section instrument's anonymous result type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No landmark or expected girth is encoded in the reading.
 * @evidence contracts/common.md#meaningful-documentation States each reading's definition, the tape convention and the facing direction.
 * @evidence contracts/modeling.md#spatial-conventions Every length and coordinate is metres in the surface's Y-up, Z-forward frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A reading defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels A reading is not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A reading emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries A reading builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The measurement reader and viewer present readings.
 * @evidence contracts/anatomy.md#anatomical-source The girth bridges the gluteal cleft, the inframammary fold and the navel as the ISO 8559-1 and ANSUR tape girths do.
 * @evidenceExclude contracts/anatomy.md#permitted-range A reading bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority A reading is not a person-authoring input.
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

import type { IAutoMovieAngleRange } from "@automovie/interface";

/**
 * Existing TT shoulder reach: angular intervals and the periodic plane/elevation envelope, admitted by the shoulder owner.
 *
 * @evidence contracts/common.md#principled-implementation Carries existing angular intervals and periodic plane/elevation knots, preserving the original TT reach record through the existing angle-range atom.
 * @evidence contracts/common.md#clear-and-simple-design This named record owns only the original TT reach record through the existing angle-range atom; computations remain at the existing consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing angle intervals and periodic [plane, maximum elevation] tuples retain their ordering and distinct elevation/rotation meanings.
 * @evidence contracts/common.md#meaningful-documentation Native field documentation names the retained members, their ownership and unchanged source meaning.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source and consuming builder own the represented parts; this record transports their existing registration/evaluation.
 * @evidence contracts/modeling.md#parameter-channels The record preserves total humerothoracic elevation, plane and axial-rotation meanings of the existing public shoulder goal; it defines no glenohumeral reconstruction.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The existing geometry/appearance consumer owns emitted populations.
 * @evidence contracts/modeling.md#spatial-conventions Intervals and envelope knots are degrees in thorax-relative TT coordinates; plane 0 is lateral, +90 anterior, and axial rotation positive external.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source and assembly owners retain actual boundary construction.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming source/assembly owner observes the result.
 * @evidence contracts/anatomy.md#anatomical-source The compiled shoulder supplies TT reach intervals and its plane-dependent envelope; this type retains source qualification and does not establish a physiological normal range.
 * @evidence contracts/anatomy.md#permitted-range The record defines source elevation/axial intervals and the periodic plane-dependent reach. Existing shoulder source admission and pose resolution validate the intervals and combined reach without changing caller goals; this schema alone proves no physiological capacity.
 * @evidence contracts/anatomy.md#parametric-authority The record preserves total humerothoracic elevation, plane and axial-rotation meanings of the existing public shoulder goal; it defines no glenohumeral reconstruction.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyShoulderRange {
  /** Total humerothoracic elevation interval, degrees. */
  elevation: IAutoMovieAngleRange;

  /** Humerothoracic axial-rotation interval, degrees. */
  axialRotation: IAutoMovieAngleRange;

  /** Existing periodic [plane, maximum elevation] knots, degrees; source admission owns ordering and reach. */
  envelope: [number, number][];
}

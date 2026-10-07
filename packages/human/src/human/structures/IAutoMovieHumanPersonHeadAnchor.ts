import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The point that carries the face from the neutral frame into a shaped body:
 * where it is in the neutral the face was built in, and where the body's
 * shape put it.
 *
 * The face basis is defined in an eye-centred frame (its endpoint rows are
 * the upstream state minus that frame's shift), so the anchor is the midpoint
 * of the body's two eye joints; carrying by another point leaves a uniform
 * offset between the face's neck and the body's at the cut.
 *
 * @evidence contracts/common.md#principled-implementation The anchor is the point the face basis's own frame is defined by, so carrying it reproduces the frame the face rows were measured in.
 * @evidence contracts/common.md#clear-and-simple-design Two points.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both points are read from the body's landmarks; nothing is fitted per document.
 * @evidence contracts/common.md#meaningful-documentation States which point and why.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the shared frame; the neutral-to-shaped conversion is this one named shift.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The anchor defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The anchor is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The anchor emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The anchor builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The anchor is not observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The anchor is a frame convention of the source.
 * @evidenceExclude contracts/anatomy.md#permitted-range The anchor admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The anchor is derived, not a caller input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadAnchor {
  /** The anchor in the neutral frame the face was built in. */
  neutral: IAutoMovieVector3;

  /** The anchor in the shaped body's rest. */
  shaped: IAutoMovieVector3;
}

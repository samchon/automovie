import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One orthonormal millimetre frame for a complete oral interior. Corners define
 * transverse X, the independent upward guide defines Y, and X cross Y faces
 * anteriorly. The supplied origin is shifted once by lift and posterior recess.
 * Corners orient the component; they never scale its authored dimensions.
 *
 * @evidence contracts/common.md#principled-implementation Two corners fix transverse X, the independent upward guide is orthogonalized against that chord for Y, and Z is their cross product facing anteriorly, which is the standard Gram-Schmidt frame; lift and recess then translate the origin once along the frame's own axes. Corners orient the frame and never scale it, so the interior's authored dimensions stay in millimetres.
 * @evidence contracts/common.md#clear-and-simple-design Six members, each a distinct input of one rigid frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type carries data only: no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The type states how each axis is derived, the sign of z and that corners orient without scaling; each member states its meaning and unit.
 * @evidence contracts/modeling.md#parameter-channels Lift and recess are the two channels: each is one signed displacement along one axis of the frame, zero leaves the observed anchor, positive lift moves superiorly and positive recess moves posteriorly. The right and left corners are the explicit pair and establish +X from right to left, so asymmetry lives in the corner data.
 * @evidence contracts/modeling.md#spatial-conventions Every point is a head-frame millimetre coordinate, +X runs from the right corner to the left corner, +Y is the orthogonalized upward guide and +Z is X cross Y facing anteriorly; the conversion to the frame is the one named step `attachPortraitOralMesh` performs.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type is a frame, not a part or a group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface; the tongue and both dental groups that share it inherit one frame definition.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The frame carries no anatomical value; it places whatever mesh the caller supplies.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing; `attachPortraitOralMesh` refuses nonfinite points and a degenerate chord or guide.
 * @evidence contracts/anatomy.md#parametric-authority Inputs are named landmarks (the two oral corners and an oral anchor), an upward direction and two named displacements; none addresses a vertex of the placed mesh.
 * @author Samchon
 */
export interface IPortraitOralAttachment {
  /** Anatomical right oral corner in head millimetres. */
  rightCorner: IAutoMovieVector3;

  /** Anatomical left corner; the right-to-left chord establishes +X. */
  leftCorner: IAutoMovieVector3;

  /** Observed oral anchor, in head millimetres. */
  origin: IAutoMovieVector3;

  /** Finite nonzero upward guide independent of the corner chord. */
  up: IAutoMovieVector3;

  /** Signed superior displacement along the orthogonalized Y axis, in mm. */
  lift: number;

  /** Signed posterior displacement along the frame's Z axis, in mm. */
  recess: number;
}

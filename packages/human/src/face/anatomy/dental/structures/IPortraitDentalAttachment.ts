import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Rigid placement shared by the entire upper row. The corner chord defines X;
 * the supplied upward guide is orthogonalized against it to define Y. Z=X cross
 * Y faces anteriorly. The origin is the central upper-lip reference, translated
 * once by the group's lift and recess. Corner points establish orientation,
 * never per-tooth positions or scaling. All points and offsets use millimetres.
 *
 * @evidence contracts/common.md#principled-implementation It is the same Gram-Schmidt frame as the oral attachment: the corner chord fixes X, the orthogonalized upward guide fixes Y and Z is X cross Y facing anteriorly, with the origin translated once by lift and recess.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type carries data only: no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The type states how each axis is derived, that corners orient and never scale, and that lift and recess move the group once; each member states its meaning and unit.
 * @evidence contracts/modeling.md#spatial-conventions Every point is a head-frame millimetre coordinate; +X runs from the right to the left corner, +Y is the orthogonalized upward guide and +Z is X cross Y facing anteriorly.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type is a frame and not a part or a group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The frame carries no anatomical value; it places the mesh the caller supplies.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing; `attachPortraitOralMesh` refuses nonfinite points and a degenerate chord or guide.
 * @evidence contracts/anatomy.md#parametric-authority Inputs are two named oral corners, the upper inner-lip midpoint, an upward direction and two named displacements; none addresses a vertex of the placed mesh.
 * @author Samchon
 */
export interface IPortraitDentalAttachment {
  /** Anatomical right oral corner in head millimetres. */
  rightCorner: IAutoMovieVector3;

  /** Anatomical left oral corner; its chord from the right defines local +X. */
  leftCorner: IAutoMovieVector3;

  /** Upper inner-lip midpoint supplying the arch's attachment origin. */
  upperLipMiddle: IAutoMovieVector3;

  /** Finite nonzero upward guide, independent of the corner chord. */
  up: IAutoMovieVector3;

  /** Signed upward placement from the upper-lip midpoint along the group's Y axis, in mm. */
  lift: number;

  /** Signed posterior placement from the upper-lip midpoint, in mm. */
  recess: number;
}

import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Inclusive axis-aligned meter box in the surrounding description's stated coordinate space.
 *
 * @evidence contracts/common.md#principled-implementation Component-wise minimum and maximum corners represent an axis-aligned extent after the owning measurement or placement stage; equal coordinates legitimately describe planar or point bounds.
 * @evidence contracts/common.md#clear-and-simple-design Two vectors contain only geometry extents, with coordinate-space authority retained by the surrounding subject bounds record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A box carries no inferred body radius or volume and does not erase a planar extent by imposing positive thickness.
 * @evidence contracts/common.md#meaningful-documentation Defines inclusive meter corners, axis alignment and the enclosing coordinate-space authority.
 */
export interface IAutoMovieSubjectBox {
  /** Inclusive minimum corner in metres. */
  min: IAutoMovieVector3;

  /** Inclusive maximum corner in metres. */
  max: IAutoMovieVector3;
}

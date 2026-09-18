import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One orthonormal millimetre frame for a complete oral interior. Corners define
 * transverse X, the independent upward guide defines Y, and X cross Y faces
 * anteriorly. The supplied origin is shifted once by lift and posterior recess.
 * Corners orient the component; they never scale its authored dimensions.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Gives dental and lingual interiors the same explicit anatomical attachment convention.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Separates an oral component's local dimensions from its rigid origin and orientation.
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

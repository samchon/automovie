import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One orthonormal millimetre frame for a complete oral interior. Corners define transverse X, the independent upward guide defines Y, and X cross Y faces anteriorly. The supplied origin is shifted once by lift and posterior recess. Corners orient the component; they never scale its authored dimensions.
 *
 * @evidence contracts/common.md#principled-implementation Right-to-left corners and an independent up guide establish one orthonormal oral-placement frame.
 * @evidence contracts/common.md#clear-and-simple-design The same basis rotates positions/normals while lift/recess shift the supplied anchor once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The frame does not scale authored crown dimensions or infer a physiological hinge.
 * @evidence contracts/common.md#meaningful-documentation Points/offsets are head millimetres, local +X is right-to-left and X cross Y faces anteriorly.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Frame admission and per-vertex transformation execute in attachPortraitOralMesh.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One frame is reused for every vertex/normal in the owned mesh clone.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller owns attachment vectors; the placement result owns mesh buffers and this type acquires no handle.
 *
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

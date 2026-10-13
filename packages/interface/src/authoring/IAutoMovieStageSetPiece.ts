import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One piece of visible environment geometry with no cast role.
 *
 * `stageScene` lowers it to a scene node with no motion of its own. It is
 * still a staged scene node, so a shot may aim at it and may move it as an
 * object, through a supplied object-motion clip, a `launch` projectile or an
 * `attachTo` child.
 *
 * @evidence contracts/common.md#principled-implementation `stageScene` requires a unique non-blank node, a non-blank model, a finite position, a finite heading when present, never both a heading and a rotation, a finite rotation within `1e-6` of unit length, and a scale finite and positive on every axis, then lowers the rotation, or a quaternion about +Y from the heading, and the expanded scale into the node transform.
 * @evidence contracts/common.md#clear-and-simple-design A heading covers upright props and a full quaternion covers sloped or vertical architecture, so the common case needs no quaternion; scale is either one number or a per-axis vector expanded by `setPieceScale`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A zero or negative scale axis is refused because it would draw nothing or mirror the winding the normal and outline passes read, and a non-unit rotation is refused rather than normalized.
 * @evidence contracts/common.md#meaningful-documentation States what lowering produces, how a shot can still move the piece, the world frame and units, the heading default, the exclusivity of heading and rotation, and the scale bounds and default.
 * @author Samchon
 */
export interface IAutoMovieStageSetPiece {
  /** Non-blank scene-node identity, unique across every node of the stage. */
  node: string;

  /** Non-blank runtime model identity used to render the piece. */
  model: string;

  /** Finite world-space placement in metres. */
  position: IAutoMovieVector3;

  /**
   * Optional finite heading in degrees about +Y, where zero faces +Z; omitted
   * with no {@link rotation} means `0`.
   */
  facingDeg?: number;

  /**
   * Optional full world rotation as a finite unit quaternion for sloped,
   * vertical, or arbitrarily oriented architecture. Mutually exclusive with
   * {@link facingDeg}.
   */
  rotation?: IAutoMovieQuaternion;

  /**
   * Finite positive uniform or per-axis scale applied to the model; omitted
   * keeps the model's authored size.
   */
  scale?: number | IAutoMovieVector3;
}

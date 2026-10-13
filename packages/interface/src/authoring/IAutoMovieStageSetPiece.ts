import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One non-performing piece of visible environment geometry.
 *
 * `stageScene` lowers it to a static scene node; no action may drive it.
 *
 * @evidence contracts/common.md#principled-implementation `stageScene` lowers a piece to a static node using `rotation` or a +Y `facingDeg` turn, with `setPieceScale` expanding a number to a uniform vector, after requiring a unit quaternion within 1e-6 and every scale axis finite and positive.
 * @evidence contracts/common.md#clear-and-simple-design Offers a heading for the common case of scenery turned about +Y and a full quaternion for sloped or vertical pieces, and refuses both together rather than silently ordering them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero or negative scale is refused because it collapses the piece or flips the winding the normal and outline passes read; the 1e-6 unit-length tolerance is the only slack.
 * @evidence contracts/common.md#meaningful-documentation Documents world metres, degrees about +Y, the mutual exclusion of the two rotation spellings, the positive-scale rule, and that a set piece never performs.
 * @author Samchon
 */
export interface IAutoMovieStageSetPiece {
  /** Unique scene-node identity. */
  node: string;

  /** Non-blank runtime model identity used to render the piece. */
  model: string;

  /** World-space placement in meters. */
  position: IAutoMovieVector3;

  /** Optional finite heading in degrees about +Y. */
  facingDeg?: number;

  /**
   * Optional full world rotation as a unit quaternion for sloped, vertical, or
   * arbitrarily oriented architecture. Mutually exclusive with the simpler
   * `facingDeg` spelling.
   */
  rotation?: IAutoMovieQuaternion;

  /**
   * Finite positive uniform or per-axis scale applied to the model; omitted
   * keeps the model's authored size.
   */
  scale?: number | IAutoMovieVector3;
}

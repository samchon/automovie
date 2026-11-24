import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One piece of visible environment geometry with no cast role.
 *
 * `stageScene` lowers it to a scene node with no motion of its own. It is still
 * a staged scene node, so a shot may aim at it and may move it as an object
 * through a supplied object-motion clip, a `launch` projectile or an `attachTo`
 * child.
 */
export interface IAutoMovieStageSetPiece {
  /** Scene-node identity, unique across every node of the stage. */
  node: string;

  /** Runtime model identity used to render the piece. */
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
   * vertical or arbitrarily oriented architecture. Mutually exclusive with
   * {@link facingDeg}.
   */
  rotation?: IAutoMovieQuaternion;

  /**
   * Finite positive uniform or per-axis scale applied to the model; omitted
   * keeps the model's authored size.
   */
  scale?: number | IAutoMovieVector3;
}

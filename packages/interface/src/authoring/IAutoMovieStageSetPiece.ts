import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One non-performing piece of visible environment geometry.
 *
 * `stageScene` lowers it to a static scene node; no action may drive it.
 *
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

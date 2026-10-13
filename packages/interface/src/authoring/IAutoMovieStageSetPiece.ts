import { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** One non-performing piece of visible environment geometry. */
export interface IAutoMovieStageSetPiece {
  /** Unique scene-node identity. */
  node: string;

  /** Runtime model identity used to render the piece. */
  model: string;

  /** World-space placement in meters. */
  position: IAutoMovieVector3;

  /** Optional heading in degrees about +Y. */
  facingDeg?: number;

  /**
   * Optional full world rotation for sloped, vertical, or arbitrarily oriented
   * architecture. Mutually exclusive with the simpler `facingDeg` spelling.
   */
  rotation?: IAutoMovieQuaternion;

  /** Positive uniform or per-axis scale applied to the model. */
  scale?: number | IAutoMovieVector3;
}

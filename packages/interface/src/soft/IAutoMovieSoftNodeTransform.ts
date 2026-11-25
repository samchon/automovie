import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** One evaluated node's rigid world frame supplied in a wearable soft snapshot. */
export interface IAutoMovieSoftNodeTransform {
  /** Stable scene-node identity. */
  node: string;

  /** World position at this fixed-step boundary. */
  worldPosition: IAutoMovieVector3;

  /** World orientation at this fixed-step boundary. */
  worldRotation: IAutoMovieQuaternion;
}

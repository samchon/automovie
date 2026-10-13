import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Evaluated scene-node transform available to one soft fixed step. */
export interface IAutoMovieSoftNodeTransform {
  /** Stable scene-node identity. */
  node: string;
  /** World position at this fixed-step boundary. */
  worldPosition: IAutoMovieVector3;
  /** World orientation at this fixed-step boundary. */
  worldRotation: IAutoMovieQuaternion;
}

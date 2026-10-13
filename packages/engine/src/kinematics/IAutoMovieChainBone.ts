import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/** The world position and orientation of one resolved chain bone. */
export interface IAutoMovieChainBone {
  /** World-space bone origin. */
  worldPosition: IAutoMovieVector3;

  /** World-space bone orientation. */
  worldRotation: IAutoMovieQuaternion;
}

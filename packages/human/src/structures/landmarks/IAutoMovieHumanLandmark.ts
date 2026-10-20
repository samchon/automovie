import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One landmark: where it is at rest and which bone carries it.
 */
export interface IAutoMovieHumanLandmark {
  /** Bone the landmark moves with. */
  bone: AutoMovieHumanoidBone;

  /** Position, millimetres, model frame. */
  position: IAutoMovieVector3;
}

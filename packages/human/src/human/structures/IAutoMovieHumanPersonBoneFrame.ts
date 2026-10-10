import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * One world frame of a bone: its joint position in metres and its orientation,
 * in the shared Y-up, +Z-forward frame.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBoneFrame {
  /** The joint position, metres. */
  position: IAutoMovieVector3;

  /** The world orientation. */
  rotation: IAutoMovieQuaternion;
}

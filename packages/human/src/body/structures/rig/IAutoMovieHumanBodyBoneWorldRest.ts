import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * One bone's rest frame in body space: its head and its world orientation on
 * the shaped body, before any pose.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBoneWorldRest {
  /** The bone's head in body space, metres. */
  position: IAutoMovieVector3;

  /** The bone's rest orientation in body space. */
  rotation: IAutoMovieQuaternion;
}

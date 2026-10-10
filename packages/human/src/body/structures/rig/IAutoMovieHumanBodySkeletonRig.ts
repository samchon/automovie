import type {
  IAutoMovieJointAxes,
  IAutoMovieRestFrame,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneWorldRest } from "./IAutoMovieHumanBodyBoneWorldRest";

/**
 * The rest skeleton `resolveHumanBodySkeleton` projects from the shaped
 * landmarks, with what `resolvePose` needs to read clinical angles on it.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkeletonRig {
  /** The rest skeleton, each bone's rest transform in its parent's frame. */
  skeleton: IAutoMovieSkeleton;

  /** Each bone's rest frame in body space. */
  rest: Map<AutoMovieHumanoidBone, IAutoMovieHumanBodyBoneWorldRest>;

  /** Each bone's clinical sign and rest angle per axis. */
  frames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

  /** The bones whose clinical axes or twist placement differ from the engine default. */
  axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
}

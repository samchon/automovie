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
 * @evidence contracts/common.md#principled-implementation The shaped landmarks produce a parent-relative rest skeleton and body-space rest placements with sign and custom-axis metadata.
 * @evidence contracts/common.md#clear-and-simple-design Skeleton, rest frames and optional axis overrides expose the inputs the pose resolver actually needs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing axis overrides retain the engine default rather than adding per-consumer axes.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish parent-frame skeleton transforms from body-space rest and clinical metadata.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The resolved rest rig record has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The resolved rest rig record schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The resolved rest rig record declaration allocates no runtime state or handles.
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

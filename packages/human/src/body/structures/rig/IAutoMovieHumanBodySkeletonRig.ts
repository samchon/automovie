import type { IAutoMovieJointAxes, IAutoMovieRestFrame } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieSkeleton } from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneWorldRest } from "./IAutoMovieHumanBodyBoneWorldRest";

/**
 * The rest skeleton `resolveHumanBodySkeleton` projects from the shaped
 * landmarks, with what `resolvePose` needs to read clinical angles on it.
 *
 * @evidence contracts/common.md#principled-implementation Names the one rig result every pose, shoulder and clinical readback consumer shares.
 * @evidence contracts/common.md#clear-and-simple-design Four fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries the resolver's output unchanged.
 * @evidence contracts/common.md#meaningful-documentation States each field's role.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Bone frames are body-space rest frames; axes and rest frames are bone-local.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The basis owns the source joints.
 * @evidenceExclude contracts/anatomy.md#permitted-range The skeleton's constraints own admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
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

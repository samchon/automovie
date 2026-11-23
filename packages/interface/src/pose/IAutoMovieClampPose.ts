import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointPose } from "./IAutoMovieJointPose";
import type { IAutoMoviePose } from "./IAutoMoviePose";

/**
 * Contracts of `clampPose.prepare` and `clampJointToSkeleton.prepare`: a rig's
 * range-of-motion projection of a whole pose, carrying the one-joint clamp it
 * maps and that clamp's angle-taking form.
 */
export namespace IAutoMovieClampPose {
  /** A one-joint clamp under a skeleton, with its angle-taking form. */
  export interface IJoints {
    /**
     * Clamp one joint into its bone's range.
     *
     * @param joint The joint, clinical degrees.
     * @returns The joint in range; an unconstrained joint by identity.
     */
    (joint: IAutoMovieJointPose): IAutoMovieJointPose;

    /**
     * The record `(joint)` gives for a joint of these values.
     *
     * @param bone The bone.
     * @param flexion Its flexion, degrees, or null at rest.
     * @param abduction Its abduction, degrees, or null at rest.
     * @param twist Its twist, degrees, or null at rest.
     * @returns The joint in range.
     */
    values(
      bone: AutoMovieHumanoidBone,
      flexion: number | null,
      abduction: number | null,
      twist: number | null,
    ): IAutoMovieJointPose;
  }

  /** A whole-pose projection with the one-joint clamp it maps. */
  export interface IPrepared {
    /**
     * Clamp every joint of a pose in order into a new pose.
     *
     * @param pose The pose.
     * @returns The projected pose.
     */
    (pose: IAutoMoviePose): IAutoMoviePose;

    /** The one-joint clamp the projection maps. */
    joints: IJoints;

    /** That clamp's angle-taking form. */
    values: IJoints["values"];
  }
}

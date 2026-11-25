import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieJointPose } from "../pose/IAutoMovieJointPose";
import type { IAutoMoviePrepareJointRotationCoefficientDots } from "./IAutoMoviePrepareJointRotationCoefficientDots";

/**
 * Contracts of `prepareJointRotationProjection`: a joint's prepared
 * rotation-to-clinical projector.
 */
export namespace IAutoMoviePrepareJointRotationProjection {
  /**
   * The original callable plus an explicit paired-result read; neither caches
   * targets.
   */
  export interface IProjector {
    /**
     * Project one local target with the same numerical candidate and tie
     * policy.
     */
    (rotation: IAutoMovieQuaternion): IAutoMovieJointPose;

    /**
     * Project once and return its joint with the exact unnormalized
     * composition.
     */
    withQuaternion(rotation: IAutoMovieQuaternion): IProjection;

    /**
     * Propose degree-valued swivels where the algebraic quaternion half-angle
     * circle lies on this native two-axis box's unrestricted product surface.
     * Angle ranges, actual clamp/FK, goals and continuity must still be
     * checked. Unknown/coupled/non-two-axis projectors decline; public callable
     * scoring and its callback order are unaffected. Foreign projectors may
     * omit it.
     */
    swivelCandidates?(
      cosine: IAutoMovieQuaternion,
      sine: IAutoMovieQuaternion,
    ): ReturnType<
      IAutoMoviePrepareJointRotationCoefficientDots.IReader["swivels"]
    >;
  }

  /**
   * Fresh result wrapper and raw quaternion of one query, with the callable's
   * joint ownership.
   */
  export interface IProjection {
    /**
     * Selected clinical record; unknown clamp outputs are stable four-field
     * snapshots.
     */
    joint: IAutoMovieJointPose;

    /**
     * Raw jointToQuaternionOnBasis result, before any caller
     * normalization/world composition.
     */
    quaternion: IAutoMovieQuaternion;
  }
}

import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieJointPose } from "../pose/IAutoMovieJointPose";
import type { IAutoMoviePrepareJointRotationCoefficientDots } from "./IAutoMoviePrepareJointRotationCoefficientDots";

/**
 * Contracts of `prepareJointRotationProjection`: a joint's prepared rotation-to-clinical projector.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each call states its local rotation input and its clinical joint or paired quaternion result.
 * @evidence contracts/development/design.md#principled-representation A callable projector with its paired reader and optional swivel proposer, and the paired result record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `prepareJointRotationProjection` produces it; chain fits and distal twist solves read it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every projection is computed afresh; proposals still need the actual clamp and checks.
 */
export namespace IAutoMoviePrepareJointRotationProjection {
  /**
   * The original callable plus an explicit paired-result read; neither caches targets.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareJointRotationProjection.IProjector: The original callable plus an explicit paired-result read.
   * @evidence contracts/development/design.md#principled-representation One record of its call, withQuaternion, swivelCandidates over the canonical IAutoMovieQuaternion, IAutoMovieJointPose, IAutoMoviePrepareJointRotationCoefficientDots contracts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `prepareJointRotationProjection` fills it and the enclosing IAutoMoviePrepareJointRotationProjection contract's readers use it; nothing else is declared.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `prepareJointRotationProjection`.
   */
  export interface IProjector {
    /** Project one local target with the same numerical candidate and tie policy. */
    (rotation: IAutoMovieQuaternion): IAutoMovieJointPose;

    /**
     * Project once and return its joint with the exact unnormalized composition.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareJointRotationProjection.IProjector.withQuaternion: Project once and return its joint with the exact unnormalized composition.
     */
    withQuaternion(rotation: IAutoMovieQuaternion): IProjection;

    /**
     * Propose degree-valued swivels where the algebraic quaternion half-angle
     * circle lies on this native two-axis box's unrestricted product surface.
     * Angle ranges, actual clamp/FK, goals and continuity must still be checked.
     * Unknown/coupled/non-two-axis projectors decline; public callable scoring
     * and its callback order are unaffected. Foreign projectors may omit it.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareJointRotationProjection.IProjector.swivelCandidates: Propose degree-valued swivels where the algebraic quaternion half-angle circle lies on this native two-axis box's unrestricted product surface.
     */
    swivelCandidates?(
      cosine: IAutoMovieQuaternion,
      sine: IAutoMovieQuaternion,
    ): ReturnType<
      IAutoMoviePrepareJointRotationCoefficientDots.IReader["swivels"]
    >;
  }

  /**
   * Fresh result wrapper and raw quaternion of one query, with the callable's joint ownership.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMoviePrepareJointRotationProjection.IProjection: Fresh result wrapper and raw quaternion of one query, with the callable's joint ownership.
   * @evidence contracts/development/design.md#principled-representation One record of joint, quaternion over the canonical IAutoMovieJointPose, IAutoMovieQuaternion contracts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `prepareJointRotationProjection` fills it and the enclosing IAutoMoviePrepareJointRotationProjection contract's readers use it; nothing else is declared.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `prepareJointRotationProjection`.
   */
  export interface IProjection {
    /** Selected clinical record; unknown clamp outputs are stable four-field snapshots. */
    joint: IAutoMovieJointPose;

    /** Raw jointToQuaternionOnBasis result, before any caller normalization/world composition. */
    quaternion: IAutoMovieQuaternion;
  }
}

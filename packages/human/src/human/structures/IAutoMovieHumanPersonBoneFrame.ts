import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * One bone world frame: joint position in metres and quaternion orientation in the common Y-up/+Z-forward convention. Producers/consumers own finite/unit quaternion and source rig admission; this erased carrier performs no normalization or anatomical registration. Member values remain ordinary mutable caller-owned records.
 *
 * @evidence contracts/common.md#principled-implementation Explicit metric translation and canonical quaternion orientation preserve the evaluator's actual world frame for paired rest/pose consumers.
 * @evidence contracts/common.md#clear-and-simple-design Existing vector/quaternion schemas own scalar shape while this record pairs them without another transform implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Typed components do not establish finite/unit orientation, clinical joint acquisition or observed GPU placement by themselves.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre/world axes, quaternion admission ownership and absence of runtime freezing.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This world frame type runs no quaternion normalization, matrix composition or geometry traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Frame sharing/caching belongs to concrete rig evaluators rather than this vector/orientation carrier.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no rig handle, worker or render object; containing values own actual position/orientation records.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBoneFrame {
  /** The joint position, metres. */
  position: IAutoMovieVector3;

  /** The world orientation. */
  rotation: IAutoMovieQuaternion;
}

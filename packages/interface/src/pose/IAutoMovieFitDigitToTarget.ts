import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieJointPose } from "./IAutoMovieJointPose";
import type { IAutoMoviePose } from "./IAutoMoviePose";
import type { IAutoMovieRestFrame } from "./IAutoMovieRestFrame";
import type { IAutoMovieSkeletonTopology } from "./IAutoMovieSkeletonTopology";

/** Digit inverse-kinematics inputs and measured outcomes. fitDigitToTarget rejects an empty bone list, invalid softening rate and an unresolved effector; skeleton admission and the caller supply coherent frames, finite targets and a unit local normal. */
export namespace IAutoMovieFitDigitToTarget {
  /**
   * What a digit fit reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines rest-local effector geometry, world target, optional orientation/coupling tasks and softening rate.
   * @evidence contracts/development/design.md#principled-representation Clinical variables use degrees and target residual metres; fitDigitToTarget rejects empty bones/invalid rate and requires a resolvable effector, with coherent FK frames caller-owned.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The digit solver consumes these inputs to prioritize point placement before normal alignment and flexion coupling.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Independent normal/coupling/rate options activate distinct secondary or reach-softening behavior without requiring a named finger special case.
   */
  export interface IInput {
    /** The rig. */
    skeleton: IAutoMovieSkeleton;

    /** The posed body: its root, arm and hand place the digit's base; its own entries for the digit's joints are the fit's start. */
    pose: IAutoMoviePose;

    /** The digit's joints, proximal to distal: a finger's three, or the thumb's metacarpal, proximal and distal. */
    bones: readonly AutoMovieHumanoidBone[];

    /** The point brought to the target, in its bone's rest frame relative to the bone's joint, metres, with the outward unit normal there: a region frame of the digit's tip or pad. */
    effector: {
      /** Resolvable bone carrying the tip or pad; normally the last listed digit bone. */
      bone: AutoMovieHumanoidBone;
      /** Bone-rest-frame offset from its joint, metres. Its length also scales secondary orientation/coupling residuals. */
      point: IAutoMovieVector3;
      /** Outward unit direction in the same bone-rest frame; rotated into world space without normalization. */
      normal: IAutoMovieVector3;
    };

    /** The target, world metres. */
    target: IAutoMovieVector3;

    /** The world direction the effector's normal is turned onto, when the contact needs one (a pad laid on a key faces against the key's normal); none when absent. */
    normal?: IAutoMovieVector3;

    /** Dimensionless distal/middle flexion ratio for the second and third listed bones, a secondary task after point placement. Omission or fewer than three bones disables it; the caller supplies a finite value. */
    coupling?: number;

    /** The joint axes the pose is read with, as `resolvePose` takes them; the skeleton's own when absent. */
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

    /** The rest frames the pose's clinical angles are lifted by, as `resolvePose` takes them; none when absent. */
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

    /** The rig's topology, when the caller has it. */
    topology?: IAutoMovieSkeletonTopology;

    /** Desired radial extension rate near full reach, positive finite degrees per metre. Derives a soft-IK band from the chain's smallest full-extension hinge curvature; targets in that band are eased short of full reach, and `residual` still measures the original target. Other constrained-IK basin changes are not bounded by this value. No softening when absent. */
    rate?: number;
  }

  /**
   * Fresh fitted joint records and world measurements; input pose is not mutated. A nonzero residual is an outcome, not an exception or a claim of contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes clamped clinical joints from achieved world point/normal and the original-target residual.
   * @evidence contracts/development/design.md#principled-representation Joints use clinical degrees, point metres and normal world direction; residual remains measured against the original target even when softening is enabled.
   * @evidence contracts/development/design.md#minimal-and-owned-surface fitDigitToTarget returns fresh fitting results without changing the source pose; downstream contact logic decides whether residual is acceptable.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reach failure is measurable data rather than a forced success flag or a hidden change to the requested target.
   */
  export interface IResult {
    /** The digit's joints, inside their range, clinical degrees. */
    joints: IAutoMovieJointPose[];

    /** Where the effector ended, world metres. */
    point: IAutoMovieVector3;

    /** The effector's outward unit normal there, world frame. */
    normal: IAutoMovieVector3;

    /** The distance from the effector to the target, metres; zero within rounding when the target is reached. */
    residual: number;
  }
}

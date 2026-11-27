import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieJointPose } from "./IAutoMovieJointPose";
import type { IAutoMoviePose } from "./IAutoMoviePose";
import type { IAutoMoviePoseResolution } from "./IAutoMoviePoseResolution";
import type { IAutoMovieRestFrame } from "./IAutoMovieRestFrame";
import type { IAutoMovieSkeletonPoseResolution } from "./IAutoMovieSkeletonPoseResolution";
import type { IAutoMovieSkeletonTopology } from "./IAutoMovieSkeletonTopology";

/**
 * Digit inverse-kinematics inputs and measured outcomes. fitDigitToTarget
 * rejects an empty bone list, invalid softening rate and an unresolved
 * effector; skeleton admission and the caller supply coherent frames, finite
 * targets and a unit local normal.
 */
export namespace IAutoMovieFitDigitToTarget {
  /** What a digit fit reads. */
  export interface IInput {
    /** The rig. */
    skeleton: IAutoMovieSkeleton;

    /**
     * The posed body: its root, arm and hand place the digit's base; its own
     * entries for the digit's joints are the fit's start.
     */
    pose: IAutoMoviePose;

    /**
     * The digit's joints, proximal to distal: a finger's three, or the thumb's
     * metacarpal, proximal and distal.
     */
    bones: readonly AutoMovieHumanoidBone[];

    /**
     * The point brought to the target, in its bone's rest frame relative to the
     * bone's joint, metres, with the outward unit normal there: a region frame
     * of the digit's tip or pad.
     */
    effector: IInputEffector;

    /** The target, world metres. */
    target: IAutoMovieVector3;

    /**
     * The world direction the effector's normal is turned onto, when the
     * contact needs one (a pad laid on a key faces against the key's normal);
     * none when absent.
     */
    normal?: IAutoMovieVector3;

    /**
     * Dimensionless distal/middle flexion ratio for the second and third listed
     * bones, a secondary task after point placement. Omission or fewer than
     * three bones disables it; the caller supplies a finite value.
     */
    coupling?: number;

    /**
     * The joint axes the pose is read with, as `resolvePose` takes them; the
     * skeleton's own when absent.
     */
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

    /**
     * The rest frames the pose's clinical angles are lifted by, as
     * `resolvePose` takes them; none when absent.
     */
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

    /** The rig's topology, when the caller has it. */
    topology?: IAutoMovieSkeletonTopology;

    /**
     * Exact FK workspace borrowed only for this synchronous fit, or a local one
     * when absent. It never enters the result.
     */
    prepared?: IAutoMoviePoseResolution;

    /**
     * Explicit immutable snapshot of this exact skeleton, axes and clinical
     * frames. Borrowed only while those dependencies remain unchanged; without
     * it, raw FK retains live admission.
     */
    rig?: IAutoMovieSkeletonPoseResolution.IRig;

    /**
     * Desired radial extension rate near full reach, positive finite degrees
     * per metre. Derives a soft-IK band from the chain's smallest
     * full-extension hinge curvature; targets in that band are eased short of
     * full reach, and `residual` still measures the original target. Other
     * constrained-IK basin changes are not bounded by this value. No softening
     * when absent.
     */
    rate?: number;
  }

  /** The effector object of {@link IInput}. */
  export type IInputEffector = {
    /**
     * Resolvable bone carrying the tip or pad; normally the last listed digit
     * bone.
     */
    bone: AutoMovieHumanoidBone;
    /**
     * Bone-rest-frame offset from its joint, metres. Its length also scales
     * secondary orientation/coupling residuals.
     */
    point: IAutoMovieVector3;
    /**
     * Outward unit direction in the same bone-rest frame; rotated into world
     * space without normalization.
     */
    normal: IAutoMovieVector3;
  };

  /**
   * Fresh fitted joint records and world measurements; input pose is not
   * mutated. A nonzero residual is an outcome, not an exception or a claim of
   * contact.
   */
  export interface IResult {
    /** The digit's joints, inside their range, clinical degrees. */
    joints: IAutoMovieJointPose[];

    /** Where the effector ended, world metres. */
    point: IAutoMovieVector3;

    /** The effector's outward unit normal there, world frame. */
    normal: IAutoMovieVector3;

    /**
     * The distance from the effector to the target, metres; zero within
     * rounding when the target is reached.
     */
    residual: number;
  }
}

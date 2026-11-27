import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalShape } from "../physics/IAutoMoviePhysicalShape";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMoviePose } from "./IAutoMoviePose";
import type { IAutoMovieRestFrame } from "./IAutoMovieRestFrame";
import type { IAutoMovieSkeletonPoseResolution } from "./IAutoMovieSkeletonPoseResolution";
import type { IAutoMovieSkeletonTopology } from "./IAutoMovieSkeletonTopology";

/**
 * Sequential digit closing against placed physical colliders.
 * curlChainUntilContact checks positive steps/radii and collider dimensions;
 * callers supply nonempty ordered chains, finite frames and matching topology.
 */
export namespace IAutoMovieCurlChainUntilContact {
  /** The curl request. */
  export interface IInput {
    /** The rig, whose range of motion caps every flexion. */
    skeleton: IAutoMovieSkeleton;

    /** The pose to curl; only the chains' flexions change. */
    pose: IAutoMoviePose;

    /**
     * Chains in closing order, each nonempty and proximal to distal. Empty
     * input changes no joints; an empty individual chain is not supported.
     */
    chains: readonly IAutoMovieCurlChainUntilContact.IChain[];

    /**
     * Object colliders in the pose's world frame. Empty input curls to the
     * permitted limits and reports infinite gap.
     */
    colliders: readonly IAutoMovieCurlChainUntilContact.ICollider[];

    /** Search step, degrees; 1 when absent. */
    step?: number;

    /** Clinical axes, as `resolvePose` takes them. */
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

    /** Clinical rest frames, as `resolvePose` takes them. */
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

    /** Topology of the same skeleton, reused across evaluations. */
    topology?: IAutoMovieSkeletonTopology;

    /**
     * Explicit immutable rig of this same skeleton/axes/frames/topology. The
     * synchronous curl fixes root and non-current-chain records; each chain
     * prepares its actual first trial then admits complete current-chain edits.
     * Absent, raw full-walk resolution preserves live-input behavior.
     */
    resolution?: IAutoMovieSkeletonPoseResolution.IRig;
  }

  /** One closing chain, a digit. */
  export interface IChain {
    /** Its bones from proximal to distal, each the parent of the next. */
    bones: readonly AutoMovieHumanoidBone[];

    /**
     * The distal phalanx's end in the last bone's rest frame relative to its
     * joint, metres.
     */
    tip: IAutoMovieVector3;

    /** The phalanges' capsule radius, metres; positive. */
    radius: number;
  }

  /** One collider of the object, in world metres. */
  export interface ICollider {
    /** The shape; its own `transform` is relative to `frame`. */
    shape: IAutoMoviePhysicalShape;

    /** The shape owner's world frame. */
    frame: IColliderFrame;
  }

  /** The frame object of {@link ICollider}. */
  export type IColliderFrame = {
    /**
     * Owner's world translation in metres; the shape's own transform is
     * composed after it.
     */
    position: IAutoMovieVector3;
    /** Unit rotation from owner-local coordinates to the pose's world frame. */
    rotation: IAutoMovieQuaternion;
  };

  /** The curl. */
  export interface IResult {
    /**
     * New shallow pose and joints array with tested flexions replaced;
     * untouched joint records and other pose members may be shared with input.
     */
    pose: IAutoMoviePose;

    /** Each chain's outcome, in input order. */
    chains: IAutoMovieCurlChainUntilContact.IChainResult[];
  }

  /** One chain's outcome. */
  export interface IChainResult {
    /** The input chain's bone array, retained by reference in the result. */
    bones: readonly AutoMovieHumanoidBone[];

    /** Each joint's final flexion, degrees. */
    flexion: number[];

    /**
     * Least capsule-to-collider gap in metres: near zero at first touch,
     * positive at a ROM stop, Infinity without colliders. Existing penetration
     * can remain negative because the solver only closes, never opens.
     */
    gap: number;
  }
}

import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalProfile } from "../physics/IAutoMoviePhysicalProfile";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMoviePose } from "./IAutoMoviePose";
import type { IAutoMovieRestFrame } from "./IAutoMovieRestFrame";
import type { IAutoMovieSkeletonTopology } from "./IAutoMovieSkeletonTopology";

/** Sequential digit closing against placed physical colliders. curlChainUntilContact checks positive steps/radii and collider dimensions; callers supply nonempty ordered chains, finite frames and matching topology. */
export namespace IAutoMovieCurlChainUntilContact {
  /**
   * The curl request.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents closing order, collider frames, step defaults and empty-input behavior.
   * @evidence contracts/development/design.md#principled-representation Clinical increments use degrees and geometry metres; the solver checks positive step/radii and collider dimensions, while callers supply nonempty individual chains and coherent topology.
   * @evidence contracts/development/design.md#minimal-and-owned-surface curlChainUntilContact borrows pose/skeleton data and replaces only tested flexion entries in a new shallow pose.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional axes, rest frames and topology reuse established FK contracts rather than carrying an implementation-specific rig.
   */
  export interface IInput {
    /** The rig, whose range of motion caps every flexion. */
    skeleton: IAutoMovieSkeleton;

    /** The pose to curl; only the chains' flexions change. */
    pose: IAutoMoviePose;

    /** Chains in closing order, each nonempty and proximal to distal. Empty input changes no joints; an empty individual chain is not supported. */
    chains: readonly IAutoMovieCurlChainUntilContact.IChain[];

    /** Object colliders in the pose's world frame. Empty input curls to the permitted limits and reports infinite gap. */
    colliders: readonly IAutoMovieCurlChainUntilContact.ICollider[];

    /** Search step, degrees; 1 when absent. */
    step?: number;

    /** Clinical axes, as `resolvePose` takes them. */
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

    /** Clinical rest frames, as `resolvePose` takes them. */
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

    /** Topology of the same skeleton, reused across evaluations. */
    topology?: IAutoMovieSkeletonTopology;
  }

  /**
   * One closing chain, a digit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines proximal-to-distal chain ordering, rest-local tip and capsule radius.
   * @evidence contracts/development/design.md#principled-representation Each chain must be nonempty with resolvable parent-linked bones, a metre tip offset and positive radius; the solver checks radius but assumes ordering.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The curl solver searches each listed flexion and tests all downstream capsules against the object's colliders.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The same ordered chain contract handles any digit length without fixed finger-joint fields.
   */
  export interface IChain {
    /** Its bones from proximal to distal, each the parent of the next. */
    bones: readonly AutoMovieHumanoidBone[];

    /** The distal phalanx's end in the last bone's rest frame relative to its joint, metres. */
    tip: IAutoMovieVector3;

    /** The phalanges' capsule radius, metres; positive. */
    radius: number;
  }

  /**
   * One collider of the object, in world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Separates the owner's world frame from the shape's relative transform.
   * @evidence contracts/development/design.md#principled-representation World translation is metres and rotation a unit quaternion; shape dimensions are admitted by curlChainUntilContact and frames remain caller premises.
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalShapeSegmentDistance reads this frame/shape pair while the curl solver searches first contact.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The shape reuses IAutoMoviePhysicalProfile instead of copying a physics library's collider object.
   */
  export interface ICollider {
    /** The shape; its own `transform` is relative to `frame`. */
    shape: IAutoMoviePhysicalProfile.IShape;

    /** The shape owner's world frame. */
    frame: {
      /** Owner's world translation in metres; the shape's own transform is composed after it. */
      position: IAutoMovieVector3;
      /** Unit rotation from owner-local coordinates to the pose's world frame. */
      rotation: IAutoMovieQuaternion;
    };
  }

  /**
   * The curl.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains shallow pose replacement and input-order chain reports.
   * @evidence contracts/development/design.md#principled-representation Returned pose/joints arrays are new but unchanged members can be shared; report bones retain their input arrays.
   * @evidence contracts/development/design.md#minimal-and-owned-surface curlChainUntilContact returns this result for downstream pose composition and contact-gap inspection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A report records measured gap rather than implying every chain necessarily touched the object.
   */
  export interface IResult {
    /** New shallow pose and joints array with tested flexions replaced; untouched joint records and other pose members may be shared with input. */
    pose: IAutoMoviePose;

    /** Each chain's outcome, in input order. */
    chains: IAutoMovieCurlChainUntilContact.IChainResult[];
  }

  /**
   * One chain's outcome.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States flexion degrees, borrowed bone identity and positive, negative or infinite gap meanings.
   * @evidence contracts/development/design.md#principled-representation Flexion entries match the input bone order; gap is the least capsule clearance in metres and may remain negative for pre-existing penetration.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The curl solver constructs one such report per chain after the sequential flexion search.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Infinity records no collider distance and is not substituted with an invented zero-contact value.
   */
  export interface IChainResult {
    /** The input chain's bone array, retained by reference in the result. */
    bones: readonly AutoMovieHumanoidBone[];

    /** Each joint's final flexion, degrees. */
    flexion: number[];

    /** Least capsule-to-collider gap in metres: near zero at first touch, positive at a ROM stop, Infinity without colliders. Existing penetration can remain negative because the solver only closes, never opens. */
    gap: number;
  }
}

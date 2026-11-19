import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanGraspUse } from "../handling/IAutoMovieMotionHumanGraspUse";
import type { IAutoMovieMotionPropLaunch } from "./IAutoMovieMotionPropLaunch";

/**
 * A planned hand attachment to a prop beginning at a share of the action's duration. Optional finger joint angles preserve the grip when performance evaluation carries the prop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A planned hand attachment to a prop beginning at a share of the action's duration. Optional finger joint angles preserve the grip when performance evaluation carries the prop.
 * @evidence contracts/development/design.md#principled-representation The start is an action share. A staged capture borrows the matching launch and checks its displayed frame. A later prop action reads the grip's declared use.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Held primitives and striking plans publish persistent grips that performance holding consumes across later actions; this planned hold differs from the evaluator's cached held state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The start remains a normalized duration share, while fingers remain readonly clinical joint angles. Grip takeover and missing-prop refusal belong to performance planning.
 */
export interface IAutoMovieMotionPropHold {
  /** The holding hand. */
  side: AutoMovieHumanSide;

  /** The prop's subject. */
  prop: string;

  /** Share of this action from which the prop is held. */
  from: number;

  /** The staged interception this grip requires. Absent for ordinary holds. */
  capture?: IAutoMovieMotionPropHold.ICapture;

  /** The holding fingers' clinical angles, kept while carried. */
  fingers?: Readonly<
    Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
  >;

  /** The use the grip was chosen for (`pickUp`'s `use`); absent when it was chosen for its reach alone. */
  use?: IAutoMovieMotionHumanGraspUse.IUse;
}

/** Records consumed by placed holds and launched prop playback. */
export namespace IAutoMovieMotionPropHold {
  /**
   * The planned interception whose launch becomes this grip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the launch and the world frame the capture checks at grip closure.
   * @evidence contracts/development/design.md#principled-representation The held action borrows a launch identity and the original planned interception predicate.
   * @evidence contracts/development/design.md#minimal-and-owned-surface HumanPerformanceGrips carries the capture to its actual grip consumer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The owning catch checks the displayed frame against its planned interception.
   */
  export interface ICapture {
    /** Launch identity in its placed action's publish list. */
    launch: IAutoMovieMotionPropLaunch;

    /** First film second of this bare hand's fitted spherical reception. The receiving hand and fingers belong to that grip through closure and must physically meet the sphere at closure. */
    handContactFrom?: number;

    /**
     * Check the displayed world frame at grip closure against the planned interception.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Takes the current displayed world frame and reports admission by the catch.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation The catch law supplies the actual interception check.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This callable declares the check boundary. The catch owns its geometry.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The owning catch sets the interception conditions and preserves the original tolerance.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The catch owns the size and cost of the geometry check.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The catch owns the planned quantities it can share.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The catch owns the interception state until release.
     */
    matches(frame: IAutoMovieRigidTransform): boolean;
  }
}

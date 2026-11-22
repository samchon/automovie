import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";
import type { IAutoMoviePhysicalSupportPatch } from "./IAutoMoviePhysicalSupportPatch";

/**
 * Capture-point assessment and a possible generic support-step request.
 *
 * @evidence contracts/development/design.md#principled-representation Actual support patches form the horizontal convex hull; COM height and velocity predict a capture point independently of eventual contact outcomes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bone id links one actual patch and endpoint to the existing footfall pattern. A step exists only for the recovery branch; shared geometric facts remain available for supported and unrecoverable assessments.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Invalid finite state/limits throw; absent hull, insufficient remaining supports or unreachable travel can refuse recovery rather than fabricate a step.
 * @evidence contracts/development/common.md#meaningful-documentation All positions are world metres; points and position serve distinct hull and endpoint roles. Members distinguish prediction from measured outcome and specify world metres, absent step and empty-hull behavior.
 */
export namespace IAutoMoviePhysicalBalance {
  /**
   * A prediction remains separate from the observed simulation outcome.
   *
   * @evidence contracts/development/design.md#principled-representation Prediction state, capture point and hull distance explain whether a reachable step is requested.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A step exists only for the recovery branch; shared geometric facts remain available for supported and unrecoverable assessments.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Recovery is a proposed endpoint, never a receipt of successful landing; an empty hull retains infinite distance.
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish prediction from measured outcome and specify world metres, absent step and empty-hull behavior.
   */
  export interface IResult {
    /** Stable support, reachable recovery, or predicted loss of recovery. */
    state: "supported" | "recovery" | "unrecoverable";

    /** Horizontal COM plus velocity/sqrt(g/height), world metres. */
    capturePoint: IAutoMovieVector3;

    /** Actual convex support hull. */
    polygon: IAutoMovieVector3[];

    /** Distance to the horizontal support hull in metres; zero inside, Infinity for no hull. */
    outside: number;

    /** Recovery request goes back to the step planner; absent otherwise. */
    step?: {
      /** Supported endpoint selected by lead along the capture direction (the last landed limb after any other), then shortest travel, then footfall phase. */
      bone: string;

      /** Proposed support-point position in world metres on the floor plane. */
      target: IAutoMovieVector3;

      /** The swing's own time to the target, seconds, after its unloading ramp; absent without a `swing` timing. */
      seconds?: number;
    };
  }

  /**
   * Choose the reachable recovery support leading along the capture direction, then by travel distance, then declared footfall phase.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes actual COM/support measurements, unavailable endpoints and finite recovery-policy bounds.
   * @evidence contracts/development/design.md#principled-representation World-metre positions and m/s velocity define the capture point with positive m/s² gravity; pattern phases break equal-distance ties.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMoviePhysicalBalance.assess reads the canonical footfall pattern and measured support patches supplied by the physical controller.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Empty support is unrecoverable; unavailable endpoints still contribute their real support patches but cannot be chosen for a step.
   */
  export type IAssessInput = {
    /** Finite actual centre of mass in world metres. */
    center: IAutoMovieVector3;

    /** Finite actual COM velocity in world metres per second; vertical component is admitted but unused. */
    velocity: IAutoMovieVector3;

    /** Positive finite downward acceleration magnitude in metres per second squared. */
    gravity: number;

    /** Finite world support-plane height in metres; nonpositive COM height is unrecoverable. */
    floor: number;

    /** Borrowed actual support patches and endpoints; empty yields an unrecoverable result. */
    supports: IAutoMoviePhysicalSupportPatch[];

    /** Borrowed limb identities, tie-breaking phases and minimum remaining support count. */
    pattern: IAutoMovieFootfallPattern;

    /** Positive finite maximum horizontal endpoint travel in metres; invalid limits throw. */
    maximumStep: number;

    /** Finite nonnegative outside-hull distance still accepted as supported, in metres. */
    margin: number;

    /** Bone ids unavailable for a recovery request; their patches still contribute support. */
    unavailable: readonly string[];

    /**
     * Seconds a recovery step takes to land. The capture point keeps
     * diverging from the remaining supports' centre of pressure while the
     * limb swings, so the step targets where it will be on landing; absent or
     * zero targets the instantaneous capture point.
     */
    swingSeconds?: number;

    /**
     * The recovery step's timing from the leg, chosen with its place: its
     * unloading ramp in seconds, its peak acceleration bound in metres per
     * second squared and its clearance in metres. A step over distance d then
     * lands after ramp + sqrt(max(5.77 d, 24 h) / acceleration), the earliest
     * a minimum-jerk transfer and a clearance at rest at both ends can, and
     * the target is where the capture point will be then (Khadiv et al. 2017,
     * Section III-B). Takes the place of `swingSeconds` when given.
     */
    swing?: { ramp: number; acceleration: number; height: number };

    /**
     * How far inside each support outline the stance holds its centre of
     * pressure, metres. The capture point needs a step once it leaves the
     * outline shrunk by it, and the remaining supports hold their centre of
     * pressure on their shrunken outline while a limb swings. Absent or zero
     * reads the outlines as they are.
     */
    inset?: number;

    /** The limb that landed last: another limb leading the capture point steps before it again. */
    recent?: string;
  };
}

import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";
import type { IAutoMoviePhysicalSupportPatch } from "./IAutoMoviePhysicalSupportPatch";

/** Capture-point assessment and a possible generic support-step request. */
export namespace IAutoMoviePhysicalBalance {
  /** A prediction remains separate from the observed simulation outcome. */
  export interface IResult {
    /** Stable support, reachable recovery, or predicted loss of recovery. */
    state: "supported" | "recovery" | "unrecoverable";

    /** Horizontal COM plus velocity/sqrt(g/height), world metres. */
    capturePoint: IAutoMovieVector3;

    /** Actual convex support hull. */
    polygon: IAutoMovieVector3[];

    /**
     * Distance to the horizontal support hull in metres; zero inside, Infinity
     * for no hull.
     */
    outside: number;

    /**
     * Distance to the hull shrunk by the input's `inset`, metres, the support
     * the trigger reads; zero inside, Infinity for no hull. `assess` always
     * gives it; a hand-built prediction may leave it out.
     */
    beyond?: number;

    /** Recovery request goes back to the step planner; absent otherwise. */
    step?: {
      /**
       * Supported endpoint selected by whether its step captures, then whether
       * its remaining supports hold the commanded centre of pressure, then not
       * the last landed limb, then shortest travel, lead along the capture
       * direction and footfall phase.
       */
      bone: string;

      /** Proposed support-point position in world metres on the floor plane. */
      target: IAutoMovieVector3;

      /**
       * The swing's own time to the target, seconds, after its unloading ramp;
       * absent without a `swing` timing.
       */
      seconds?: number;

      /**
       * Whether this one step captures the body (Koolen et al., Eq. 25); a step
       * is asked for either way, and the body steps again if it does not.
       * Absent without a `swing` timing.
       */
      viable?: boolean;

      /**
       * The diagonal partner a four-support body steps with this limb when no
       * single limb's step both captures and can be unloaded at once: both
       * feet move by the same displacement while the other diagonal holds the
       * centre of pressure (Chen et al. 2022, Section 2.1, Example 1). Absent
       * for a single step.
       */
      pair?: {
        /** The partner's supported endpoint. */
        bone: string;

        /** Its proposed support-point position, world metres on the floor plane. */
        target: IAutoMovieVector3;
      };
    };
  }

  /**
   * Choose the reachable recovery support leading along the capture direction,
   * then by travel distance, then declared footfall phase.
   */
  export type IAssessInput = {
    /** Finite actual centre of mass in world metres. */
    center: IAutoMovieVector3;

    /**
     * Finite actual COM velocity in world metres per second; vertical component
     * is admitted but unused.
     */
    velocity: IAutoMovieVector3;

    /**
     * Positive finite downward acceleration magnitude in metres per second
     * squared.
     */
    gravity: number;

    /**
     * Finite world support-plane height in metres; nonpositive COM height is
     * unrecoverable.
     */
    floor: number;

    /**
     * Borrowed actual support patches and endpoints; empty yields an
     * unrecoverable result.
     */
    supports: IAutoMoviePhysicalSupportPatch[];

    /**
     * Borrowed limb identities, tie-breaking phases and minimum remaining
     * support count.
     */
    pattern: IAutoMovieFootfallPattern;

    /**
     * Positive finite maximum horizontal endpoint travel in metres; invalid
     * limits throw.
     */
    maximumStep: number;

    /**
     * Finite nonnegative outside-hull distance still accepted as supported, in
     * metres.
     */
    margin: number;

    /**
     * Bone ids unavailable for a recovery request; their patches still
     * contribute support.
     */
    unavailable: readonly string[];

    /**
     * Seconds a recovery step takes to land. The capture point keeps diverging
     * from the remaining supports' centre of pressure while the limb swings, so
     * the step targets where it will be on landing; absent or zero targets the
     * instantaneous capture point.
     */
    swingSeconds?: number;

    /**
     * The recovery step's timing from the leg, chosen with its place: its
     * unloading ramp in seconds, its peak acceleration bound in metres per
     * second squared, its clearance in metres and, for a swing under way, the
     * seconds of it already spent. A step over distance d then lands after ramp
     * + sqrt(max(5.77 d, CLEARANCE h) / acceleration) - elapsed, the earliest a
     * minimum-jerk transfer and a clearance at rest at both ends can, and the
     * target is where the capture point will be then (Khadiv et al. 2017,
     * Section III-B). Takes the place of `swingSeconds` when given. The landed
     * foot's ramp-in, seconds, is how long after touchdown its share takes to
     * bear, the centre of pressure kept on the remaining supports meanwhile
     * (Herzog et al. 2016, Section 5.3), so the target is where the capture
     * point will be once the foot bears; absent counts none.
     */
    swing?: {
      ramp: number;
      acceleration: number;
      height: number;
      elapsed?: number;
      landing?: number;
    };

    /**
     * The centre of pressure the stance commands now, world metres: a limb
     * whose remaining supports already hold it can be unloaded at once and
     * ranks before one that cannot, among equally viable steps. Absent ranks
     * none so.
     */
    pressure?: IAutoMovieVector3;

    /**
     * How far inside each support outline the stance holds its centre of
     * pressure, metres. The capture point needs a step once it leaves the
     * outline shrunk by it, and the remaining supports hold their centre of
     * pressure on their shrunken outline while a limb swings. Absent or zero
     * reads the outlines as they are.
     */
    inset?: number;

    /**
     * The limb that landed last: another limb leading the capture point steps
     * before it again.
     */
    recent?: string;

    /**
     * The capture point's shift for the body's angular momentum, world metres
     * (`physicalStanceBalance.spin`); absent leaves it at the pendulum's.
     */
    spin?: IAutoMovieVector3;

    /**
     * The body's heading on the floor, world: the side a stepping limb keeps is
     * across it; absent takes the capture point's direction.
     */
    heading?: IAutoMovieVector3;

    /**
     * Whether a step is asked for even with the capture point inside, as when
     * the trunk is about to tip past its range.
     */
    force?: boolean;

    /**
     * A diagonal pair under way, its lead's endpoint first: only that pair is
     * planned again, by the rules it was chosen with.
     */
    pair?: readonly [string, string];
  };
}

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

    /** Recovery request goes back to the step planner; absent otherwise. */
    step?: {
      /**
       * Supported endpoint selected by shortest reachable travel, then footfall
       * phase.
       */
      bone: string;

      /** Proposed support-point position in world metres on the floor plane. */
      target: IAutoMovieVector3;
    };
  }

  /**
   * Order reachable recovery supports by travel distance, then declared
   * footfall phase.
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
  };
}

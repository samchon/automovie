import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetype } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { QuadrupedPosePlan } from "./quadruped/QuadrupedPosePlan";

/**
 * Specifies authored timings, support goals and samples for a
 * sternal-rest cycle.
 */
export namespace AutoMovieArchetypeQuadrupedRestPlan {
  /**
   * Movement interval within one transition, with 0 ≤ start share < end
   * share ≤ 1.
   */
  export interface IWindow {
    /** Normalized share where motion begins. */
    readonly startShare: number;

    /** Normalized share where motion reaches its authored end. */
    readonly endShare: number;
  }

  /**
   * Authored directions of the third and fourth bars in a folded limb chain.
   */
  export interface IFoldedDirections {
    /** Third bar angle from down toward `+Z`, in degrees from −180 to 180. */
    readonly thirdDegrees: number;

    /**
     * Downward terminal bar angle toward `+Z`, strictly between −90° and 90°.
     */
    readonly fourthDegrees: number;
  }

  /**
   * Local flexion, abduction and twist in degrees. Null is neutral on each
   * axis.
   */
  export type Rotation = QuadrupedPosePlan.Rotation;

  /**
   * Authors the full stand, lower, hold and rise cycle at fixed footprints.
   *
   * Supply the floor, three durations, trunk pitch, tail direction, fore and
   * hind fold settings, normalized movement windows and complete carriers.
   */
  export interface IParams {
    /** Horizontal floor position on the model's `+Y` axis, in metres. */
    floorY: number;

    /** Positive standing-to-belly transition time in seconds. */
    loweringSeconds: number;

    /** Nonnegative duration in seconds for the belly-supported hold. */
    restingSeconds: number;

    /** Positive belly-to-standing transition time in seconds. */
    risingSeconds: number;

    /**
     * Rest angle about model `+X`, with absolute value below 90°. Positive
     * raises the rear.
     */
    restPitch: number;

    /** Resting tail direction from down toward `+Z`, −180° through 180°. */
    tailDirection: number;

    /**
     * Third and fourth bar directions shared by each fore or hind limb pair.
     */
    folded: Readonly<Record<"fore" | "hind", IFoldedDirections>>;

    /**
     * Body and distal-pair movement intervals within the rise. Lowering
     * reverses them.
     */
    windows: Readonly<Record<"body" | "fore" | "hind", IWindow>>;

    /**
     * Explicit carrier bone for every non-bone part, including ears and tack.
     */
    parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>;

    /** Explicit carrier bone for each source contact ID. */
    contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>;
  }

  /**
   * Describes one independently evaluated moment of the supported pose.
   *
   * Read the posed model and local joint angles alongside its floor and
   * foot geometry at the requested time.
   */
  export interface ISample<Id extends string, Dimension extends string> {
    /** Identifies this pose as the `sternal` rest law. */
    kind: "sternal";

    /** New model with the posed links, attachments and source contacts. */
    animal: AutoMovieArchetype<Id, Dimension>;

    /** Current local degree rotations indexed by quadruped bone. */
    joints: ReadonlyMap<AutoMovieArchetypeQuadrupedBody.Bone, Rotation>;

    /** Rigid model-space pose of the whole rig, in metres and unit scale. */
    root: IAutoMovieTransform;

    /**
     * Four terminal cap centres at their source X/Z footprints and posed sole
     * heights.
     */
    feet: ReadonlyMap<AutoMovieArchetypeQuadrupedBody.Limb, IAutoMovieVector3>;

    /** Lowest posed part surface height minus the floor height, in metres. */
    floorClearance: number;

    /**
     * Whether the trunk contacts the floor at this sample within solver
     * roundoff.
     */
    bellySupported: boolean;

    /**
     * Clock label `lowering`, `resting`, `rising` or `standing`. Boundaries
     * use the later label.
     */
    phase: "lowering" | "resting" | "rising" | "standing";
  }

  /**
   * A complete sternal-rest plan evaluated directly from time.
   *
   * Use its duration and events for sequencing. Samples do not depend on
   * playback rate or previously requested seconds.
   */
  export interface IClip<Id extends string, Dimension extends string> {
    /** Sum of the three authored durations, in seconds. */
    readonly duration: number;

    /**
     * Seconds of first belly support, start of rise, end of belly support and
     * completion of the standing posture.
     */
    readonly events: Readonly<{
      bellyOn: number;
      riseStart: number;
      bellyOff: number;
      standing: number;
    }>;

    /**
     * Evaluates the supported pose at a time within the clip.
     *
     * @param seconds Time in seconds from the cycle's start, including both ends.
     * @returns A new pose sample and its support measurements.
     * @throws {RangeError} For an out-of-range time, unattainable foot goals
     *   or below-floor geometry.
     */
    sample(seconds: number): ISample<Id, Dimension>;
  }
}

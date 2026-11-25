import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetype } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { QuadrupedPosePlan } from "./QuadrupedPosePlan";

/**
 * Authored inputs and independently evaluated results of a sternal rest cycle.
 *
 * Ellis, Rankin and Hutchinson 2018 studied symmetrical belly-lying greyhound
 * rises without stepping (doi:10.3389/fbioe.2018.00162). Their study does not
 * supply other species' ROM, descent, side rolling or this control rig's
 * angles. Therefore all durations, distal carriage and phase windows are
 * explicit authoring inputs. The law promises geometric support, not measured
 * dynamics.
 */
export namespace AutoMovieArchetypeQuadrupedRestPlan {
  /** A minimum-jerk movement's start and end, as shares of a transition. */
  export type Window = readonly [number, number];

  /** Generic-rig degree rotations, with null meaning neutral. */
  export type Rotation = QuadrupedPosePlan.Rotation;

  /**
   * A complete symmetric fixed-footprint cycle from standing through rest and
   * back.
   */
  export interface IParams {
    /** Height of the horizontal floor in model space, metres. */
    floorY: number;

    /**
     * Positive authored standing-to-rest duration, seconds; no descent study is
     * implied.
     */
    loweringSeconds: number;

    /** Nonnegative authored duration of the supported resting hold, seconds. */
    restingSeconds: number;

    /** Positive authored rest-to-standing duration, seconds. */
    risingSeconds: number;

    /**
     * Authored rest pitch about model +X, degrees; positive raises the rear.
     * Roll and yaw stay neutral.
     */
    restPitch: number;

    /**
     * Authored resting tail direction, degrees from down toward +Z. Returning
     * to standing restores its source direction.
     */
    tailDirection: number;

    /**
     * Authored world directions of the third and fourth bars when resting,
     * degrees from straight down toward +Z. A distal fourth bar must point
     * downward; left/right share carriage, while their lengths differ.
     */
    folded: Readonly<Record<"fore" | "hind", readonly [number, number]>>;

    /**
     * Authored windows during rising. The body is lifted within body; the
     * distal two bars return within fore/hind. Lowering reverses this same
     * geometric path. A window sequence is not a measured clinical trajectory.
     */
    windows: Readonly<Record<"body" | "fore" | "hind", Window>>;

    /** Explicit carrier of every non-bone part, including tack and ears. */
    parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>;

    /**
     * Explicit carrier of every source affordance, preserving its exact id and
     * semantics.
     */
    contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>;
  }

  /** A newly evaluated physical drawing plus the goals used to make it. */
  export interface ISample<Id extends string, Dimension extends string> {
    /** A sternal rest's sample, posed in place. */
    kind: "sternal";

    /** New part/contact transforms; the source animal is not modified. */
    animal: AutoMovieArchetype<Id, Dimension>;

    /** Current local degree coordinates in the quadruped rig. */
    joints: ReadonlyMap<AutoMovieArchetypeQuadrupedBody.Bone, Rotation>;

    /** Current complete-rig placement in model space, metres and unit scale. */
    root: IAutoMovieTransform;

    /**
     * Terminal-bar cap centres, with fixed X/Z footprints and exact floor
     * clearance.
     */
    feet: ReadonlyMap<AutoMovieArchetypeQuadrupedBody.Limb, IAutoMovieVector3>;

    /** Minimum primitive surface height minus floor height, metres. */
    floorClearance: number;

    /** Whether the trunk's surface is on the floor during the resting hold. */
    bellySupported: boolean;

    /** Authored phase at this time; endpoints belong to the following phase. */
    phase: "lowering" | "resting" | "rising" | "standing";
  }

  /** A finite plan that is independent of playback rate and sample order. */
  export interface IClip<Id extends string, Dimension extends string> {
    /** Full cycle length in seconds. */
    readonly duration: number;

    /**
     * Exact authored support/phase event times, seconds, for capture and
     * composition.
     */
    readonly events: Readonly<{
      bellyOn: number;
      riseStart: number;
      bellyOff: number;
      standing: number;
    }>;

    /**
     * Evaluate from time alone. Time outside the finite cycle is refused;
     * unreachable, below-floor and inconsistent source rigs are refused too.
     */
    sample(seconds: number): ISample<Id, Dimension>;
  }
}

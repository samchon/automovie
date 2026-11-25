import type { IAutoMovieTransform } from "@automovie/interface";

import type { AutoMovieArchetype } from "../core";
import type { AutoMovieArchetypeQuadrupedRestPlan } from "./AutoMovieArchetypeQuadrupedRestPlan";

/** Authored lateral rest input and the posed geometry on its extended clock. */
export namespace AutoMovieArchetypeQuadrupedLateralRestPlan {
  /** Placement and clock for a turn onto one side followed by return. */
  export interface IParams {
    /** Authored positive roll angle in degrees about the longitudinal axis. */
    rollDegrees: number;
    /**
     * Authored inward proximal tuck of the two lower-side limbs, in [0, 90)
     * degrees.
     */
    tuckDegrees: number;
    /** The animal's side placed onto the floor. */
    side: "left" | "right";
    /** Positive seconds per turn, from the sternum to the side or back. */
    turnSeconds: number;
    /** Nonnegative seconds held in lateral recumbency. */
    holdSeconds: number;
    /** Nonnegative lateral offset, metres, toward the chosen side. */
    offset: number;
  }

  /** Currently posed archetype and the rigid model-to-scene placement. */
  export interface ISample<Id extends string, D extends string> {
    /** A lateral rest's sample, placed by its own rigid placer. */
    kind: "lateral";
    /** Fresh posed animal in model space. */
    animal: AutoMovieArchetype<Id, D>;
    /** Unit-scale rigid placer's transform in scene metres. */
    placement: IAutoMovieTransform;
    /** Model part ids at the lowest supporting surface. */
    support: readonly string[];
    /** The current timed step of the motion. */
    phase:
      | AutoMovieArchetypeQuadrupedRestPlan.ISample<Id, D>["phase"]
      | "rolling-to-side"
      | "lateral"
      | "rolling-to-sternum";
  }

  /** Extended rest plan sampled without playback state. */
  export interface IClip<Id extends string, D extends string> {
    /** Seconds to the end of the complete rest cycle. */
    readonly duration: number;
    /** Exact local seconds of the inserted transitions and standing recovery. */
    readonly events: Readonly<
      Record<
        "rollStart" | "lateralOn" | "lateralOff" | "sternal" | "standing",
        number
      >
    >;
    /** Read one fresh sample at film seconds within the complete interval. */
    sample: (seconds: number) => ISample<Id, D>;
  }
}

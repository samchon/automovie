import type { IAutoMovieTransform } from "@automovie/interface";

import type { AutoMovieArchetype } from "../core";
import type { AutoMovieArchetypeQuadrupedRestPlan } from "./AutoMovieArchetypeQuadrupedRestPlan";

/**
 * Authored lateral rest input and the actual posed geometry on its extended clock.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the additional time states and actual world placement.
 * @evidence contracts/development/design.md#principled-representation A lateral hold and two rigid roll intervals use explicit model and time units.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Retains the existing sternal clip's type parameters and shares its actual animal output.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Bounds come from the actual sampled supported body. Params claim authored movement without measured angles or kinetics.
 */
export namespace AutoMovieArchetypeQuadrupedLateralRestPlan {
  /**
   * Placement and clock for a turn onto one side followed by return.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines left and right, authored timing and lateral offset, and the two angle controls.
   * @evidence contracts/development/design.md#principled-representation A closed side choice and finite independent measures describe the lateral excerpt.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Includes only controls of the rolling interval and common scene floor.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing physical input has no preset clinical value.
   */
  export interface IParams {
    /** Authored positive roll angle in degrees about the longitudinal axis. */
    rollDegrees: number;
    /** Authored inward proximal tuck of the two lower-side limbs, in [0, 90) degrees. */
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

  /**
   * Actual currently posed archetype and the rigid model-to-scene placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines shape, placement, support sites and authored phase.
   * @evidence contracts/development/design.md#principled-representation The draw model and rigid placement are separate; support sites refer to actual emitted source ids.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Existing rest body and stable scene placement serve playback without new scene types.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Claims touching parts only where full support geometry is observed.
   */
  export interface ISample<Id extends string, D extends string> {
    /** Fresh actual posed animal in model space. */
    animal: AutoMovieArchetype<Id, D>;
    /** Unit-scale rigid placer's transform in scene metres. */
    placement: IAutoMovieTransform;
    /** Actual model part ids at the lowest supporting surface. */
    support: readonly string[];
    /** The current timed step of the motion. */
    phase:
      | AutoMovieArchetypeQuadrupedRestPlan.ISample<Id, D>["phase"]
      | "rolling-to-side"
      | "lateral"
      | "rolling-to-sternum";
  }

  /**
   * Extended rest plan sampled without playback state.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the duration, aligned events and the fresh actual sample.
   * @evidence contracts/development/design.md#principled-representation Composition uses film seconds and the closed phase cue labels, preserving the same typed animal and contact ids.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only duration, cues and independent current model/placement are exposed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No simulation loop, callback cache or forced renderer context is needed.
   */
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
    /**
     * Read one fresh sample at film seconds within the complete interval.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States seconds, the finite time domain and actual geometric support in a fresh sample.
     * @evidence contracts/development/implementation.md#principled-implementation Evaluate the original sternal phases or compose the admitted minimum-jerk roll and folded limbs before measuring actual support.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One clock selects the independently evaluated phase, geometry and placement.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No prior frame, lifted contact proxy or stretched bar changes the sample.
     * @evidence contracts/development/implementation.md#efficient-algorithms One pose emission and one linear support observation per query.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the original sternal sampler, carrier emission and exact primitive bounds with the producer.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each sample owns its model and placement. Prepared anatomy and timing die with the clip.
     */
    sample: (seconds: number) => ISample<Id, D>;
  }
}

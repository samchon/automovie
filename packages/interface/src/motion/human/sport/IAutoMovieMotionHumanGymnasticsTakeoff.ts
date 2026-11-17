import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A take-off at a chosen launch velocity (#3377): the jump's own push-off
 * (`jump`), from the planted foot of the entry, aimed so the centre of mass
 * leaves the floor at the velocity the law asks for.
 *
 * The jump takes a landing place and an apex, not a velocity: its vertical
 * launch speed is `sqrt(2 g apex)`, and its horizontal one is the distance
 * from its take-off centre to its landing centre over its flight time. The
 * flight time depends only on the apex and the heights, so moving the
 * landing place by the velocity still missing times that time gives the
 * asked velocity on the next plan; the heading moves with the place, so the
 * correction is made three times. The jump's plan is used up to its
 * `takeoff`; what the body does in the air is the caller's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation plan: The jump's plan; its postures up to `seconds` are the push-off. seconds: The take-off, seconds of the plan. centre: The centre of mass at the take-off, world metres.
 * @evidence contracts/development/design.md#principled-representation plan: The jump's plan; its postures up to `seconds` are the push-off. seconds: The take-off, seconds of the plan. centre: The centre of mass at the take-off, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/GymnasticsTakeoff.ts (GymnasticsTakeoff.of, return); sport/GymnasticsTakeoff.ts (GymnasticsTakeoff.of); sport/highJump.ts (highJump.plan); sport/poleVault.ts (poleVault.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanActionPlan, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanGymnasticsTakeoff {
  /**
   * Plan a take-off at the velocity a law asks for. A planned take-off.
   *
   * @evidence contracts/development/common.md#meaningful-documentation plan: The jump's plan; its postures up to `seconds` are the push-off. seconds: The take-off, seconds of the plan. centre: The centre of mass at the take-off, world metres.
   * @evidence contracts/development/design.md#principled-representation plan: The jump's plan; its postures up to `seconds` are the push-off. seconds: The take-off, seconds of the plan. centre: The centre of mass at the take-off, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/GymnasticsTakeoff.ts (GymnasticsTakeoff.of, return); sport/GymnasticsTakeoff.ts (GymnasticsTakeoff.of); sport/highJump.ts (highJump.plan); sport/poleVault.ts (poleVault.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanActionPlan, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ITakeoff {
    /** The jump's plan; its postures up to `seconds` are the push-off. */
    plan: IAutoMovieMotionHumanActionPlan;

    /** The take-off, seconds of the plan. */
    seconds: number;

    /** The centre of mass at the take-off, world metres. */
    centre: IAutoMovieVector3;

    /** Its launch velocity, m/s. */
    velocity: IAutoMovieVector3;
  }
}

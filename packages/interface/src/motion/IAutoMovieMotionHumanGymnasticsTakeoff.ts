import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanActionPlan } from "./IAutoMovieMotionHumanActionPlan";

/**
 * A take-off at a chosen launch velocity: the jump's own push-off (`jump`),
 * from the planted foot of the entry, aimed so the centre of mass leaves the
 * floor at the velocity the law asks for.
 *
 * The jump takes a landing place and an apex, not a velocity: its vertical
 * launch speed is `sqrt(2 g apex)`, and its horizontal one is the distance from
 * its take-off centre to its landing centre over its flight time. The flight
 * time depends only on the apex and the heights, so moving the landing place by
 * the velocity still missing times that time gives the asked velocity on the
 * next plan; the heading moves with the place, so the correction is made three
 * times. The jump's plan is used up to its `takeoff`; what the body does in the
 * air is the caller's.
 */
export namespace IAutoMovieMotionHumanGymnasticsTakeoff {
  /** Plan a take-off at the velocity a law asks for. A planned take-off. */
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

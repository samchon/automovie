import type {
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import { jump } from "../actions/jump";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { GymnasticsFlight } from "./GymnasticsFlight";

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
 * @evidence contracts/development/common.md#meaningful-documentation States what is reused, why the correction converges and what the caller takes.
 * @evidence contracts/development/design.md#principled-representation The jump's plan with its take-off second, centre and launch velocity read off its displayed postures.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The take-off record and one function, read by the high jump and the pole vault.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The push-off is the jump's, never restated.
 */
export namespace GymnasticsTakeoff {
  /** A planned take-off. */
  export interface ITakeoff {
    /** The jump's plan; its postures up to `seconds` are the push-off. */
    plan: IHumanActionPlan;

    /** The take-off, seconds of the plan. */
    seconds: number;

    /** The centre of mass at the take-off, world metres. */
    centre: IAutoMovieVector3;

    /** Its launch velocity, m/s. */
    velocity: IAutoMovieVector3;
  }

  /** How many times the landing place is corrected. */
  const PASSES: number = 3;

  /**
   * Plan a take-off at the velocity a law asks for.
   *
   * @param context The action's context.
   * @param aim The launch velocity asked, m/s, given the take-off centre, world metres; its vertical part positive.
   * @returns The take-off.
   * @throws {HumanRefusal} When the velocity asked does not rise, or the jump refuses its push-off.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The apex is v_y² / 2g, the jump's own law; the landing place is corrected by the missing horizontal velocity times the jump's flight time, which is linear in the place.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A guess, then the corrections.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The velocity returned is the one the last plan shows, not the one asked.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four jump plans and four launch readings.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the last jump plan only, in the result.
   */
  export function of(
    context: IHumanActionContext<object>,
    aim: (centre: IAutoMovieVector3) => IAutoMovieVector3,
  ): ITakeoff {
    const model: GymnasticsFlight.Model = GymnasticsFlight.model(context.body);
    const root: IAutoMovieVector3 = context.entry.posture.root;

    // The first aim reads a centre over the root at the share of the stature
    // a standing centre of mass is at (about 0.55, a first guess the passes
    // replace with the plan's own centre).
    const first: IAutoMovieVector3 = aim({
      x: root.x,
      y: root.y + 0.55 * context.body.measure.stature,
      z: root.z,
    });
    const apexOf = (velocity: IAutoMovieVector3): number => {
      if (!(velocity.y > 0))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "launch",
          value: velocity.y,
          reason: `a take-off rises, and the launch asked climbs at ${velocity.y.toFixed(2)} m/s`,
          fix: "aim the flight higher",
        });
      return (velocity.y * velocity.y) / (2 * GymnasticsFlight.G);
    };
    let apex: number = apexOf(first);
    const guess: number = (2 * first.y) / GymnasticsFlight.G;
    let to: IAutoMovieVector3 = {
      x: root.x + first.x * guess,
      y: 0,
      z: root.z + first.z * guess,
    };
    const at = (plan: IHumanActionPlan, event: string): number =>
      (plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === event,
      )?.share ?? 0) * plan.duration;

    let taken: ITakeoff | undefined;
    for (let pass: number = 0; pass <= PASSES; pass++) {
      const plan: IHumanActionPlan = jump.plan({
        ...context,
        params: { to, apex },
      });
      const seconds: number = at(plan, "takeoff");
      const read: { centre: IAutoMovieVector3; velocity: IAutoMovieVector3 } =
        GymnasticsFlight.launch(context.body, model, plan, seconds);
      taken = { plan, seconds, ...read };
      if (pass === PASSES) break;

      // Correct the landing place by what the horizontal launch still
      // misses, over the jump's own flight time.
      const asked: IAutoMovieVector3 = aim(read.centre);
      const flight: number = at(plan, "touchdown") - seconds;
      to = {
        x: to.x + (asked.x - read.velocity.x) * flight,
        y: 0,
        z: to.z + (asked.z - read.velocity.z) * flight,
      };
      apex = apexOf(asked);
    }
    return taken!;
  }
}

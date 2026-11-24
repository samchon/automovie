import { AutoMovieGravity } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanGymnasticsTakeoff,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieVector3,
} from "@automovie/interface";

import { jump } from "../actions/jump";
import { HumanRefusal } from "../law/HumanRefusal";
import { GymnasticsFlight } from "./GymnasticsFlight";
import { prepareGymnasticsLaunch } from "./prepareGymnasticsLaunch";

/** The record of `IOfRead`'s site. */
type IOfRead = { centre: IAutoMovieVector3; velocity: IAutoMovieVector3 };

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
export namespace GymnasticsTakeoff {
  /** How many times the landing place is corrected. */
  const PASSES: number = 3;

  /**
   * Plan a take-off at the velocity a law asks for.
   *
   * @param context The action's context.
   * @param aim The launch velocity asked, m/s, given the take-off centre, world
   *   metres; its vertical part positive.
   * @param foot The optional authored support foot for the push-off.
   * @returns The take-off.
   * @throws {HumanRefusal} When the velocity asked does not rise, or the jump
   *   refuses its push-off.
   */
  export function of(
    context: IAutoMovieMotionHumanActionContext<object>,
    aim: (centre: IAutoMovieVector3) => IAutoMovieVector3,
    foot?: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanGymnasticsTakeoff.ITakeoff {
    const model: IAutoMovieResolveCenterOfMass.IModel = GymnasticsFlight.model(
      context.body,
    );
    const launch: ReturnType<typeof prepareGymnasticsLaunch> =
      prepareGymnasticsLaunch(context.body, model);
    const root: IAutoMovieVector3 = context.entry.posture.root;

    // The first aim reads a centre over the root at the share of the stature
    // a standing centre of mass is at (about 0.55, a first guess the passes
    // replace with the plan's own centre).
    const first: IAutoMovieVector3 = aim({
      x: root.x,
      y: root.y + 0.55 * context.body.measure.stature,
      z: root.z,
    });
    const apexOf: (velocity: IAutoMovieVector3) => number = (
      velocity: IAutoMovieVector3,
    ): number => {
      if (!(velocity.y > 0))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "launch",
          value: velocity.y,
          reason: `a take-off rises, and the launch asked climbs at ${velocity.y.toFixed(2)} m/s`,
          fix: "aim the flight higher",
        });
      return (velocity.y * velocity.y) / (2 * AutoMovieGravity.STANDARD);
    };
    let apex: number = apexOf(first);
    const guess: number = (2 * first.y) / AutoMovieGravity.STANDARD;
    let to: IAutoMovieVector3 = {
      x: root.x + first.x * guess,
      y: 0,
      z: root.z + first.z * guess,
    };
    const at: (
      plan: IAutoMovieMotionHumanActionPlan,
      event: string,
    ) => number = (
      plan: IAutoMovieMotionHumanActionPlan,
      event: string,
    ): number =>
      (plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === event)
        ?.share ?? 0) * plan.duration;

    let taken: IAutoMovieMotionHumanGymnasticsTakeoff.ITakeoff | undefined;
    for (let pass: number = 0; pass <= PASSES; pass++) {
      const plan: IAutoMovieMotionHumanActionPlan = jump.plan(
        {
          ...context,
          params: { to, apex },
        },
        foot,
      );
      const seconds: number = at(plan, "takeoff");
      const read: IOfRead = launch(plan, seconds);
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

  /**
   * The push-off's contacts up to the take-off, rescaled to the action that
   * goes on from it: every window the jump declared before its take-off, cut
   * there, so the feet bear exactly where the push-off bears them.
   *
   * @param takeoff The take-off.
   * @param duration The whole action's seconds.
   * @returns The windows, shares of `duration`.
   */
  export function contacts(
    takeoff: IAutoMovieMotionHumanGymnasticsTakeoff.ITakeoff,
    duration: number,
  ): IAutoMovieMotionHumanContactWindow[] {
    const span: number = takeoff.plan.duration;
    return takeoff.plan.contacts
      .filter(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.from * span < takeoff.seconds - 1e-9,
      )
      .map(
        (
          c: IAutoMovieMotionHumanContactWindow,
        ): IAutoMovieMotionHumanContactWindow => ({
          ...c,
          from: (c.from * span) / duration,
          to: Math.min(c.to * span, takeoff.seconds) / duration,
        }),
      );
  }
}

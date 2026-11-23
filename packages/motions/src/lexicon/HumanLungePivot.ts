import { minimumJerk } from "@automovie/engine";
import type { AutoMovieHumanSide } from "@automovie/interface";

import { walkReach } from "../actions/walkReach";
import { HumanRefusal } from "../law/HumanRefusal";

/**
 * A handler's feet turning on the spot to follow a moving bearing: pivot steps,
 * each the foot on the side of the turn swinging round the centre first and the
 * other following, taken whenever the bearing has moved `TRIGGER` from the
 * feet.
 *
 * A step lays the feet `TRIGGER` past where the bearing will be when it ends,
 * so the pelvis, which faces the bearing, runs from that lead back through the
 * feet's heading to the same lag behind before the next step; between steps the
 * feet stand. The heading the pelvis keeps from the feet is the hip's own
 * rotation, bounded by `walkReach.TWIST`; a bearing that outruns the steps
 * beyond it is refused.
 */
export namespace HumanLungePivot {
  /**
   * The lag of the bearing behind the feet that starts a step, and the lead a
   * step lays them ahead of it, degrees (provisional): a third of the hip's
   * twist, leaving the rest for the turn while a step is under way.
   */
  export const TRIGGER: number = walkReach.TWIST / 3;

  /** One pivot step. */
  export interface IStep {
    /** Seconds since the action's start the leading foot lifts. */
    start: number;

    /** The foot that swings first, on the side of the turn. */
    lead: AutoMovieHumanSide;

    /** The feet's heading before the step, degrees. */
    from: number;

    /** The feet's heading after it, degrees. */
    to: number;
  }

  /** The steps of one action. */
  export interface ISchedule {
    /** The steps, in time order, never overlapping. */
    steps: readonly IStep[];

    /** Seconds one foot's swing takes; a step is two. */
    swing: number;

    /** The feet's heading at the start, degrees. */
    heading: number;
  }

  /** A foot's heading and swing at a second. */
  export interface IFoot {
    /** The foot's heading, degrees. */
    heading: number;

    /** The swing's share while the foot is in the air; absent while it stands. */
    swing?: number;
  }

  /**
   * Plan the steps that follow a bearing.
   *
   * @param bearing The bearing at seconds since the action's start, degrees,
   *   continuous (unwrapped).
   * @param seconds The action's length.
   * @param heading The feet's heading at the start, degrees.
   * @param swing Seconds one foot's swing takes.
   * @param dt The scan's step, seconds, at most half a swing.
   * @returns The schedule.
   * @throws {HumanRefusal} When the bearing runs more than the hip's twist from
   *   the feet.
   */
  export function plan(
    bearing: (seconds: number) => number,
    seconds: number,
    heading: number,
    swing: number,
    dt: number,
  ): ISchedule {
    const steps: IStep[] = [];
    let feet: number = heading;
    for (let t: number = 0; t <= seconds; ) {
      const now: number = bearing(t);
      const lag: number = now - feet;
      if (Math.abs(lag) > walkReach.TWIST)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "on",
          value: lag,
          feasible: {
            kind: "range",
            minimum: -walkReach.TWIST,
            maximum: walkReach.TWIST,
            unit: "deg",
          },
          reason: `the horse's bearing runs ${lag} degrees from the handler's feet at ${t} s, more than the hip turns`,
          fix: "Lunge the horse on a wider circle or at a slower gait, so its bearing turns no faster than pivot steps follow.",
        });
      if (Math.abs(lag) >= TRIGGER && t + 2 * swing <= seconds) {
        const to: number = bearing(t + 2 * swing) + Math.sign(lag) * TRIGGER;
        steps.push({
          start: t,
          lead: lag > 0 ? "left" : "right",
          from: feet,
          to,
        });
        // The step's own swings are scanned for the twist too.
        for (let u: number = t + dt; u < t + 2 * swing; u += dt) {
          const schedule: ISchedule = { steps, swing, heading };
          const during: number =
            bearing(u) -
            (foot(schedule, "left", u).heading +
              foot(schedule, "right", u).heading) /
              2;
          if (Math.abs(during) > walkReach.TWIST)
            throw new HumanRefusal({
              kind: "parameter",
              axis: "on",
              value: during,
              feasible: {
                kind: "range",
                minimum: -walkReach.TWIST,
                maximum: walkReach.TWIST,
                unit: "deg",
              },
              reason: `the horse's bearing runs ${during} degrees from the handler's stepping feet at ${u} s, more than the hip turns`,
              fix: "Lunge the horse on a wider circle or at a slower gait, so its bearing turns no faster than pivot steps follow.",
            });
        }
        feet = to;
        t += 2 * swing;
        continue;
      }
      t += dt;
    }
    return { steps, swing, heading };
  }

  /**
   * A foot's heading at a second.
   *
   * @param schedule The steps.
   * @param side The foot.
   * @param seconds Seconds since the action's start.
   * @returns Its heading and, while it swings, the swing's share.
   */
  export function foot(
    schedule: ISchedule,
    side: AutoMovieHumanSide,
    seconds: number,
  ): IFoot {
    let step: IStep | undefined;
    for (const candidate of schedule.steps)
      if (candidate.start <= seconds) step = candidate;
      else break;
    if (step === undefined) return { heading: schedule.heading };
    const lift: number = step.start + (side === step.lead ? 0 : schedule.swing);
    const local: number = (seconds - lift) / schedule.swing;
    if (local <= 0) return { heading: step.from };
    if (local >= 1) return { heading: step.to };
    return {
      heading: step.from + (step.to - step.from) * minimumJerk.share(local),
      swing: local,
    };
  }
}

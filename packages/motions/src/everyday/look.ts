import { type IAutoMovieRandom, minimumJerk } from "@automovie/engine";
import type { AutoMovieMotionTarget, IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import { HumanGaze } from "./HumanGaze";

/**
 * Standing and turning the eyes, head and trunk to a target, either at once
 * or, when cued by something seen or heard, after a seeded reaction time:
 * the orienting response of a bystander.
 *
 * The feet stay planted where they are (the stand law places the body), and
 * the gaze goal is the eyes' lines on the target, recruited eyes, head and
 * trunk in that order ({@link HumanGaze}); the target is tracked while the
 * action lasts. Use the gaze layer to look while doing something else; this
 * action is for a gaze that is the whole performance or that must turn the
 * trunk.
 *
 * An uncued look at a target outside the 120 degree field the performer
 * attends ahead (60 degrees either side of the heading) is refused: nothing
 * there could have drawn the look, so the author declares the cue. A cue
 * delays the shift by a simple reaction time drawn from an ex-Gaussian, the
 * distribution simple reaction times follow (Hohle 1965, J Exp Psychol
 * 69:382): a visual cue `seen` with mu, sigma and tau of 260, 35 and 70 ms
 * for a novice to 220, 25 and 40 ms for an elite on the `reaction` axis, and
 * an acoustic `signal` 40 ms faster in mu, since simple auditory reaction is
 * faster than visual by a few tens of milliseconds (Welford 1980, Reaction
 * Times). The values are provisional: they place the mean inside the 200 to
 * 300 ms of simple visual reaction in adults, and no study located measures
 * orienting onset by skill.
 *
 * Events: `gazeOn`, when the eyes reach the target, and `settled`, when the
 * head and trunk end their turn.
 */
export namespace look {
  /** The action's name. */
  export const name: HumanActionName = "look";

  /** Cancel table: a look holds no contact beyond the stand, so it can be cut anywhere. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    walk: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    look: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
  };

  /** Parameters. */
  export interface IParams {
    /** What to look at. */
    target: AutoMovieMotionTarget;

    /** Which segments may join; `auto` when absent. */
    with?: HumanGaze.Recruit;

    /** What drew the look; an immediate, willed look when absent. */
    cue?: "seen" | "signal";

    /** How long the action lasts, seconds; 0.6 s after `settled` when absent. */
    seconds?: number;
  }

  /** Half the attended field ahead, degrees. */
  export const FIELD: number = 60;

  /**
   * Plan a look.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When an uncued target lies outside the attended field.
   */
  export function plan(context: IHumanActionContext<IParams>): IHumanActionPlan {
    const recruit: HumanGaze.Recruit = context.params.with ?? "auto";
    const at = (seconds: number): IAutoMovieVector3 => context.aim(context.params.target, context.start + seconds).point;
    const first: { yaw: number; pitch: number } = HumanGaze.direction(context.body, context.entry.posture, at(0));
    if (context.params.cue === undefined && Math.abs(first.yaw) > FIELD)
      throw new Error(`${context.subject}: the target lies ${first.yaw.toFixed(1)} degrees off the heading, outside the attended ${FIELD} degrees; declare the cue that draws the look`);
    const delay: number = context.params.cue === undefined ? 0 : reaction(context.skill, context.random("reaction"), context.params.cue);
    const parts: HumanGaze.ISplit = HumanGaze.split(first.yaw, first.pitch, recruit);
    const eyes: number = HumanGaze.saccade(Math.min(Math.hypot(first.yaw, first.pitch), 2 * HumanGaze.EYES));
    const head: number = HumanGaze.turn(Math.hypot(parts.head.yaw, parts.head.pitch));
    const trunk: number = HumanGaze.turn(parts.trunk);
    const settled: number = delay + Math.max(eyes, head, trunk);
    const duration: number = context.params.seconds ?? settled + 0.6;
    if (!(duration > 0)) throw new Error("A look lasts a positive time");
    const base: IHumanActionPlan = stand.plan({ ...context, params: { seconds: duration } });
    const weight = (seconds: number, span: number): number => minimumJerk((seconds - delay) / span).s;
    return {
      duration,
      events: [
        { name: "gazeOn", share: Math.min(1, (delay + eyes) / duration) },
        { name: "settled", share: Math.min(1, settled / duration) },
      ],
      contacts: base.contacts,
      posture: (seconds: number): IHumanPosture =>
        HumanGaze.aim(context.body, base.posture(seconds), at(seconds), recruit, {
          eyes: weight(seconds, eyes),
          head: weight(seconds, head),
          trunk: weight(seconds, trunk),
        }),
    };
  }

  /**
   * A simple reaction time to a cue, seconds: an ex-Gaussian draw (a normal
   * plus an exponential) with skill-scaled parameters.
   *
   * @param skill The skill; its `reaction` axis scales the parameters.
   * @param random The stream; reads indices 0 to 2.
   * @param cue Visual or acoustic.
   * @returns Seconds; at least 0.1.
   */
  export function reaction(skill: HumanSkill.ISkill, random: IAutoMovieRandom, cue: "seen" | "signal"): number {
    const mu: number = HumanSkill.quantity(skill, "reaction", 0.26, 0.22) - (cue === "signal" ? 0.04 : 0);
    const sigma: number = HumanSkill.quantity(skill, "reaction", 0.035, 0.025);
    const tau: number = HumanSkill.quantity(skill, "reaction", 0.07, 0.04);
    const exponential: number = -tau * Math.log(Math.max(1e-12, 1 - random.float(2)));
    return Math.max(0.1, mu + sigma * HumanSkill.normal(random, 0) + exponential);
  }
}

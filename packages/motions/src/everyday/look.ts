import { type IAutoMovieRandom, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, the method, the timing, the events and the refusals, with sources and provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters and the plan the performance dispatches through, plus the helpers its tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, hand and frame types; no body is special-cased.
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

  /**
   * Parameters of a look: the target, which segments may join, the cue that
   * drew the look and how long the action lasts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each field states its meaning, unit and the default an absent value takes, including that an absent cue means an immediate willed look.
   * @evidence contracts/development/design.md#principled-representation The target is the shared motion target union, tracked every instant; the recruitment is HumanGaze's closed union; the cue is a closed union of the two sensory channels whose reaction times differ; the duration is seconds, and a non-positive one is refused at plan time.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by this law and read only by its plan; the target and recruitment types are imported from their owners.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No field names a scene or body; the one invalid combination, an uncued target outside the attended field, depends on where the target is at the start and is refused at plan time.
   */
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
   * Plan a look: refuse an uncued target outside the attended field, draw a
   * cued look's reaction time, split the gaze shift over eyes, head and
   * trunk, time each part, and return standing postures aimed at the tracked
   * target.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When an uncued target lies outside the attended field, or the duration is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the steps and both refusals; the law's doc gives the field, the reaction-time sources and the events.
   * @evidence contracts/development/implementation.md#principled-implementation The gaze goal is the eyes' lines on the target, recruited eyes, head and trunk in that order by HumanGaze.split; the eyes take the saccade's main-sequence duration (capped at twice the eyes' range) and head and trunk their turn durations, each on a minimum-jerk weight from the reaction delay; the target is re-aimed every instant, so a moving target is tracked.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The plan times the shift and the stand law places the body; direction, split, durations and the aiming solve are owned by HumanGaze, and the reaction draw is `reaction`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts FIELD is a named constant and the 0.6 s hold after settling is the documented default duration; nothing is special-cased per target or body.
   * @evidence contracts/development/implementation.md#efficient-algorithms Planning is constant work plus one stand plan; each posture costs one aim of the target, one stand posture and one gaze solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The split, durations and delay are computed once per instance; the target is re-read per instant because it may move.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The posture closure holds this instance's context, timing and stand base, released with the performance; nothing grows per call.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const recruit: HumanGaze.Recruit = context.params.with ?? "auto";
    const at = (seconds: number): IAutoMovieVector3 =>
      context.aim(context.params.target, context.start + seconds).point;
    const first: { yaw: number; pitch: number } = HumanGaze.direction(
      context.body,
      context.entry.posture,
      at(0),
    );
    if (context.params.cue === undefined && Math.abs(first.yaw) > FIELD)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "cue",
        value: context.params.cue ?? "seen",
        feasible: { kind: "alternatives", values: ["signal"] },
        reason: `the target lies ${first.yaw.toFixed(1)} degrees off the heading, outside the attended ${FIELD} degrees; declare the cue that draws the look`,
        fix: 'declare the cue that draws the look (cue: "signal"), or turn toward the target first',
      });
    const delay: number =
      context.params.cue === undefined
        ? 0
        : reaction(
            context.skill,
            context.random("reaction"),
            context.params.cue,
          );
    const parts: HumanGaze.ISplit = HumanGaze.split(
      first.yaw,
      first.pitch,
      recruit,
    );
    const eyes: number = HumanGaze.saccade(
      Math.min(Math.hypot(first.yaw, first.pitch), 2 * HumanGaze.EYES),
    );
    const head: number = HumanGaze.turn(
      Math.hypot(parts.head.yaw, parts.head.pitch),
    );
    const trunk: number = HumanGaze.turn(parts.trunk);
    const settled: number = delay + Math.max(eyes, head, trunk);
    const duration: number = context.params.seconds ?? settled + 0.6;
    HumanBound.above("seconds", duration, 0, "s");
    const base: IHumanActionPlan = stand.plan({
      ...context,
      params: { seconds: duration },
    });
    const weight = (seconds: number, span: number): number =>
      minimumJerk((seconds - delay) / span).s;
    return {
      duration,
      events: [
        { name: "gazeOn", share: Math.min(1, (delay + eyes) / duration) },
        { name: "settled", share: Math.min(1, settled / duration) },
      ],
      contacts: base.contacts,
      posture: (seconds: number): IHumanPosture =>
        HumanGaze.aim(
          context.body,
          base.posture(seconds),
          at(seconds),
          recruit,
          {
            eyes: weight(seconds, eyes),
            head: weight(seconds, head),
            trunk: weight(seconds, trunk),
          },
        ),
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the distribution, the skill scaling, the stream indices read, the unit and the floor.
   * @evidence contracts/development/implementation.md#principled-implementation Draws an ex-Gaussian, the distribution simple reaction times follow (Hohle 1965): a normal from HumanSkill.normal plus an inverse-transform exponential, with mu, sigma and tau interpolated on the `reaction` axis and mu 40 ms lower for an acoustic cue (Welford 1980).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure draw from the caller's seeded stream, kept apart from the plan that uses it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The parameter values are documented as provisional; the 0.1 s floor cuts the rare draw below the shortest simple reaction instead of letting a look start before its cue could be sensed, and the 1e-12 guard only keeps the logarithm finite.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time, three stream reads.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Deterministic in its stream; the plan calls it once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function reaction(
    skill: HumanSkill.ISkill,
    random: IAutoMovieRandom,
    cue: "seen" | "signal",
  ): number {
    const mu: number =
      HumanSkill.quantity(skill, "reaction", 0.26, 0.22) -
      (cue === "signal" ? 0.04 : 0);
    const sigma: number = HumanSkill.quantity(skill, "reaction", 0.035, 0.025);
    const tau: number = HumanSkill.quantity(skill, "reaction", 0.07, 0.04);
    const exponential: number =
      -tau * Math.log(Math.max(1e-12, 1 - random.float(2)));
    return Math.max(
      0.1,
      mu + sigma * HumanSkill.normal(random, 0) + exponential,
    );
  }
}

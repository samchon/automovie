import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanGaze,
  IAutoMovieMotionHumanLook,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSkill,
  IAutoMovieRandom,
  IAutoMovieReactionTimeDistribution,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmClearance } from "../posture/HumanArmClearance";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the overlay flag, the field and the plan the performance dispatches through, and `reactionLaw`, which `HumanResponse` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, hand and frame types; no body is special-cased.
 */
export namespace look {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "look";

  /** Cancel table: a look holds no contact beyond the stand, so it can be cut anywhere. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    walk: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate }],
    look: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
  };

  /** A look may be performed over a carrier: it claims the head, and the trunk when the shift recruits it. */
  export const overlay: boolean = true;

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
   * @evidence contracts/development/implementation.md#principled-implementation The gaze goal is the eyes' lines on the target, recruited eyes, head and trunk in that order by HumanGaze.split; the eyes take the saccade's main-sequence duration (capped at twice the eyes' range) and head and trunk their turn durations, each on a minimum-jerk weight from the reaction delay; the target is re-aimed every instant, so a moving target is tracked, its yaw read on the side the look chose at its start.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The plan times the shift; the stand law places the body, its hanging arms let out of a turned trunk's way by `HumanArmClearance.swung`, or the carrier does when the look is an overlay, which then takes the head and, when recruited, the trunk; direction, split, durations and the aiming solve are owned by HumanGaze, and the reaction draw is `reaction`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts FIELD is a named constant and the 0.6 s hold after settling is the documented default duration; nothing is special-cased per target or body.
   * @evidence contracts/development/implementation.md#efficient-algorithms Planning is constant work plus one base plan; each posture costs one direction of the target, one aim of it, the arms' clearance under a turned trunk on the look's own stand, one base posture (the stand's or the carrier's) and one gaze solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Split, durations and delay prepare once; every instant re-reads its actual target and lends one local/host FK workspace to the complete base and raw gaze aim. A supplied genuine ROM projector is forwarded to the base only, preserving gaze's raw authored-trunk policy.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains fixed context/timing/base until performance release. Its current lazy FK getter and optional ROM loan end on synchronous return/throw, without entering the returned posture or retained callback.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLook.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const recruit: IAutoMovieMotionHumanGaze.Recruit = context.params.with ?? "auto";
    const at: (seconds: number) => IAutoMovieVector3 = (seconds: number): IAutoMovieVector3 =>
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
        value: null,
        feasible: { kind: "alternatives", values: ["seen", "signal"] },
        reason: `the target lies ${first.yaw.toFixed(1)} degrees off the heading, outside the attended ${FIELD} degrees; declare the cue that draws the look`,
        fix: 'declare the cue that draws the look (cue: "seen" or "signal"), or turn toward the target first',
      });
    const delay: number =
      context.params.cue === undefined
        ? 0
        : reaction(
            context.skill,
            context.random("reaction"),
            context.params.cue,
          );
    const parts: IAutoMovieMotionHumanGaze.ISplit = HumanGaze.split(
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

    // The body under the look: the carrier's when the look is an overlay,
    // otherwise the stand law's.
    const base: IAutoMovieMotionHumanActionPlan =
      context.carrier === undefined
        ? stand.plan({ ...context, params: { seconds: duration } })
        : AutoMovieMotionHumanBase.under(context, duration);
    const weight: (seconds: number, span: number) => number = (seconds: number, span: number): number =>
      minimumJerk.share((seconds - delay) / span);
    // The target's direction from a posture, on the side the look chose
    // when it began: a target straight behind, whose yaw crosses from +180
    // to -180 as the body sways, keeps the turn on that side.
    const towards: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      read?: ReturnType<typeof prepareHumanPoseResolution>,
    ) => IAutoMovieMotionHumanGaze.IDirectionResult = (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      read?: ReturnType<typeof prepareHumanPoseResolution>,
    ): IAutoMovieMotionHumanGaze.IDirectionResult => {
      const now: IAutoMovieMotionHumanGaze.IDirectionResult = HumanGaze.direction(context.body, posture, at(seconds), read);
      return { ...now, yaw: now.yaw + 360 * Math.round((first.yaw - now.yaw) / 360) };
    };
    return {
      duration,
      events: [
        { name: "gazeOn", share: Math.min(1, (delay + eyes) / duration) },
        { name: "settled", share: Math.min(1, settled / duration) },
      ],
      contacts: base.contacts,

      // Over a carrier the look takes the head, and the trunk when the
      // shift recruits it.
      ...(context.carrier === undefined
        ? {}
        : {
            channels:
              parts.trunk === 0
                ? (["head"] as const)
                : (["trunk", "head"] as const),
          }),
      posture: (seconds: number, _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3]): IAutoMovieMotionHumanPosture => {
        const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
        const standing: IAutoMovieMotionHumanPosture = base.posture(seconds, undefined, read, projection);
        const aimed: IAutoMovieMotionHumanPosture = HumanGaze.aim(
          context.body,
          standing,
          at(seconds),
          recruit,
          {
            eyes: weight(seconds, eyes),
            head: weight(seconds, head),
            trunk: weight(seconds, trunk),
          },
          read,
          towards(standing, seconds, read),
        );
        // A trunk turned on the look's own stand carries the hanging arms
        // across the thighs: they are let out as a swinging arm is, no
        // nearer the body than in the quiet stance (`HumanArmClearance.swung`).
        return context.carrier === undefined && parts.trunk !== 0
          ? HumanArmClearance.swung(context.body, aimed, ["left", "right"], read, projection)
          : aimed;
      },
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
  function reaction(
    skill: IAutoMovieMotionHumanSkill,
    random: IAutoMovieRandom,
    cue: "seen" | "signal",
  ): number {
    return Math.max(
      0.1,
      HumanSkill.reaction(reactionLaw(skill, cue), random, 0),
    );
  }

  /**
   * The ex-Gaussian parameters of an orienting reaction, seconds: mu 0.26 s
   * to 0.22 s, sigma 35 ms to 25 ms and tau 70 ms to 40 ms on the
   * `reaction` axis (provisional), mu 40 ms lower for an acoustic cue
   * (Welford 1980).
   *
   * @param skill The skill; its `reaction` axis scales the parameters.
   * @param cue Visual or acoustic.
   * @returns The parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each parameter's range, the acoustic advantage and that the values are provisional.
   * @evidence contracts/development/implementation.md#principled-implementation Each parameter read on the reaction axis between its novice and elite values.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three quantity reads.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function reactionLaw(
    skill: IAutoMovieMotionHumanSkill,
    cue: "seen" | "signal",
  ): IAutoMovieReactionTimeDistribution {
    return {
      mu:
        HumanSkill.quantity(skill, "reaction", 0.26, 0.22) -
        (cue === "signal" ? 0.04 : 0),
      sigma: HumanSkill.quantity(skill, "reaction", 0.035, 0.025),
      tau: HumanSkill.quantity(skill, "reaction", 0.07, 0.04),
    };
  }
}

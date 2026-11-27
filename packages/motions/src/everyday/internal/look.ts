import { AutoMovieEngineMotionSampling } from "@automovie/engine";
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

import { stand } from "../../actions/internal/stand";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanArmSwing } from "../../posture/internal/HumanArmSwing";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { HumanSkill } from "../../skill/internal/HumanSkill";
import { HumanGaze } from "./HumanGaze";

/*
 * Standing and turning the eyes, head and trunk to a target, either at once or,
 * when cued by something seen or heard, after a seeded reaction time: the
 * orienting response of a bystander.
 *
 * The feet stay planted where they are (the stand law places the body), and the
 * gaze goal is the eyes' lines on the target, recruited eyes, head and trunk in
 * that order (HumanGaze); the target is tracked while the action lasts.
 * Use the gaze layer to look while doing something else; this action is for a
 * gaze that is the whole performance or that must turn the trunk.
 *
 * An uncued look at a target outside the 120 degree field the performer attends
 * ahead (60 degrees either side of the heading) is refused: nothing there could
 * have drawn the look, so the author declares the cue. A cue delays the shift
 * by a simple reaction time drawn from an ex-Gaussian, the distribution simple
 * reaction times follow (Hohle 1965, J Exp Psychol 69:382): a visual cue `seen`
 * with mu, sigma and tau of 260, 35 and 70 ms for a novice to 220, 25 and 40 ms
 * for an elite on the `reaction` axis, and an acoustic `signal` 40 ms faster in
 * mu, since simple auditory reaction is faster than visual by a few tens of
 * milliseconds (Welford 1980, Reaction Times). The values are provisional: they
 * place the mean inside the 200 to 300 ms of simple visual reaction in adults,
 * and no study located measures orienting onset by skill.
 *
 * Events: `gazeOn`, when the eyes reach the target, and `settled`, when the
 * head and trunk end their turn.
 */
export namespace look {
  /*
   * Admit the starting yaw in degrees when the performer has no cue.
   */
  export function admitCue(yaw: number, cue: IAutoMovieMotionHumanLook.IParams["cue"]): void {
    if (cue === undefined && Math.abs(yaw) > FIELD)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "cue",
        value: null,
        feasible: { kind: "alternatives", values: ["seen", "signal"] },
        reason: `the target lies ${yaw.toFixed(1)} degrees off the heading, outside the attended ${FIELD} degrees; declare the cue that draws the look`,
        fix: 'declare the cue that draws the look (cue: "seen" or "signal"), or turn toward the target first',
      });
  }
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "look";

  /*
   * Cancel table: a look holds no contact beyond the stand, so it can be cut
   * anywhere.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
    walk: [
      {
        window: [0, 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    look: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
  };

  /*
   * A look may be performed over a carrier: it claims the head, and the trunk
   * when the shift recruits it.
   */
  export const overlay: boolean = true;

  /*
   * Half the attended field ahead, degrees.
   */
  export const FIELD: number = 60;

  /*
   * Plan a look: refuse an uncued target outside the attended field, draw a
   * cued look's reaction time, split the gaze shift over eyes, head and trunk,
   * time each part, and return standing postures aimed at the tracked target.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When an uncued target lies outside the attended
   * field, or the duration is not positive.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLook.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const recruit: IAutoMovieMotionHumanGaze.Recruit =
      context.params.recruit ?? "auto";
    const at: (seconds: number) => IAutoMovieVector3 = (
      seconds: number,
    ): IAutoMovieVector3 =>
      context.aim(context.params.target, context.start + seconds).point;
    const first: IPlanFirst = HumanGaze.direction(
      context.body,
      context.entry.posture,
      at(0),
    );
    admitCue(first.yaw, context.params.cue);
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
    const duration: number = context.params.duration ?? settled + 0.6;
    HumanBound.above("duration", duration, 0, "s");

    // The body under the look: the carrier's when the look is an overlay,
    // otherwise the stand law's.
    const base: IAutoMovieMotionHumanActionPlan =
      context.carrier === undefined
        ? stand.plan({ ...context, params: { hold: duration } })
        : AutoMovieMotionHumanBase.under(context, duration);
    const weight: (seconds: number, span: number) => number = (
      seconds: number,
      span: number,
    ): number => AutoMovieEngineMotionSampling.minimumJerkShare((seconds - delay) / span);
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
      const now: IAutoMovieMotionHumanGaze.IDirectionResult =
        HumanGaze.direction(context.body, posture, at(seconds), read);
      return {
        ...now,
        yaw: now.yaw + 360 * Math.round((first.yaw - now.yaw) / 360),
      };
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
      posture: (
        seconds: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const read: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution(resolution);
        const standing: IAutoMovieMotionHumanPosture = base.posture(
          seconds,
          undefined,
          read,
          projection,
        );
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
        // nearer the body than in the quiet stance (`HumanArmSwing`).
        return context.carrier === undefined && parts.trunk !== 0
          ? HumanArmSwing(
              context.body,
              aimed,
              ["left", "right"],
              read,
              projection,
            )
          : aimed;
      },
    };
  }

  /*
   * The ex-Gaussian parameters of an orienting reaction, seconds: mu 0.26 s to
   * 0.22 s, sigma 35 ms to 25 ms and tau 70 ms to 40 ms on the `reaction` axis
   * (provisional), mu 40 ms lower for an acoustic cue (Welford 1980).
   * Parameter skill: The skill; its `reaction` axis scales the parameters.
   * Parameter cue: Visual or acoustic.
   * Returns: The parameters.
   */
  export function reactionLaw(
    skill: IAutoMovieMotionHumanSkill,
    cue: ReactionLawCue,
  ): IAutoMovieReactionTimeDistribution {
    return {
      mu:
        HumanSkill.quantity(skill, "reaction", 0.26, 0.22) -
        (cue === "signal" ? 0.04 : 0),
      sigma: HumanSkill.quantity(skill, "reaction", 0.035, 0.025),
      tau: HumanSkill.quantity(skill, "reaction", 0.07, 0.04),
    };
  }

  /*
   * A simple reaction time to a cue, seconds: an ex-Gaussian draw (a normal
   * plus an exponential) with skill-scaled parameters.
   * Parameter skill: The skill; its `reaction` axis scales the parameters.
   * Parameter random: The stream; reads indices 0 to 2.
   * Parameter cue: Visual or acoustic.
   * Returns: Seconds; at least 0.1.
   */
  function reaction(
    skill: IAutoMovieMotionHumanSkill,
    random: IAutoMovieRandom,
    cue: ReactionCue,
  ): number {
    return Math.max(
      0.1,
      HumanSkill.reaction(reactionLaw(skill, cue), random, 0),
    );
  }
}

/*
 * The alternatives of `ReactionLawCue`'s site.
 */
type ReactionLawCue = "seen" | "signal";

/*
 * The alternatives of `ReactionCue`'s site.
 */
type ReactionCue = "seen" | "signal";

/*
 * The record of `IPlanFirst`'s site.
 */
type IPlanFirst = { yaw: number; pitch: number };

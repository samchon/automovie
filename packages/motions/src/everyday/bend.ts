import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBendLower,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { HumanRefusal } from "../law/HumanRefusal";
import { bendLower } from "./bendLower";
import { planBendStrategy } from "./planBendStrategy";

/** The offset-corrected wrist point for a strategy. */
type AutoMovieBendWrist = bendLower.WristAt;

/** One physical lowering strategy selected by the automatic planner. */
type AutoMovieBendStrategy = Exclude<
  IAutoMovieMotionHumanBend.Strategy,
  "auto"
>;

/**
 * Bending down to bring a hand to a low point (the floor, a low shelf, a
 * note on the ground) with the feet planted, by a stoop, a squat or a
 * semi-squat, then straightening up.
 *
 * The goal is the palm on the target, facing it from above. The body is
 * found from that goal: the strategy sets how far the hips drop, to the
 * height the body's own leg keeps at the strategy's knee flexion (a stoop's
 * knees as straight as a planted leg holds them, a semi-squat's 90 degrees,
 * a squat's 135, Washmuth, McAfee and Bickel 2022; `bendLower.hipShare`),
 * and the trunk then inclines forward just enough to
 * bring the shoulder within the arm's reach of the target (`bendLower.REACH`,
 * where freely reaching people lean in, of the arm's length plus the palm's
 * offset), found by bisection. A stoop carries its measured hip retreat
 * from Kim and Yoo (2018). An explicitly balanced bend may add a shift.
 * The inclination is shared by the lumbopelvic rhythm of forward bending:
 * about 40 degrees of lumbar flexion against 70 of hip flexion at full
 * bending (Esola et al. 1996, Spine 21:71), so the pelvis pitches 0.64 of
 * it, the lumbar spine flexes 0.28 and the thorax 0.08 (`HumanTrunk.incline`).
 * The legs are solved onto the planted feet, lowering the pelvis where a
 * leg could not reach (`resolveHumanPosture.lower`); a squat, which outruns
 * the ankles' 20 degree dorsiflexion range, lets the heels rise up to 30
 * degrees, the feet rolling on their balls (provisional). The arm goes onto the palm's goal and
 * the gaze onto the target, and the free hand braces on its own thigh just
 * above the knee (Kingma, Faber and van Dieen 2016, J Biomech 49:881, on
 * supporting the trunk with a hand on the thigh while lifting). No lifting technique is shown to be better than
 * another (van Dieen, Hoozemans and Toussaint 1999, Clin Biomech 14:685), so
 * `auto` takes the semi-squat for targets below mid-shank and the stoop above,
 * the rule the campaign sets, and squats where the semi-squat cannot reach
 * (a short-armed body cannot reach the floor from a semi-squat).
 *
 * The descent takes the time of a movement that stops on a target for the
 * hand's travel, the package's timing owner for aimed movements
 * (`AutoMovieMotionHumanTiming.aimed`, McIntosh et al. 2018's two-factor fit,
 * the palm's target a point), scaled from 1.4 to 1.0 by the `speed` axis;
 * the hand holds for `hold` seconds and the rise takes the same time. Events:
 * `contact` and `deepest` at the bottom, `upright` at the end. A target the
 * strategy cannot reach is refused with the lowest height it reaches.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, the method, the timing, the events and the refusals, with sources and provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters and the plan the performance dispatches through, plus the helpers its tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, hand and frame types; no body is special-cased.
 */
export namespace bend {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "bend";

  /** Cancel table. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: [0, 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    bend: [{ window: ["deepest", 1], kind: "inertialize", entry: 0 }],
    // A pick up continues the deepest point of a bend, the body held as it
    // is lowered and the arm taken from the target over to the grip.
    pickUp: [{ window: ["deepest", 1], kind: "inertialize", entry: 0 }],
  };

  /** A requested shift uses the pelvis over the feet throughout the bend. */
  export const balance: IAutoMovieMotionHumanBalance = {
    by: "hips",
    from: { event: "start" },
    to: { event: "end" },
  };

  /** How long the palm holds on the target when the caller names no hold, seconds (provisional: half a second, a brief touch, read from no measured source). */
  export const HOLD: number = 0.5;

  /** The reaching elbow's outward hint, a share of the upper arm (provisional: read from no measured source). */
  export const REACH_OUT: number = 0.2;

  /**
   * Plan a bend: choose the strategy, solve the balance shift and the least
   * trunk inclination that brings the palm to the target, time the descent as
   * an aimed movement, and return postures that lower the body, put the palm on the
   * target and the free palm on its thigh, hold, and rise.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the target lies beyond the strategy's reach, or the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the solve, the timing, the postures and both refusals; the law's doc gives the sources and the provisional constants.
   * @evidence contracts/development/implementation.md#principled-implementation Esola et al.'s lumbopelvic rhythm and the strategy's lowered body carry the arm planner. The palm faces down against a flat target, and the free hand braces on the thigh (Kingma et al. 2016). The two motions share one clock with the measured aimed timing and the named hold.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The chosen lowering writes root, trunk, gaze and legs. Two arm goals and the fingers read the resulting pose, each on its channel. The hold reads the same authored lowest key.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The only strategy fallback is the stated automatic squat where the semi-squat cannot reach. The reached point stays where authored. The hold and the reaching elbow hint are provisional.
   * @evidence contracts/development/implementation.md#efficient-algorithms The lowering and its pitch are planned once. The planner lays trajectories over the actual descent and ascent and refines failed stretches. Hold duration adds no arm waypoints or posture fits.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The strategy, lean, pitch, timing and stand base are computed once per course. Each native squat trial reads its carried wrist from the same displayed bones as its support residuals. Each eligible native arm goal reads the target, shoulder and shins from one pose. Custom readers keep separate observations in their original order.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains this body's lowered geometry and arm courses, released with the performance. No query history grows in playback.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBend.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const target: IAutoMovieVector3 = context.aim(
      context.params.toward,
      context.start,
    ).point;
    const requested: IAutoMovieMotionHumanBend.Strategy =
      context.params.strategy ?? "auto";
    if (context.params.toward.kind !== "self")
      return planBendStrategy(context, requested, target);
    // A surface on the moving body can be occluded by the lowered thigh
    // even when the shoulder lies within reach. Admit the complete arm
    // course before committing to one of the law's lowering strategies.
    const nominal: AutoMovieBendStrategy = choose(
      context.body,
      target,
      requested,
    );
    const candidates: ReadonlySet<AutoMovieBendStrategy> =
      new Set<AutoMovieBendStrategy>(
        requested === "auto"
          ? [nominal, "stoop", "semiSquat", "squat"]
          : [nominal],
      );
    const side: AutoMovieHumanSide = context.params.side ?? "right";
    const elbow: number =
      ((stand.relaxed(context.body)[`${side}LowerArm`]?.[0] ?? 0) * Math.PI) /
      180;
    const upper: number = context.body.measure.upperArm;
    const lower: number = context.body.measure.forearm;
    // Voluntary trunk recruitment begins before anatomical extension runs
    // out. If that preferred course is obstructed, a relaxed elbow still
    // reaches the law-of-cosines span without locking the hinge.
    const available: number = Math.sqrt(
      upper * upper + lower * lower + 2 * upper * lower * Math.cos(elbow),
    );
    const comfortable: number = bendLower.REACH * (upper + lower);
    let failure: HumanRefusal | undefined;
    for (const alignTrunk of [false, true]) {
      for (const candidate of candidates) {
        for (const reach of new Set([
          comfortable,
          Math.max(comfortable, available),
        ])) {
          try {
            return planBendStrategy(
              context,
              candidate,
              target,
              reach,
              alignTrunk,
            );
          } catch (error) {
            if (
              !(error instanceof HumanRefusal) ||
              (error.axis !== "toward" && error.axis !== "region")
            )
              throw error;
            if (
              failure === undefined ||
              (error.axis === "region" && failure.axis === "toward")
            )
              failure = error;
          }
        }
      }
    }
    throw failure!;
  }

  /**
   * The lowering that brings a hand within reach of a target: the strategy
   * `choose` gives, solved by `bendLower.solve`, and for `auto` a squat where
   * the semi-squat cannot reach.
   *
   * @param body The body.
   * @param upright The standing posture lowered.
   * @param target The target.
   * @param side The hand.
   * @param strategy The requested strategy.
   * @param reach How near the shoulder must come to the target, metres; the bend's palm reach when absent.
   * @param instant Action-local time and the event clock when observing an optional balance window on this key.
   * @returns The solved lowering.
   * @throws {HumanRefusal} When the strategy, and for `auto` the squat after it, cannot reach the target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the choice, the solve and the fallback.
   * @evidence contracts/development/implementation.md#principled-implementation The campaign's strategy rule (`choose`) and the documented squat fallback over the shared lowering solve.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One choice and at most two solves.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only `auto` falls back, and only from a semi-squat; any other refusal is passed on.
   * @evidence contracts/development/implementation.md#efficient-algorithms One solve, two when `auto` falls back.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by the bend law and by the pick-up's lowering, so both choose and lower alike.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lowering(
    body: IAutoMovieMotionHumanBody,
    upright: IAutoMovieMotionHumanPosture,
    target: IAutoMovieVector3,
    side: AutoMovieHumanSide,
    strategy: IAutoMovieMotionHumanBend.Strategy,
    reach?: number,
    balance?: IAutoMovieMotionHumanBalance,
    wristAt?: AutoMovieBendWrist,
    lateralTilt: number = 0,
    instant?: bendLower.IInstant,
  ): IAutoMovieMotionHumanBendLower.ISolved {
    const chosen: Exclude<IAutoMovieMotionHumanBend.Strategy, "auto"> = choose(
      body,
      target,
      strategy,
    );
    const solve: (
      candidate: typeof chosen,
    ) => IAutoMovieMotionHumanBendLower.ISolved = (
      candidate: typeof chosen,
    ): IAutoMovieMotionHumanBendLower.ISolved => {
      return bendLower.solve(
        body,
        upright,
        target,
        side,
        candidate,
        reach,
        balance,
        wristAt,
        lateralTilt,
        instant,
      );
    };
    try {
      return solve(chosen);
    } catch (error) {
      if (
        !(error instanceof HumanRefusal) ||
        strategy !== "auto" ||
        chosen !== "semiSquat"
      )
        throw error;
      return solve("squat");
    }
  }

  /**
   * The strategy for a target: `auto` stoops above mid-shank and semi-squats
   * below (the plan squats instead where the semi-squat cannot reach).
   *
   * @param body The body.
   * @param target The target point.
   * @param strategy The requested strategy.
   * @returns A concrete strategy.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule, its mid-shank threshold and that the plan may still replace the semi-squat by a squat.
   * @evidence contracts/development/implementation.md#principled-implementation Compares the target's height with the body's own ankle height plus half its shank, so the threshold scales with the body; no study ranks the techniques (van Dieen et al. 1999), so the threshold is the campaign's rule.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A pure decision kept apart from the reach solve, which owns the fallback.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The mid-shank threshold is the documented campaign rule, not a tuned value.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function with nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function choose(
    body: IAutoMovieMotionHumanBody,
    target: IAutoMovieVector3,
    strategy: IAutoMovieMotionHumanBend.Strategy,
  ): Exclude<IAutoMovieMotionHumanBend.Strategy, "auto"> {
    if (strategy !== "auto") return strategy;
    return target.y < body.measure.ankleHeight + 0.5 * body.measure.shank
      ? "semiSquat"
      : "stoop";
  }
}

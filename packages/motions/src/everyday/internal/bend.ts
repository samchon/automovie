import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieBodyMeasure,
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

import { stand } from "../../actions/internal/stand";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanTouchStance } from "../../compose/internal/AutoMovieMotionHumanTouchStance";
import { bendLower } from "./bendLower";
import { bendLowerSolve } from "./bendLowerSolve";
import { planBendStrategy } from "./planBendStrategy";

/*
 * Bending down to bring a hand to a low point (the floor, a low shelf, a note
 * on the ground) with the feet planted, by a stoop, a squat or a semi-squat,
 * then straightening up.
 *
 * The goal is the palm on the target, facing it from above. The body is found
 * from that goal: the strategy sets how far the hips drop, to the height the
 * body's own leg keeps at the strategy's knee flexion (a stoop's knees as
 * straight as a planted leg holds them, a semi-squat's 90 degrees, a squat's
 * 135, Washmuth, McAfee and Bickel 2022; `bendLower.hipShare`), and the trunk
 * then inclines forward just enough to bring the shoulder within the arm's
 * reach of the target (`bendLower.REACH`, where freely reaching people lean in,
 * of the arm's length plus the palm's offset), found by bisection. A stoop
 * carries its measured hip retreat from Kim and Yoo (2018). An explicitly
 * balanced bend may add a shift. The inclination is shared by the lumbopelvic
 * rhythm of forward bending: about 40 degrees of lumbar flexion against 70 of
 * hip flexion at full bending (Esola et al. 1996, Spine 21:71), so the pelvis
 * pitches 0.64 of it, the lumbar spine flexes 0.28 and the thorax 0.08
 * (`HumanTrunk.incline`). The legs are solved onto the planted feet, lowering
 * the pelvis where a leg could not reach (`resolveHumanPosture.lower`); a
 * squat, which outruns the ankles' 20 degree dorsiflexion range, lets the heels
 * rise up to 30 degrees, the feet rolling on their balls (provisional). The arm
 * goes onto the palm's goal and the gaze onto the target, and the free hand
 * braces on its own thigh just above the knee (Kingma, Faber and van Dieen
 * 2016, J Biomech 49:881, on supporting the trunk with a hand on the thigh
 * while lifting). No lifting technique is shown to be better than another (van
 * Dieen, Hoozemans and Toussaint 1999, Clin Biomech 14:685), so `auto` takes
 * the semi-squat for targets below mid-shank and the stoop above, the rule the
 * campaign sets, and squats where the semi-squat cannot reach (a short-armed
 * body cannot reach the floor from a semi-squat).
 *
 * The descent takes the time of a movement that stops on a target for the
 * hand's travel, the package's timing owner for aimed movements
 * (`AutoMovieMotionHumanTiming.aimed`, McIntosh et al. 2018's two-factor fit,
 * the palm's target a point), scaled from 1.4 to 1.0 by the `speed` axis; the
 * hand holds for `hold` seconds and the rise takes the same time. Events:
 * `contact` and `deepest` at the bottom, `upright` at the end. A target the
 * strategy cannot reach is refused with the lowest height it reaches.
 */
export namespace bend {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "bend";

  /*
   * Cancel table.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: { start: 0, end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    bend: [
      { window: { start: "deepest", end: 1 }, kind: "inertialize", entry: 0 },
    ],
    // A pick up continues the deepest point of a bend, the body held as it
    // is lowered and the arm taken from the target over to the grip.
    pickUp: [
      { window: { start: "deepest", end: 1 }, kind: "inertialize", entry: 0 },
    ],
    // A put down continues it the same way, setting the held prop on a
    // place below the standing reach.
    putDown: [
      { window: { start: "deepest", end: 1 }, kind: "inertialize", entry: 0 },
    ],
  };

  /*
   * A requested shift uses the pelvis over the feet throughout the bend.
   */
  export const balance: IAutoMovieMotionHumanBalance = {
    by: "hips",
    from: { event: "start" },
    to: { event: "end" },
  };

  /*
   * How long the palm holds on the target when the caller names no hold,
   * seconds (provisional: half a second, a brief touch, read from no measured
   * source).
   */
  export const HOLD: number = 0.5;

  /*
   * The reaching elbow's outward hint, a share of the upper arm (provisional:
   * read from no measured source).
   */
  export const REACH_OUT: number = 0.2;

  /*
   * Plan a bend: choose the strategy, solve the balance shift and the least
   * trunk inclination that brings the palm to the target, time the descent as
   * an aimed movement, and return postures that lower the body, put the palm on
   * the target and the free palm on its thigh, hold, and rise.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the target lies beyond the strategy's reach, or
   * the hold is negative.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBend.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const target: IAutoMovieVector3 = context.aim(
      context.params.target,
      context.start,
    ).point;
    const requested: IAutoMovieMotionHumanBend.Strategy =
      context.params.strategy ?? "auto";
    if (context.params.target.kind !== "self")
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
    const side: AutoMovieHumanSide = context.params.hand ?? "right";
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

    // The law's candidates in its order of preference, the trunk unaligned
    // first, each strategy at the comfortable reach and then at the relaxed
    // elbow's span; the first whose whole arm course admits is the stance
    // (`AutoMovieMotionHumanTouchStance.choose`).
    const lowerings: bend.ICandidate[] = [false, true].flatMap(
      (alignTrunk: boolean): bend.ICandidate[] =>
        [...candidates].flatMap(
          (strategy: AutoMovieBendStrategy): bend.ICandidate[] =>
            [...new Set([comfortable, Math.max(comfortable, available)])].map(
              (reach: number): bend.ICandidate => ({
                alignTrunk,
                strategy,
                reach,
              }),
            ),
        ),
    );
    return AutoMovieMotionHumanTouchStance.choose<
      bend.ICandidate,
      IAutoMovieMotionHumanActionPlan
    >({
      candidates: lowerings,
      reach: (candidate: bend.ICandidate): IAutoMovieMotionHumanActionPlan =>
        planBendStrategy(
          context,
          candidate.strategy,
          target,
          candidate.reach,
          candidate.alignTrunk,
        ),
    });
  }

  /*
   * One lowering a self-target bend is chosen among.
   */
  export interface ICandidate {
    /*
     * Whether the trunk aligns with the target.
     */
    alignTrunk: boolean;

    /*
     * The lowering strategy.
     */
    strategy: AutoMovieBendStrategy;

    /*
     * How near the shoulder must come to the target, metres.
     */
    reach: number;
  }

  /*
   * The lowering that brings a hand within reach of a target: the strategy
   * `choose` gives, solved by `bendLowerSolve`, and for `auto` a squat where
   * the semi-squat cannot reach.
   * Parameter body: The body.
   * Parameter upright: The standing posture lowered.
   * Parameter target: The target.
   * Parameter side: The hand.
   * Parameter strategy: The requested strategy.
   * Parameter reach: How near the shoulder must come to the target, metres; the
   * bend's palm reach when absent.
   * Parameter instant: Action-local time and the event clock when observing an
   * optional balance window on this key.
   * Returns: The solved lowering.
   * When the strategy, and for `auto` the squat after
   * it, cannot reach the target.
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
    instant?: bendLowerSolve.IInstant,
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
      return bendLowerSolve(
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
    // An `auto` semi-squat that cannot reach declares the squat after it
    // (`AutoMovieMotionHumanTouchStance.choose`).
    return AutoMovieMotionHumanTouchStance.choose<
      typeof chosen,
      IAutoMovieMotionHumanBendLower.ISolved
    >({
      candidates:
        strategy === "auto" && chosen === "semiSquat"
          ? ["semiSquat", "squat"]
          : [chosen],
      reach: solve,
    });
  }

  /*
   * The strategy for a target: `auto` stoops above mid-shank and semi-squats
   * below (the plan squats instead where the semi-squat cannot reach).
   * Parameter body: The body's ankle height and shank.
   * Parameter target: The target point.
   * Parameter strategy: The requested strategy.
   * Returns: A concrete strategy.
   */
  export function choose(
    body: { measure: Pick<IAutoMovieBodyMeasure, "ankleHeight" | "shank"> },
    target: IAutoMovieVector3,
    strategy: IAutoMovieMotionHumanBend.Strategy,
  ): Exclude<IAutoMovieMotionHumanBend.Strategy, "auto"> {
    if (strategy !== "auto") return strategy;
    return target.y < body.measure.ankleHeight + 0.5 * body.measure.shank
      ? "semiSquat"
      : "stoop";
  }
}

/*
 * The offset-corrected wrist point for a strategy.
 */
type AutoMovieBendWrist = bendLower.WristAt;

/*
 * One physical lowering strategy selected by the automatic planner.
 */
type AutoMovieBendStrategy = Exclude<
  IAutoMovieMotionHumanBend.Strategy,
  "auto"
>;

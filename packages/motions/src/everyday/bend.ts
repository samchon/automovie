import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type { AutoMovieMotionTarget, IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanBalance } from "./HumanBalance";
import { HumanSkill } from "../skill/HumanSkill";
import { HumanGaze } from "./HumanGaze";
import { poseBones } from "./poseBones";

/**
 * Bending down to bring a hand to a low point (the floor, a low shelf, a
 * note on the ground) with the feet planted, by a stoop, a squat or a
 * semi-squat, then straightening up.
 *
 * The goal is the palm on the target, facing it from above. The body is
 * found from that goal: the strategy sets how far the hips drop (a stoop
 * keeps the knees nearly straight, a squat lowers the hips to 0.45 of their
 * height, a semi-squat to 0.75; provisional shares, the postures the lifting
 * literature compares), and the trunk then pitches forward about the hips just
 * enough to bring the shoulder within the arm's reach of the target (`0.92`
 * of the arm's length plus the palm's offset), found by bisection, while the
 * hips move back to keep the body balanced over the feet ({@link HumanBalance}).
 * The legs are solved onto the planted feet, the arm onto the palm's goal and
 * the gaze onto the target. No lifting technique is shown to be better than
 * another (van Dieen, Hoozemans and Toussaint 1999, Clin Biomech 14:685), so
 * `auto` takes the semi-squat for targets below mid-shank and the stoop above,
 * the rule the campaign sets.
 *
 * The descent takes Fitts's time for the hand's travel, `a + b log2(2 D / W)`
 * with `a` 0.3 s, `b` 0.15 s and a 3 cm target width (Fitts 1954, J Exp Psychol
 * 47:381; constants provisional, scaled from 1.4 to 1.0 by the `speed` axis),
 * the hand holds for `hold` seconds and the rise takes the same time. Events:
 * `contact` and `deepest` at the bottom, `upright` at the end. A target the
 * strategy cannot reach is refused with the lowest height it reaches.
 */
export namespace bend {
  /** The action's name. */
  export const name: HumanActionName = "bend";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    bend: [{ window: ["deepest", 1], kind: "inertialize", entry: 0 }],
  };

  /** A lowering strategy. */
  export type Strategy = "stoop" | "semiSquat" | "squat" | "auto";

  /** Parameters. */
  export interface IParams {
    /** The point the hand goes to. */
    toward: AutoMovieMotionTarget;

    /** The hand; `right` when absent. */
    side?: HumanHand.Side;

    /** How the body lowers; `auto` when absent. */
    strategy?: Strategy;

    /** Seconds the hand stays at the target; 0.5 when absent. */
    hold?: number;
  }

  /** Hip height kept by each strategy, a share of the standing hip height (provisional). */
  export const HIPS: Readonly<Record<Exclude<Strategy, "auto">, number>> = { stoop: 0.97, semiSquat: 0.75, squat: 0.45 };

  /** Fitts's constants: intercept and slope, seconds, and the target width, metres (provisional). */
  export const FITTS: Readonly<{ a: number; b: number; width: number }> = { a: 0.3, b: 0.15, width: 0.03 };

  /**
   * Plan a bend.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the target lies beyond the strategy's reach.
   */
  export function plan(context: IHumanActionContext<IParams>): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const side: HumanHand.Side = context.params.side ?? "right";
    const hold: number = context.params.hold ?? 0.5;
    if (!(hold >= 0)) throw new Error("A bend's hold is not negative");
    const target: IAutoMovieVector3 = context.aim(context.params.toward, context.start).point;
    const strategy: Exclude<Strategy, "auto"> = bend.choose(body, target, context.params.strategy ?? "auto");
    const probe: IHumanActionPlan = stand.plan({ ...context, params: { seconds: 1 } });
    const upright: IHumanPosture = probe.posture(0);
    const pitch: number = bend.pitch(body, upright, target, side, strategy);

    // Fitts's time for the hand's travel, scaled by skill.
    const hand: IAutoMovieVector3 = HumanHand.frame(body, bones(body, upright), side, "palm").point;
    const D: number = Vector3.length(Vector3.subtract(target, hand));
    const speed: number = HumanSkill.quantity(context.skill, "speed", 1.4, 1.0);
    const down: number = speed * (FITTS.a + FITTS.b * Math.log2(Math.max(1, (2 * D) / FITTS.width)));
    const duration: number = 2 * down + hold;
    const base: IHumanActionPlan = stand.plan({ ...context, params: { seconds: duration } });

    return {
      duration,
      events: [
        { name: "contact", share: down / duration },
        { name: "deepest", share: down / duration },
        { name: "upright", share: 1 },
      ],
      contacts: base.contacts,
      contact: down,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const s: number = t <= down + hold ? minimumJerk(t / down).s : 1 - minimumJerk((t - down - hold) / down).s;
        const standing: IHumanPosture = base.posture(t);
        const lowered: IHumanPosture = bend.lower(body, standing, strategy, pitch * s, s);
        const aimed: IHumanPosture = HumanGaze.aim(body, lowered, target, "head", { eyes: s, head: s, trunk: 0 });

        // The palm from where it hangs to the target, facing down onto it.
        const from: IAutoMovieVector3 = HumanHand.frame(body, bones(body, lowered), side, "palm").point;
        const turn = HumanHand.rotation(side, { fingers: HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw: lowered.yaw }, { x: 0, y: -0.3, z: 1 }), palm: { x: 0, y: -1, z: 0 } });
        const wrist: HumanHand.IWrist = HumanHand.place(body, side, "palm", Vector3.lerp(from, target, s), turn, "flat");
        return {
          ...aimed,
          joints: { ...aimed.joints, ...HumanHand.shape(side, "flat") },
          limbs: { ...aimed.limbs, [side === "left" ? "leftArm" : "rightArm"]: { point: wrist.point, rotation: wrist.rotation, bend: HumanHand.elbow(body, lowered, side, 0.2) } },
        };
      },
    };
  }

  /**
   * The strategy for a target: `auto` stoops above mid-shank and semi-squats below.
   *
   * @param body The body.
   * @param target The target point.
   * @param strategy The requested strategy.
   * @returns A concrete strategy.
   */
  export function choose(body: IHumanBody, target: IAutoMovieVector3, strategy: Strategy): Exclude<Strategy, "auto"> {
    if (strategy !== "auto") return strategy;
    return target.y < body.measure.ankleHeight + 0.5 * body.measure.shank ? "semiSquat" : "stoop";
  }

  /**
   * A standing posture lowered by a strategy: the hips dropped by a share of
   * the strategy's drop and moved back for balance, the trunk pitched, the
   * planted legs re-solved by their unchanged goals.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param strategy The strategy.
   * @param pitch Trunk pitch, degrees.
   * @param share How far down, 0 to 1.
   * @returns The lowered posture.
   */
  export function lower(body: IHumanBody, posture: IHumanPosture, strategy: Exclude<Strategy, "auto">, pitch: number, share: number): IHumanPosture {
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const drop: number = (1 - HIPS[strategy]) * body.measure.hipHeight * share;
    const frame: HumanFrame.IFrame = { origin: posture.root, yaw: posture.yaw };
    const goal: IAutoMovieVector3 = HumanFrame.point(frame, { x: hips.x, y: hips.y - drop, z: hips.z - HumanBalance.hipShift(body.measure, pitch) });
    const tipped: IHumanPosture = { ...posture, pitch: posture.pitch + pitch };
    return { ...tipped, root: Vector3.subtract(goal, Quaternion.rotateVector(resolveHumanPosture.heading(tipped), hips)) };
  }

  /**
   * The least trunk pitch that brings the shoulder within reach of the
   * target under a strategy, by bisection over 0 to 110 degrees.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param target The target.
   * @param side The hand.
   * @param strategy The strategy.
   * @returns Degrees.
   * @throws {Error} When even 110 degrees leaves the target out of reach.
   */
  export function pitch(body: IHumanBody, posture: IHumanPosture, target: IAutoMovieVector3, side: HumanHand.Side, strategy: Exclude<Strategy, "auto">): number {
    const reach: number = 0.92 * (body.measure.upperArm + body.measure.forearm) + Vector3.length(HumanHand.offset(body, side, "palm").point);
    const gap = (deg: number): number => {
      const lowered: IHumanPosture = lower(body, posture, strategy, deg, 1);
      const shoulder: IAutoMovieVector3 = Vector3.add(lowered.root, Quaternion.rotateVector(resolveHumanPosture.heading(lowered), body.rest.get(`${side}UpperArm`)!));
      return Vector3.length(Vector3.subtract(target, shoulder)) - reach;
    };
    if (gap(0) <= 0) return 0;
    if (gap(110) > 0) throw new Error(`A ${strategy} cannot bring the hand to a point ${target.y.toFixed(3)} m high there; bring the target nearer or choose a deeper strategy`);
    let lo: number = 0;
    let hi: number = 110;
    for (let i: number = 0; i < 30; i++) {
      const mid: number = (lo + hi) / 2;
      if (gap(mid) > 0) lo = mid;
      else hi = mid;
    }
    return hi;
  }
}

/** World bones of a posture, limbs solved. */
function bones(body: IHumanBody, posture: IHumanPosture): ReturnType<typeof poseBones> {
  return poseBones(body, resolveHumanPosture(body, posture));
}

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
import { HumanTrunk } from "./HumanTrunk";
import { handGoals } from "./handGoals";
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
 * literature compares), and the trunk then inclines forward just enough to
 * bring the shoulder within the arm's reach of the target (`0.92` of the
 * arm's length plus the palm's offset), found by bisection, while the hips
 * move back to keep the body balanced over the feet ({@link HumanBalance}).
 * The inclination is shared by the lumbopelvic rhythm of forward bending:
 * about 40 degrees of lumbar flexion against 70 of hip flexion at full
 * bending (Esola et al. 1996, Spine 21:71), so the pelvis pitches 0.64 of
 * it, the lumbar spine flexes 0.28 and the thorax 0.08.
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, the method, the timing, the events and the refusals, with sources and provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters and the plan the performance dispatches through, plus the helpers its tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, hand and frame types; no body is special-cased.
 * @evidence contracts/development/implementation.md#principled-implementation Effector goals (sockets, footprints, the gaze line) solved by the shared inverse kinematics, with balance and timing from the cited laws.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plans once, then evaluates each posture in closed form.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Infeasible requests are refused with the feasible range instead of clamped; provisional constants are named and marked.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture beyond a few forward-kinematics passes and limb fits.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan is computed once per instance and every posture reads it.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan's closures hold only the instance's own inputs and are released with the performance.
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
    // Balance: the hips' shift found on the solved posture at a nominal pitch, then again at the pitch the reach needs.
    let lean: number = HumanBalance.shift(body, (back: number): IHumanPosture => bend.lower(body, upright, strategy, 60, 1, back)) / Math.sin(Math.PI / 3);
    let pitch: number = bend.pitch(body, upright, target, side, strategy, lean);
    if (pitch > 5) {
      lean = HumanBalance.shift(body, (back: number): IHumanPosture => bend.lower(body, upright, strategy, pitch, 1, back)) / Math.sin((pitch * Math.PI) / 180);
      pitch = bend.pitch(body, upright, target, side, strategy, lean);
    }

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
        const lowered: IHumanPosture = bend.lower(body, standing, strategy, pitch * s, s, lean * Math.sin((pitch * s * Math.PI) / 180));
        const aimed: IHumanPosture = HumanGaze.aim(body, lowered, target, "head", { eyes: s, head: s, trunk: 0 });

        // The palm from where it hangs to the target, facing down onto it.
        const from: IAutoMovieVector3 = HumanHand.frame(body, bones(body, lowered), side, "palm").point;
        const turn = HumanHand.rotation(side, { fingers: HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw: lowered.yaw }, { x: 0, y: -0.3, z: 1 }), palm: { x: 0, y: -1, z: 0 } });
        return handGoals(body, { ...aimed, joints: { ...aimed.joints, ...HumanHand.shape(side, "flat") } }, [
          { side, surface: "palm", shape: "flat", point: Vector3.lerp(from, target, s), rotation: turn, bend: HumanHand.elbow(body, lowered, side, 0.2) },
        ]);
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
   * @param pitch Trunk inclination, degrees, shared by the lumbopelvic rhythm.
   * @param share How far down, 0 to 1.
   * @param back How far the hips move back for balance, metres.
   * @returns The lowered posture.
   */
  export function lower(body: IHumanBody, posture: IHumanPosture, strategy: Exclude<Strategy, "auto">, pitch: number, share: number, back: number): IHumanPosture {
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const drop: number = (1 - HIPS[strategy]) * body.measure.hipHeight * share;
    const frame: HumanFrame.IFrame = { origin: posture.root, yaw: posture.yaw };
    const goal: IAutoMovieVector3 = HumanFrame.point(frame, { x: hips.x, y: hips.y - drop, z: hips.z - back });
    const tipped: IHumanPosture = { ...posture, pitch: posture.pitch + RHYTHM.pelvis * pitch };
    const joints: IHumanPosture["joints"] = { ...posture.joints };
    for (const [bone, part] of [["spine", RHYTHM.lumbar], ["chest", RHYTHM.thorax]] as const) {
      const was: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
      joints[bone] = [was[0] + part * pitch, was[1], was[2]];
    }
    return { ...tipped, joints, root: Vector3.subtract(goal, Quaternion.rotateVector(resolveHumanPosture.heading(tipped), hips)) };
  }

  /** Shares of a forward trunk inclination taken by the pelvis, the lumbar spine and the thorax (Esola et al. 1996). */
  export const RHYTHM: Readonly<{ pelvis: number; lumbar: number; thorax: number }> = { pelvis: 0.64, lumbar: 0.28, thorax: 0.08 };

  /**
   * The least trunk pitch that brings the shoulder within reach of the
   * target under a strategy, by bisection over 0 to 150 degrees of inclination.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param target The target.
   * @param side The hand.
   * @param strategy The strategy.
   * @param lean The balance shift per unit sine of the inclination, metres.
   * @returns Degrees.
   * @throws {Error} When even 150 degrees leaves the target out of reach.
   */
  export function pitch(body: IHumanBody, posture: IHumanPosture, target: IAutoMovieVector3, side: HumanHand.Side, strategy: Exclude<Strategy, "auto">, lean: number): number {
    const reach: number = 0.92 * (body.measure.upperArm + body.measure.forearm) + Vector3.length(HumanHand.offset(body, side, "palm").point);
    const gap = (deg: number): number => {
      const lowered: IHumanPosture = lower(body, posture, strategy, deg, 1, lean * Math.sin((deg * Math.PI) / 180));
      const shoulder: IAutoMovieVector3 = HumanTrunk.resolve(body, lowered).get(`${side}UpperArm`)!.worldPosition;
      return Vector3.length(Vector3.subtract(target, shoulder)) - reach;
    };
    if (gap(0) <= 0) return 0;
    if (gap(150) > 0) throw new Error(`A ${strategy} cannot bring the hand to a point ${target.y.toFixed(3)} m high there; bring the target nearer or choose a deeper strategy`);
    let lo: number = 0;
    let hi: number = 150;
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

import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import { HumanBalance } from "./HumanBalance";
import { HumanGaze } from "./HumanGaze";
import { HumanTrunk } from "./HumanTrunk";
import { handGoals } from "./handGoals";

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
 */
export namespace bend {
  /** The action's name. */
  export const name: HumanActionName = "bend";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    bend: [{ window: ["deepest", 1], kind: "inertialize", entry: 0 }],
  };

  /**
   * A lowering strategy: `stoop` keeps the knees nearly straight, `squat`
   * lowers the hips to 0.45 of their height, `semiSquat` to 0.75, and `auto`
   * lets the plan choose by the target's height (`choose`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each strategy does to the hips and what `auto` defers to.
   * @evidence contracts/development/design.md#principled-representation A closed union of the three postures the lifting literature compares plus the deferred choice; each concrete strategy keys the `HIPS` and `HEEL` tables, so no other value can be written.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the bend law; read by its parameters, its helpers and the capture cases that sweep the strategies.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Variation enters as table rows keyed by the union, not as members per strategy; `auto` is excluded from the tables by `Exclude`, so it cannot reach the posture code unresolved.
   */
  export type Strategy = "stoop" | "semiSquat" | "squat" | "auto";

  /**
   * Parameters of a bend: the point the hand goes to, which hand, the
   * strategy and how long the hand stays there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each field states its meaning, unit and the default an absent value takes.
   * @evidence contracts/development/design.md#principled-representation The target is the shared motion target union, read once at the start; the hand is the shared hand side; the hold is seconds, and a negative hold is refused at plan time, the one invalid value the type does not rule out.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by this law and read only by its plan; the target and hand types are imported from their owners.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No field names a scene or body, and every combination of fields is meaningful.
   */
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
  export const HIPS: Readonly<Record<Exclude<Strategy, "auto">, number>> = {
    stoop: 0.97,
    semiSquat: 0.75,
    squat: 0.45,
  };

  /** Fitts's constants: intercept and slope, seconds, and the target width, metres (provisional). */
  export const FITTS: Readonly<{ a: number; b: number; width: number }> = {
    a: 0.3,
    b: 0.15,
    width: 0.03,
  };

  /**
   * Plan a bend: choose the strategy, solve the balance shift and the least
   * trunk inclination that brings the palm to the target, time the descent by
   * Fitts's law, and return postures that lower the body, put the palm on the
   * target and the free palm on its thigh, hold, and rise.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the target lies beyond the strategy's reach, or the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the solve, the timing, the postures and both refusals; the law's doc gives the sources and the provisional constants.
   * @evidence contracts/development/implementation.md#principled-implementation The palm goal is solved by the arm's inverse kinematics on a body lowered by the strategy and inclined by the lumbopelvic rhythm (Esola et al. 1996); the hips' back shift keeps the engine's centre of mass over the feet (HumanBalance.shift), found once at 60 degrees and again at the needed pitch; descent time is Fitts's law; the free hand braces on the thigh (Kingma et al. 2016). Limitation: the doc promises the refusal names the lowest height the strategy reaches, but the message names only the target's height.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The choice is `choose`, the lowered body `lower`, the inclination `pitch`; the plan composes them and the posture closure only interpolates and adds the hand goals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The only fallback, `auto` squatting where the semi-squat refuses, is the documented strategy rule; HIPS, HEEL, FITTS, the 0.2 and 0.3 elbow hints and the 0.6 brace point are named provisional values.
   * @evidence contracts/development/implementation.md#efficient-algorithms Planning runs two balance solves and two 30-step bisections, each step one lowered posture with a trunk forward-kinematics pass (one more set when `auto` falls back); each posture then costs one lowering, a gaze aim, one bone resolve and a two-hand solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The strategy, lean, pitch, timing and stand base are computed once per instance and every posture reads them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The posture closure holds this instance's body, target, solved quantities and stand base, released with the performance; nothing grows per call.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const side: HumanHand.Side = context.params.side ?? "right";
    const hold: number = context.params.hold ?? 0.5;
    HumanBound.least("hold", hold, 0, "s");
    const target: IAutoMovieVector3 = context.aim(
      context.params.toward,
      context.start,
    ).point;
    const requested: Strategy = context.params.strategy ?? "auto";
    const probe: IHumanActionPlan = stand.plan({
      ...context,
      params: { seconds: 1 },
    });
    const upright: IHumanPosture = probe.posture(0);
    // Balance: the hips' shift found on the solved posture at a nominal pitch, then again at the pitch the reach needs.
    const solve = (
      strategy: Exclude<Strategy, "auto">,
    ): { strategy: Exclude<Strategy, "auto">; lean: number; pitch: number } => {
      let lean: number =
        HumanBalance.shift(
          body,
          (back: number): IHumanPosture =>
            bend.lower(body, upright, strategy, 60, 1, back),
        ) / Math.sin(Math.PI / 3);
      let pitch: number = bend.pitch(
        body,
        upright,
        target,
        side,
        strategy,
        lean,
      );
      if (pitch > 5) {
        lean =
          HumanBalance.shift(
            body,
            (back: number): IHumanPosture =>
              bend.lower(body, upright, strategy, pitch, 1, back),
          ) / Math.sin((pitch * Math.PI) / 180);
        pitch = bend.pitch(body, upright, target, side, strategy, lean);
      }
      return { strategy, lean, pitch };
    };
    const chosen: Exclude<Strategy, "auto"> = bend.choose(
      body,
      target,
      requested,
    );
    const solved = ((): {
      strategy: Exclude<Strategy, "auto">;
      lean: number;
      pitch: number;
    } => {
      try {
        return solve(chosen);
      } catch (error) {
        if (requested !== "auto" || chosen !== "semiSquat") throw error;
        return solve("squat");
      }
    })();
    const { strategy, lean, pitch } = solved;

    // Fitts's time for the hand's travel, scaled by skill.
    const hand: IAutoMovieVector3 = HumanHand.frame(
      body,
      bones(body, upright),
      side,
      "palm",
    ).point;
    const D: number = Vector3.length(Vector3.subtract(target, hand));
    const speed: number = HumanSkill.quantity(context.skill, "speed", 1.4, 1.0);
    const down: number =
      speed *
      (FITTS.a + FITTS.b * Math.log2(Math.max(1, (2 * D) / FITTS.width)));
    const duration: number = 2 * down + hold;
    const base: IHumanActionPlan = stand.plan({
      ...context,
      params: { seconds: duration },
    });

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
        const s: number =
          t <= down + hold
            ? minimumJerk(t / down).s
            : 1 - minimumJerk((t - down - hold) / down).s;
        const standing: IHumanPosture = base.posture(t);
        const lowered: IHumanPosture = bend.lower(
          body,
          standing,
          strategy,
          pitch * s,
          s,
          lean * Math.sin((pitch * s * Math.PI) / 180),
        );
        const aimed: IHumanPosture = HumanGaze.aim(
          body,
          lowered,
          target,
          "head",
          { eyes: s, head: s, trunk: 0 },
        );

        // The palm from where it hangs to the target, facing down onto it.
        const hanging = bones(body, lowered);
        const from: IAutoMovieVector3 = HumanHand.frame(
          body,
          hanging,
          side,
          "palm",
        ).point;
        const turn = HumanHand.rotation(side, {
          fingers: HumanFrame.point(
            { origin: { x: 0, y: 0, z: 0 }, yaw: lowered.yaw },
            { x: 0, y: -0.3, z: 1 },
          ),
          palm: { x: 0, y: -1, z: 0 },
        });

        // The free palm braces on its own thigh just above the knee, as people
        // support the trunk in one-handed lifting (Kingma, Faber and van Dieen
        // 2016, J Biomech 49:881), moving there from where it hangs.
        const free: HumanHand.Side = side === "left" ? "right" : "left";
        const thigh = hanging.get(`${free}UpperLeg`)!;
        const kneeAt: IAutoMovieVector3 = hanging.get(
          `${free}LowerLeg`,
        )!.worldPosition;
        const region =
          body.surfaces.regions[
            free === "left" ? "thighFrontLeft" : "thighFrontRight"
          ];
        const onThigh: IAutoMovieVector3 = Vector3.add(
          thigh.worldPosition,
          Quaternion.rotateVector(thigh.worldRotation, region.point),
        );
        const brace: IAutoMovieVector3 = Vector3.lerp(
          onThigh,
          Vector3.add(
            kneeAt,
            Vector3.subtract(
              onThigh,
              Vector3.lerp(thigh.worldPosition, kneeAt, 0.5),
            ),
          ),
          0.6,
        );
        const normal: IAutoMovieVector3 = Quaternion.rotateVector(
          thigh.worldRotation,
          region.normal,
        );
        const rest: IAutoMovieVector3 = HumanHand.frame(
          body,
          hanging,
          free,
          "palm",
        ).point;
        const freeTurn = HumanHand.rotation(free, {
          fingers: Vector3.subtract(kneeAt, thigh.worldPosition),
          palm: Vector3.scale(normal, -1),
        });
        return handGoals(
          body,
          {
            ...aimed,
            joints: { ...aimed.joints, ...HumanHand.shape(side, "flat") },
          },
          [
            {
              side,
              surface: "palm",
              shape: "flat",
              point: Vector3.lerp(from, target, s),
              rotation: turn,
              bend: AutoMovieMotionHumanBend.hang(body, lowered, side, 0.2),
            },
            {
              side: free,
              surface: "palm",
              shape: "relaxed",
              point: Vector3.lerp(rest, brace, s),
              rotation: Quaternion.slerp(
                hanging.get(`${free}Hand`)!.worldRotation,
                freeTurn,
                s,
              ),
              bend: AutoMovieMotionHumanBend.hang(body, lowered, free, 0.3),
            },
          ],
        );
      },
    };
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
    body: IHumanBody,
    target: IAutoMovieVector3,
    strategy: Strategy,
  ): Exclude<Strategy, "auto"> {
    if (strategy !== "auto") return strategy;
    return target.y < body.measure.ankleHeight + 0.5 * body.measure.shank
      ? "semiSquat"
      : "stoop";
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is lowered, moved and pitched, each parameter's unit and range, and the squat's heel lift in the implementation comments.
   * @evidence contracts/development/implementation.md#principled-implementation Moves the hips' goal down by the strategy's share of the hip height and back by `back` in the posture's frame, inclines the trunk by the lumbopelvic rhythm with the pelvis limited by hip flexion (HumanTrunk.pelvisLimit), lifts a squat's heels about the ball (HumanFoot.pivot) with the toes bent to stay flat, and re-solves the planted legs, lowering the pelvis where a leg cannot reach.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One posture transform shared by the plan, the balance solve and the reach bisection; the inclination split, foot pivot and leg solve are imported from their owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts HIPS and HEEL are named provisional shares; no body or case is special-cased. The pelvis limit is read over the lifted ankles, so the hip stays within its flexion range and the foot holds its contact through the squat.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: one trunk incline, at most two foot pivots and one leg-lowering solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function; callers that need the same lowered posture call it once per sample.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new posture and retains nothing.
   */
  export function lower(
    body: IHumanBody,
    posture: IHumanPosture,
    strategy: Exclude<Strategy, "auto">,
    pitch: number,
    share: number,
    back: number,
  ): IHumanPosture {
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const drop: number = (1 - HIPS[strategy]) * body.measure.hipHeight * share;
    const frame: HumanFrame.IFrame = { origin: posture.root, yaw: posture.yaw };
    const goal: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: hips.x,
      y: hips.y - drop,
      z: hips.z - back,
    });
    const level: IAutoMovieVector3 = Vector3.subtract(
      goal,
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
        hips,
      ),
    );
    // A squat deeper than the ankles' 20 degree dorsiflexion range lets the
    // heels rise, each foot turning about its toes' joint, the contact its
    // goal names (provisional heel lift).
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    const heel: number = HEEL[strategy] * share;
    if (heel > 0)
      for (const leg of ["leftLeg", "rightLeg"] as const) {
        const goal0: IHumanPosture.IGoal | undefined = posture.limbs[leg];
        if (goal0 === undefined || goal0.rotation === undefined) continue;
        const side: "left" | "right" = leg === "leftLeg" ? "left" : "right";
        const flat: HumanFoot.IPlacement = {
          ankle: goal0.point,
          rotation: goal0.rotation,
        };
        const lifted: HumanFoot.IPlacement = HumanFoot.pivot(
          body,
          side,
          "mtp",
          HumanFoot.point(body, side, "mtp", flat),
          HumanFoot.heading(goal0.rotation),
          -heel,
        );
        limbs[leg] = {
          ...goal0,
          point: lifted.ankle,
          rotation: lifted.rotation,
          contact: HumanFoot.offset(body, side, "mtp"),
        };
      }

    // The pelvis tilts by what the hips leave it over the ankles as the legs
    // will hold them: a lifted heel raises its ankle and folds the thigh
    // further, so the limit is read after the lift.
    const tilt = HumanTrunk.incline(
      posture.joints,
      pitch,
      HumanTrunk.pelvisLimit(body, level, posture.yaw, {
        left: limbs.leftLeg!.point,
        right: limbs.rightLeg!.point,
      }),
    );
    const tipped: IHumanPosture = {
      ...posture,
      pitch: posture.pitch + tilt.pitch,
    };
    const joints: IHumanPosture["joints"] = tilt.joints;

    // With the heels up the toes bend at their joints and stay flat on the floor.
    const toes: IHumanPosture["joints"] =
      heel > 0 ? { leftToes: [heel, 0, 0], rightToes: [heel, 0, 0] } : {};
    return resolveHumanPosture.lower(body, {
      ...tipped,
      joints: { ...joints, ...toes },
      limbs,
      root: Vector3.subtract(
        goal,
        Quaternion.rotateVector(resolveHumanPosture.heading(tipped), hips),
      ),
    });
  }

  /** Heel lift by strategy at full depth, degrees (provisional: only the squat outruns the ankle's dorsiflexion). */
  export const HEEL: Readonly<Record<Exclude<Strategy, "auto">, number>> = {
    stoop: 0,
    semiSquat: 0,
    squat: 30,
  };

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
   * @throws {HumanRefusal} When even 150 degrees leaves the target out of reach.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the quantity solved, the search range, the reach model and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Bisects the inclination on the gap between the shoulder-to-target distance and the arm's reach (0.92 of upper arm plus forearm, near full extension, plus the palm offset), reading the shoulder from the lowered trunk's forward kinematics. Premise: the gap falls as the trunk inclines; this holds while the shoulder descends toward the target and is not checked beyond, and the 150 degree end is only a refusal test.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One solve that reuses `lower` for the body and HumanTrunk for the shoulder.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 0.92 reach share (provisional) and the 150 degree bound are named in the doc; an unreachable target is refused, not clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms 32 gap evaluations at most (two ends and 30 bisection steps), each one lowered posture and one trunk forward-kinematics pass; the 30 steps bound the error below 1.5e-7 degrees.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each evaluation depends on its own inclination, so nothing repeats within a call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pitch(
    body: IHumanBody,
    posture: IHumanPosture,
    target: IAutoMovieVector3,
    side: HumanHand.Side,
    strategy: Exclude<Strategy, "auto">,
    lean: number,
  ): number {
    const reach: number =
      0.92 * (body.measure.upperArm + body.measure.forearm) +
      Vector3.length(HumanHand.offset(body, side, "palm").point);
    const gap = (deg: number): number => {
      const lowered: IHumanPosture = lower(
        body,
        posture,
        strategy,
        deg,
        1,
        lean * Math.sin((deg * Math.PI) / 180),
      );
      const shoulder: IAutoMovieVector3 = HumanTrunk.resolve(body, lowered).get(
        `${side}UpperArm`,
      )!.worldPosition;
      return Vector3.length(Vector3.subtract(target, shoulder)) - reach;
    };
    if (gap(0) <= 0) return 0;
    if (gap(150) > 0)
      throw new HumanRefusal({
        kind: "reach",
        axis: "toward",
        value: strategy,
        reason: `A ${strategy} cannot bring the hand to a point ${target.y.toFixed(3)} m high there; bring the target nearer or choose a deeper strategy`,
        fix: "bring the target nearer the feet, or choose a deeper strategy",
      });
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
function bones(
  body: IHumanBody,
  posture: IHumanPosture,
): ReturnType<typeof poseBones> {
  return poseBones(body, resolveHumanPosture(body, posture));
}

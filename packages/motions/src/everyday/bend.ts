import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBendLower,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmChain } from "../compose/AutoMovieMotionHumanArmChain";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHand } from "../compose/AutoMovieMotionHumanHand";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import type { HumanBalance } from "./HumanBalance";
import { HumanGaze } from "./HumanGaze";
import { bendLower } from "./bendLower";
import { braceOnThighPoint } from "./braceOnThighPoint";
import { handGoals } from "./handGoals";

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
 * offset), found by bisection, while the hips
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
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate }],
    bend: [{ window: ["deepest", 1], kind: "inertialize", entry: 0 }],
    // A pick up continues the deepest point of a bend, the body held as it
    // is lowered and the arm taken from the target over to the grip.
    pickUp: [{ window: ["deepest", 1], kind: "inertialize", entry: 0 }],
  };

  /** How long the palm holds on the target when the caller names no hold, seconds (provisional: half a second, a brief touch, read from no measured source). */
  export const HOLD: number = 0.5;

  /** How far the reaching fingers tip down from the heading toward the low target, the slope of their direction (provisional: about 17 degrees down, read from no measured source). */
  export const FINGER_DIP: number = 0.3;

  /** The reaching elbow's outward hint, a share of the upper arm (provisional: read from no measured source). */
  export const REACH_OUT: number = 0.2;

  /** The bracing elbow's outward hint, a share of the upper arm, wider than the reaching one so the forearm clears the thigh it braces on (provisional: read from no measured source). */
  export const BRACE_OUT: number = 0.3;

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
   * @evidence contracts/development/implementation.md#principled-implementation The palm goal is solved by the arm's inverse kinematics on a body lowered by the strategy and inclined by the lumbopelvic rhythm (Esola et al. 1996); the hips' back shift keeps the engine's centre of mass over the feet (HumanBalance.shift), found once at `bendLower.NOMINAL` and again at the needed pitch; descent time is `AutoMovieMotionHumanTiming.aimed` (McIntosh et al. 2018); the free hand braces on the thigh (Kingma et al. 2016, `braceOnThighPoint`); a target out of reach is refused with the lowest height the strategy reaches there (`bendLower.pitch`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The choice is `choose`, the lowered body `lower`, the inclination `pitch`; the plan composes them and the posture closure only interpolates and adds the hand goals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The only fallback, `auto` squatting where the semi-squat refuses a reach, is the documented strategy rule; any other error passes on. The descent's time is the timing owner's; bendLower's knee angles are Washmuth et al.'s; HOLD, FINGER_DIP, REACH_OUT, BRACE_OUT and the `speed` axis's 1.4 to 1.0 span are named provisional values with no source found.
   * @evidence contracts/development/implementation.md#efficient-algorithms Planning runs two balance solves and two pitch solves (`bendLower.solve`), each a scan and a 30-step bisection of lowered postures with a trunk forward-kinematics pass (one more set when `auto` falls back); each posture then costs one lowering, a gaze aim, one resolve demanding the free thigh and knee, and a two-hand solve continued from the course's frame instant before it (`AutoMovieMotionHumanArmChain`), whose instants are fitted once, and a joint-space carry of both arms from the entry's angles.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The strategy, lean, pitch, timing and stand base are computed once per instance and every posture reads them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The posture closure holds this instance's body, target, solved quantities and stand base, released with the performance; nothing grows per call.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBend.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const side: AutoMovieHumanSide = context.params.side ?? "right";
    const hold: number = context.params.hold ?? HOLD;
    HumanBound.least("hold", hold, 0, "s");
    const target: IAutoMovieVector3 = context.aim(
      context.params.toward,
      context.start,
    ).point;
    const requested: IAutoMovieMotionHumanBend.Strategy = context.params.strategy ?? "auto";
    const probe: IAutoMovieMotionHumanActionPlan = stand.plan(
      { ...context, params: { seconds: 1 } },
      side,
    );
    const upright: IAutoMovieMotionHumanPosture = probe.posture(0);
    const { strategy, lean, pitch }: IAutoMovieMotionHumanBendLower.ISolved = bend.lowering(
      body,
      upright,
      target,
      side,
      requested,
    );

    // The time of a movement that stops on a target, for the hand's travel
    // (`AutoMovieMotionHumanTiming.aimed`), scaled by skill.
    const hand: IAutoMovieVector3 = HumanHand.frame(
      body,
      bones(body, upright),
      side,
      "palm",
    ).point;
    const D: number = Vector3.length(Vector3.subtract(target, hand));
    const speed: number = HumanSkill.quantity(context.skill, "speed", 1.4, 1.0);
    const down: number = speed * AutoMovieMotionHumanTiming.aimed(D, 0);
    const duration: number = 2 * down + hold;
    // The body stands under the bend, its sway signed in the bending side's
    // frame, so a left bend mirrors a right one (`stand.plan`).
    const base: IAutoMovieMotionHumanActionPlan = stand.plan(
      { ...context, params: { seconds: duration } },
      side,
    );

    // How far down the bend is at a second: down over the descent, held,
    // and up again over as long.
    const share: (seconds: number) => number = (seconds: number): number => {
      const t: number = Math.min(duration, Math.max(0, seconds));
      return t <= down + hold
        ? minimumJerk(t / down).s
        : 1 - minimumJerk((t - down - hold) / down).s;
    };
    const free: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const legBones: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
      `${free}UpperLeg`, `${free}LowerLeg`,
    ]);
    const readLeg: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, legBones);

    // The arms' goals at each second are fitted along the bend's course, each
    // second continuing the swivel the course chose before it, so neither
    // elbow changes its side between two frames.
    const posture: (seconds: number) => IAutoMovieMotionHumanPosture =
      AutoMovieMotionHumanArmChain.continued(
        body,
        duration,
        (seconds: number): IAutoMovieMotionHumanPosture => {
          const t: number = Math.min(duration, Math.max(0, seconds));
          const s: number = share(t);
          const standing: IAutoMovieMotionHumanPosture = base.posture(t);
          const lowered: IAutoMovieMotionHumanPosture = bendLower.lower(
            body,
            standing,
            strategy,
            pitch * s,
            s,
            lean * Math.sin((pitch * s * Math.PI) / 180),
          );
          const aimed: IAutoMovieMotionHumanPosture = HumanGaze.aim(
            body,
            lowered,
            target,
            "head",
            { eyes: s, head: s, trunk: 0 },
          );

          // Upright at both ends, the arms are the ones the body holds: no goal
          // is fitted where the hands have not left where they hang.
          if (s <= 0) return aimed;

          // The palm onto the target, facing down onto it, the fingers ahead
          // and tipped down toward it.
          const turn: IAutoMovieQuaternion = HumanHand.rotation(side, {
            fingers: HumanFrame.point(
              { origin: { x: 0, y: 0, z: 0 }, yaw: lowered.yaw },
              { x: 0, y: -FINGER_DIP, z: 1 },
            ),
            palm: { x: 0, y: -1, z: 0 },
          });

          // The free palm braces on its own thigh just above the knee, as people
          // support the trunk in one-handed lifting (Kingma, Faber and van Dieen
          // 2016, J Biomech 49:881), read on the lowered leg alone.
          const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
          const brace: ReturnType<typeof braceOnThighPoint> = braceOnThighPoint(
            body,
            free,
            readLeg(
              resolveHumanPosture.seeded(body, lowered, undefined, {}, read, legBones).pose,
              read(),
            ),
          );
          const freeTurn: IAutoMovieQuaternion = HumanHand.rotation(free, {
            fingers: brace.forward,
            palm: Vector3.scale(brace.normal, -1),
          });
          return handGoals(
            body,
            {
              ...aimed,
              // Both hands open as they go down, the reaching palm onto the
              // target and the free one onto its thigh: an open hand from the
              // relaxed one by the descent's share, so neither the fingers
              // jump at the start nor the free hand's curled thumb goes into
              // the thigh it braces on.
              joints: {
                ...aimed.joints,
                ...AutoMovieMotionHumanHand.fingers(side, "flat", 0, s),
                ...AutoMovieMotionHumanHand.fingers(free, "flat", 0, s),
              },
            },
            [
              {
                side,
                surface: "palm",
                shape: "flat",
                point: target,
                rotation: turn,
                bend: AutoMovieMotionHumanBend.hang(body, lowered, side, REACH_OUT),
              },
              {
                side: free,
                surface: "palm",
                shape: "flat",
                point: brace.point,
                rotation: freeTurn,
                bend: AutoMovieMotionHumanBend.hang(body, lowered, free, BRACE_OUT),
              },
            ],
          );
        },
      );

    // Each arm is carried in joint angles from the angles the entry held to
    // its goal's solution by the descent's share (a free arm movement is
    // smooth in joint space, Soechting and Lacquaniti 1981), so no second
    // asks the fit for a hand part way along a nearly straight arm, where
    // the elbow's side is ill-conditioned, and the hand reaches its place
    // at the deepest instant and holds it.
    const entered: Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles> = {
      left: AutoMovieMotionHumanArm.angles(context.entry.pose, "left"),
      right: AutoMovieMotionHumanArm.angles(context.entry.pose, "right"),
    };
    // The carry's clearing course is planned against the deepest instant's
    // arms, a constant of the bend, so its least clear turn does not step as
    // the arms of each second move.
    let deepest: IAutoMovieMotionHumanPosture | undefined;

    return {
      duration,
      events: [
        { name: "contact", share: down / duration },
        { name: "deepest", share: down / duration },
        { name: "upright", share: 1 },
      ],
      contacts: base.contacts,
      contact: down,
      posture: (seconds: number): IAutoMovieMotionHumanPosture =>
        AutoMovieMotionHumanArm.carry(
          body,
          posture(seconds),
          entered,
          share(seconds),
          (deepest ??= posture(down)),
        ),
    };
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
  ): IAutoMovieMotionHumanBendLower.ISolved {
    const chosen: Exclude<IAutoMovieMotionHumanBend.Strategy, "auto"> = choose(body, target, strategy);
    try {
      return bendLower.solve(body, upright, target, side, chosen, reach);
    } catch (error) {
      if (
        !(error instanceof HumanRefusal) ||
        strategy !== "auto" ||
        chosen !== "semiSquat"
      )
        throw error;
      return bendLower.solve(body, upright, target, side, "squat", reach);
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

/** World bones of a posture, limbs solved. */
function bones(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
): ReturnType<typeof poseBones> {
  return poseBones(body, resolveHumanPosture(body, posture));
}

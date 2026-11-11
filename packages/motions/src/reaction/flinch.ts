import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanGoal } from "../compose/AutoMovieMotionHumanGoal";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanRoot } from "../compose/AutoMovieMotionHumanRoot";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingBody } from "../striking/StrikingBody";
import { StrikingQuality } from "../striking/StrikingQuality";
import { StrikingStance } from "../striking/StrikingStance";
import { StrikingTarget } from "../striking/StrikingTarget";

/**
 * A flinch: the protective startle away from a sudden threat or a blow, the
 * head and trunk pulled away from it, the shoulders raised and the hands
 * brought up before the face, then a return to what the body held.
 *
 * The startle pattern (Landis and Hunt 1939, The Startle Pattern; Brown et
 * al. 1991, Brain 114:1891) starts with the eye blink at 30 to 50 ms, the head
 * at about 60 ms and the arms near 100 ms, peaks within about 0.2 s and fades
 * over a few tenths of a second, so the flinch reaches its peak at 0.2 s and
 * returns by 0.6 s. Its size grows with `intensity`: the head moves up to
 * one head radius away from the threat through the trunk's lean (up to 12
 * degrees) and a 3 cm root shift, and the gloves rise to cover the face
 * (provisional sizes, no located kinematic amplitude). The feet stay planted.
 * The threat is a target (the incoming weapon's region, a prop, a point), read
 * at the start.
 *
 * The action is rows over the posture it was entered in: one clock with the
 * `peak` instant, and a root, a trunk, a head and two arm primitives that all
 * rise to the peak and fall to the end on the clock's envelope.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the startle pattern, its timing with sources, the provisional sizes, that the feet stay planted and how the action is composed.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table, parameters and a plan composed of part primitives on one clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the timing and size constants and the plan the law table and the performance dispatch through.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, target, clock and primitive types; no body is special-cased.
 */
export namespace flinch {
  /** The action's name. */
  export const name: HumanActionName = "flinch";

  /** Cancel table: a flinch flows into a guard, a defence or a stagger. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    guard: [{ window: [0.3, 1], kind: "inertialize", entry: 0, blend: 0.15 }],
    defend: [{ window: [0.3, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
    stagger: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.08 }],
    knockdown: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.08 }],
  };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the threat's target and the intensity's range and default.
   * @evidence contracts/development/design.md#principled-representation The threat is the interface's motion-target union and the intensity a share in (0, 1], checked when planning.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's target union.
   */
  export interface IParams {
    /** Where the threat comes from; a place ahead of the performer when absent. */
    from?: AutoMovieMotionTarget;

    /** How strong, in (0, 1]; 1 when absent. */
    intensity?: number;

    /** How it is performed; its intensity is `intensity` unless it states one. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** Startle peak, seconds (Brown et al. 1991). */
  export const PEAK: number = 0.2;

  /** The whole flinch, seconds. */
  export const DURATION: number = 0.6;

  /** The trunk's lean away from the threat at full intensity, degrees (provisional). */
  export const LEAN: number = 12;

  /** The root's shift away from the threat at full intensity, metres (provisional). */
  export const SHIFT: number = 0.03;

  /** The neck's added flexion at full intensity, degrees (provisional). */
  export const DUCK: number = 10;

  /**
   * Plan a flinch.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the intensity lies outside (0, 1], or the manner is out of range.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its input, its plan and its refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Every part rises to the measured startle peak and falls to the end on the clock's envelope; the gloves' goals come from the face region and the fist sockets and are solved by the shared limb fit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clock, one held base and five rows; the threat is read once.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An intensity outside its range throws; the sizes are named provisional constants.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture beyond one trunk resolution per arm.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The threat's direction is computed once per plan and dropped on settle, when the threat may have moved.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one cached direction, cleared by settle and released with the plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, {
        ...(p.intensity === undefined ? {} : { intensity: p.intensity }),
        ...p.manner,
      });
    const intensity: number = modifiers.extent;
    const body = context.body;
    const m = body.measure;
    const entry: IHumanPosture = context.entry.posture;
    const lead: "left" | "right" = StrikingTarget.lead(context.entry);

    // The startle's rise is a reflex and keeps its time; the return follows
    // the manner's tempo.
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.of(DURATION, [
        { name: "peak", seconds: PEAK },
        { name: "stroke", seconds: PEAK },
        { name: "relax", seconds: PEAK },
      ]),
      modifiers,
      { holds: [], fixed: [AutoMovieMotionClock.START] },
    );
    const duration: number = clock.duration;
    const rise: readonly [string, string] = [AutoMovieMotionClock.START, "peak"];
    const fall: readonly [string, string] = ["relax", AutoMovieMotionClock.END];
    const share = (seconds: number): number =>
      intensity * clock.envelope(rise, fall, seconds);

    // Away from the threat in the performer's floor frame: `x` left, `z` forward.
    let cached: IAutoMovieVector3 | undefined;
    const away = (): IAutoMovieVector3 => {
      if (cached !== undefined) return cached;
      cached = HumanFrame.local(
        { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
        AutoMovieMotionHumanTarget.away(
          AutoMovieMotionHumanTarget.resolve(
            context,
            p.from,
            context.start - StrikingTarget.LOOK,
            entry,
            AutoMovieMotionHumanTarget.DEFAULTS.ahead,
          ),
          StrikingBody.trunk(body, entry).get("head")!.worldPosition,
          entry.yaw,
        ),
      );
      return cached;
    };

    // A glove before the face on the trunk the action has placed so far.
    const cover =
      (side: "left" | "right"): AutoMovieMotionHumanGoal.Frame =>
      (posture: IHumanPosture): IHumanPosture.IGoal => {
        const bones = StrikingBody.trunk(body, posture);
        const face = StrikingBody.region(body, bones, "face");
        const fist: number = StrikingQuality.fist(m.hand);
        const out: IAutoMovieVector3 = HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
          { x: side === "left" ? fist : -fist, y: 0, z: 0 },
        );
        const rotation = StrikingBody.fist(
          body,
          side,
          { x: 0, y: 1, z: 0 },
          Vector3.scale(face.normal, -1),
        );
        return {
          point: Vector3.subtract(
            Vector3.add(
              Vector3.add(
                face.point,
                Vector3.scale(face.normal, m.forearmRadius + fist),
              ),
              out,
            ),
            StrikingBody.socket(
              body,
              side === "left" ? "fistLeft" : "fistRight",
              rotation,
            ),
          ),
          bend: Vector3.add(bones.get(`${side}UpperArm`)!.worldPosition, {
            x: 0,
            y: -m.upperArm,
            z: 0,
          }),
          rotation,
        };
      };
    const arm = (side: "left" | "right"): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanGoal.drive({
        limb: `${side}Arm`,
        from: 0,
        to: duration,
        goal: cover(side),
        origin: (posture: IHumanPosture, seconds: number): IHumanPosture.IGoal =>
          posture.limbs[`${side}Arm`] ??
          StrikingStance.guard(body, posture, { lead })[`${side}Arm`] ??
          cover(side)(posture, seconds),
        weight: share,
      });

    return composeAutoMovieMotionHumanAction({
      base: {
        ...AutoMovieMotionHumanBase.still(
          duration,
          {
            ...entry,
            joints: { ...entry.joints, ...StrikingStance.joints() },
          },
          AutoMovieMotionHumanBase.plants(),
        ),
        settle: (): void => {
          cached = undefined;
        },
      },
      clock,
      primitives: [
        AutoMovieMotionHumanRoot.travel({
          from: 0,
          to: duration,
          offset: (seconds: number): AutoMovieMotionHumanRoot.IOffset => ({
            point: Vector3.scale(away(), SHIFT * share(seconds)),
            yaw: 0,
          }),
        }),
        // Leaning away: a forward tip when the threat is behind, a back tip
        // when it is ahead; a tip to the side away from it.
        AutoMovieMotionHumanLean.tilt({
          from: 0,
          to: duration,
          angles: (seconds: number): AutoMovieMotionHumanLean.IAngles => ({
            pitch: LEAN * share(seconds) * away().z,
            roll: -LEAN * share(seconds) * away().x,
          }),
        }),
        AutoMovieMotionHumanJoints.pulse(clock, rise, fall, {
          neck: [DUCK * intensity, 0, 0],
        }),
        arm("left"),
        arm("right"),
      ],
    });
  }
}

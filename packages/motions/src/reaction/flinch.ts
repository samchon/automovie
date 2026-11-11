import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
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
 * returns by 0.6 s. Its size grows with `intensity`: the body above the hips leans lightly away
 * from the threat (a quarter of the reach's lean limit) and the hips shift
 * away by 1.8 % of the stature, so the head moves by the trunk's height above
 * the hips times the lean's sine plus the shift; the neck ducks lightly, the
 * hands close into fists and rise to cover the face (provisional sizes, no
 * located kinematic amplitude). The lean pivots at the hips and the feet stay
 * planted. Every part leaves what the entry held and returns to it, so a
 * flinch out of quiet standing ends in quiet standing.
 * The threat is a target (the incoming weapon's region, a prop, a point), read
 * at the start.
 *
 * The action is rows over the posture it was entered in: one phrase with no
 * preparation, whose attack is the rise and whose retraction the return, and
 * a sway of the root and the trunk, a head, two hand and two arm primitives
 * that all rise to the `stroke` instant and fall to the end on the clock's envelope. A guard or a
 * defence may cancel it from the peak on, a stagger or a knockdown at any
 * time.
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
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      guard: ["fromStroke", "smooth"],
      defend: ["fromStroke", "quick"],
      stagger: ["anytime", "reflex"],
      knockdown: ["anytime", "reflex"],
    });

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

  /** The rise to the startle's peak, a measured reflex time. */
  export const RISE: AutoMovieMotionHumanTiming.Span = {
    seconds: 0.2,
    source: "Brown et al. 1991, Brain 114:1891",
  };

  /** The return from the peak (provisional). */
  export const RETURN: AutoMovieMotionHumanTiming.Span = "beat";

  /** The trunk's lean away from the threat at full intensity (provisional). */
  export const LEAN: AutoMovieMotionHumanRange.Amount = "light";

  /** The root's shift away from the threat at full intensity, as a share of the stature (provisional). */
  export const SHIFT: number = 0.018;

  /** The neck's added flexion at full intensity (provisional). */
  export const DUCK: AutoMovieMotionHumanRange.Amount = "light";

  /**
   * Plan a flinch.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the intensity lies outside (0, 1], or the manner is out of range.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its input, its plan and its refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Every part rises to the measured startle peak and falls to the end on the clock's envelope; the gloves' goals come from the face region and the fist sockets, and each arm is carried in joint space between the angles the entry held and the angles its goal solves to.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clock, one held base and four rows; the threat is read once.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An intensity outside its range throws; the sizes are named provisional constants.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture beyond one trunk resolution and one posture solve per arm.
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

    // The startle's rise is a reflex and keeps its time; the return follows
    // the manner's tempo.
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase(
        AutoMovieMotionHumanTiming.phrase({
          prepare: "none",
          attack: RISE,
          retract: RETURN,
        }),
      ),
      modifiers,
      { holds: [], fixed: ["strokeStart"] },
    );
    const duration: number = clock.duration;
    const rise: readonly [string, string] = [
      AutoMovieMotionClock.START,
      "stroke",
    ];
    const fall: readonly [string, string] = ["relax", AutoMovieMotionClock.END];
    const share = (seconds: number): number =>
      intensity * clock.envelope(rise, fall, seconds);
    const lean: number = AutoMovieMotionHumanRange.lean(LEAN);
    const shift: number = AutoMovieMotionHumanRange.shift(body, SHIFT);
    const duck: number = AutoMovieMotionHumanRange.degrees(
      "neck",
      "flexion",
      DUCK,
    );

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
      (side: "left" | "right") =>
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
        const point: IAutoMovieVector3 = Vector3.subtract(
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
        );
        return {
          point,
          // The elbow of least strain; where the solver refuses the goal, an
          // elbow straight below the shoulder, the cover's place before it.
          bend: AutoMovieMotionHumanBend.solve({
            body,
            posture,
            side,
            point,
            rotation,
            fallback: { out: 0, up: -1, forward: 0 },
          }),
          rotation,
        };
      };
    // Each arm leaves the angles the entry held and comes back to them.
    const arm = (side: "left" | "right"): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanArm.carried({
        body,
        side,
        from: 0,
        to: duration,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        goal: cover(side),
        weight: share,
      });

    // The neck's duck and the fingers' closing into fists, each over what the
    // entry held: a body entered with closed fists adds nothing to them.
    const startle: AutoMovieMotionHumanJoints.Angles = {
      neck: [duck * intensity, 0, 0],
    };
    for (const side of ["left", "right"] as const)
      for (const [bone, fist] of Object.entries(StrikingBody.curl(side)) as [
        AutoMovieHumanoidBone,
        readonly [number, number, number],
      ][]) {
        const held: readonly [number, number, number] = entry.joints[bone] ?? [
          0, 0, 0,
        ];
        startle[bone] = [
          (fist[0] - held[0]) * intensity,
          (fist[1] - held[1]) * intensity,
          (fist[2] - held[2]) * intensity,
        ];
      }

    return composeAutoMovieMotionHumanAction({
      base: {
        ...AutoMovieMotionHumanBase.still(
          duration,
          entry,
          AutoMovieMotionHumanBase.plants(),
        ),
        settle: (): void => {
          cached = undefined;
        },
      },
      clock,
      primitives: [
        // Leaning away from the hips up, the hips carried away with it: a
        // forward tip when the threat is behind, a back tip when it is
        // ahead, a tip to the side away from it. The feet keep their plants.
        AutoMovieMotionHumanLean.sway({
          body,
          from: 0,
          to: duration,
          angles: (seconds: number): AutoMovieMotionHumanLean.IAngles => ({
            pitch: lean * share(seconds) * away().z,
            roll: -lean * share(seconds) * away().x,
          }),
          shift: (seconds: number): IAutoMovieVector3 =>
            Vector3.scale(away(), shift * share(seconds)),
        }),
        AutoMovieMotionHumanJoints.pulse(clock, rise, fall, startle),
        arm("left"),
        arm("right"),
      ],
    });
  }
}

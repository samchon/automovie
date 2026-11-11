import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A handstand kicked up from standing, held and stepped down (#3251).
 *
 * The hands are placed on the floor a shoulder width apart, 0.35 statures
 * ahead of the feet (provisional). Over the first half of the entry the
 * body folds forward and the hands come down; over the second the hips
 * swing up over the hands and the legs follow straight until the body
 * stands inverted: the trunk pitched 180 degrees, the hips above the hands
 * by the arm's and the trunk's lengths, the wrists under the shoulders. The
 * entry and the exit take 1.5 s each (provisional) and the hold is the
 * author's. Balance in the hold is by the wrists first (Kerwin and
 * Trewartha 2001); no sway is drafted yet.
 *
 * Events: `handsDown` at the entry's middle, `inverted` (`ready`), `release`
 * (`relax`), with the phrase instants.
 *
 * Not drafted: rolls, cartwheels, round-offs, handsprings, salti, the vault,
 * bars and rings; they need ballistic flight (A4), angular momentum checks
 * and floor and bar supports.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the placement, the entry's two halves, the inverted pose, the timing, the source of the balance and what is not drafted.
 * @evidence contracts/development/design.md#principled-representation A law record of a root row, leg rows and placed arms over one phrase.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every length is the body's.
 */
export namespace gymnastics {
  /** The action's name. */
  export const name: HumanActionName = "gymnastics";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
    });

  /** How far ahead of the feet the hands go down, statures (provisional). */
  export const AHEAD: number = 0.35;

  /** The entry's and the exit's seconds (provisional). */
  export const ENTER: number = 1.5;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The hold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IParams {
    /** Seconds held inverted; 2 when absent. */
    seconds?: number;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /**
   * Plan a handstand.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The hips travel from standing to above the hands while the trunk pitches to 180 degrees; the hands are placed on the floor by the first half; the feet stay planted for the first half and then ride the straight legs of the pitched body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Clock, root row, arm rows, leg rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Lengths are the body's; provisional values named.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per arm per second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the placed arm, the leg placement and the posture heading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the clock and a few points.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const m = body.measure;
    const hold: number = p.seconds ?? 2;
    if (!(hold >= 0)) throw new Error("A handstand's hold is not negative");
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const timed: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: ENTER,
        attack: 0,
        hold,
        retract: ENTER,
      }),
      modifiers,
    );
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      timed.duration,
      [
        ...timed.instants,
        { name: "handsDown", seconds: timed.at("ready") / 2 },
        { name: "inverted", seconds: timed.at("ready") },
        { name: "release", seconds: timed.at("relax") },
      ],
    );
    const entry: IHumanPosture = context.entry.posture;
    const frame: HumanFrame.IFrame = {
      origin: { x: entry.root.x, y: 0, z: entry.root.z },
      yaw: entry.yaw,
    };
    const hands: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: 0,
      y: 0,
      z: AHEAD * m.stature,
    });
    const hipsRest: IAutoMovieVector3 = body.rest.get("hips")!;
    const standing: IAutoMovieVector3 = Vector3.add(
      entry.root,
      Quaternion.rotateVector(resolveHumanPosture.heading(entry), hipsRest),
    );
    const top: IAutoMovieVector3 = {
      ...hands,
      y: m.upperArm + m.forearm + m.hand / 2 + (m.shoulderHeight - m.hipHeight),
    };
    // The share of the way into the inverted pose: the fold over the first half, the swing over the second.
    const fold = (s: number): number =>
      clock.envelope(["start", "handsDown"], ["relax", "end"], s);
    const swing = (s: number): number =>
      clock.envelope(["handsDown", "inverted"], ["relax", "end"], s);
    const folded: IAutoMovieVector3 = Vector3.lerp(
      standing,
      { ...hands, y: m.hipHeight * 0.85 },
      0.4,
    );
    const primitives: IAutoMovieMotionHumanPrimitive[] = [
      {
        channels: ["root", "trunk"],
        from: 0,
        to: clock.duration,
        write: (posture: IHumanPosture, s: number): IHumanPosture => {
          const pitched: IHumanPosture = {
            ...posture,
            pitch: posture.pitch + 90 * fold(s) + 90 * swing(s),
          };
          const hips: IAutoMovieVector3 = Vector3.lerp(
            Vector3.lerp(standing, folded, fold(s)),
            top,
            swing(s),
          );
          return {
            ...pitched,
            root: Vector3.subtract(
              hips,
              Quaternion.rotateVector(
                resolveHumanPosture.heading(pitched),
                hipsRest,
              ),
            ),
          };
        },
      },
    ];
    for (const side of ["left", "right"] as const) {
      primitives.push(
        ...AutoMovieMotionHumanPlaced.arm({
          body,
          side,
          from: 0,
          to: clock.duration,
          rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
          weight: fold,
          place: (posture: IHumanPosture) => ({
            point: HumanFrame.point(
              { origin: hands, yaw: posture.yaw },
              {
                x: (side === "left" ? 1 : -1) * m.shoulderHalfWidth,
                y: 0,
                z: 0,
              },
            ),
            facing: { x: 0, y: -1, z: 0 },
            forward: HumanFrame.point(
              { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
              { x: 0, y: 0, z: 1 },
            ),
          }),
          bend: "raised",
        }),
      );
      const stance: HumanFoot.IPlacement = {
        ankle: context.entry.feet[side].ankle,
        rotation: context.entry.feet[side].rotation,
      };
      const ankleRest: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
      primitives.push(
        AutoMovieMotionHumanLeg.place({
          body,
          side,
          from: 0,
          to: clock.duration,
          placement: (
            posture: IHumanPosture,
            s: number,
          ): HumanFoot.IPlacement => {
            // The straight leg's ankle and foot as the pitched body carries them.
            const turn = resolveHumanPosture.heading(posture);
            const carried: HumanFoot.IPlacement = {
              ankle: Vector3.add(
                posture.root,
                Quaternion.rotateVector(turn, ankleRest),
              ),
              rotation: turn,
            };
            return AutoMovieMotionHumanLeg.between(stance, carried, swing(s));
          },
          planted: (s: number): boolean => swing(s) <= 0,
        }),
      );
    }
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(clock.duration, entry, [
        {
          part: "leftHand",
          kind: "plant",
          from: clock.at("handsDown") / clock.duration,
          to: clock.at("release") / clock.duration,
          support: { kind: "ground" },
        },
        {
          part: "rightHand",
          kind: "plant",
          from: clock.at("handsDown") / clock.duration,
          to: clock.at("release") / clock.duration,
          support: { kind: "ground" },
        },
      ]),
      clock,
      primitives,
      contact: "inverted",
    });
  }
}

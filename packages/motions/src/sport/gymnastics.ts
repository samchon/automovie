import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { tags } from "typia";

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
import { HumanBound } from "../law/HumanBound";
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
 * The hands are placed on the floor a shoulder width apart, as far ahead of
 * the feet as the standing legs let the hips go with the trunk pitched 120
 * degrees over the hands (provisional). Over the first half of the entry
 * the body folds forward and the hands come down under the shoulders, which
 * stand the arms' reach above the wrists; over the second the trunk swings
 * about the shoulders, which stay where they are, and the legs follow
 * straight until the body stands inverted with the hips over the shoulders
 * and the shoulders over the base of the hands. The
 * entry and the exit take 1.5 s each (provisional) and the hold is the
 * author's. Balance in the hold is by the wrists first (Kerwin and
 * Trewartha 2001); no sway is drafted yet.
 *
 * Events: `handsDown` at the entry's middle, `inverted` (`ready`), `release`
 * (`relax`), with the phrase instants.
 *
 * Other laws plan the floor rolls, the cartwheel (`cartwheel`), the salto
 * (`salto`), the round-off (`roundOff`), the handspring (`handspring`) and
 * the vault (`vault`). Not drafted: bars and rings, which need swings about
 * a bar support.
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

  /** The trunk's pitch when the hands touch down, degrees (provisional): the hips above the shoulders, the legs still standing. */
  export const DOWN: number = 120;

  /** The share of the straight leg's length from the ankle to the hip when the hands touch down (provisional). */
  export const LEG: number = 0.95;

  /** The share of the straight arm's length the shoulders stand above the wrists (provisional): the elbows a little soft. */
  export const REACH: number = 0.98;

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
    seconds?: number & tags.Minimum<0>;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /**
   * Plan a handstand.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The hips carry the root while the feet stand and the shoulders pivot it while the hands bear, so neither support slides; the shoulders' height is the arms' reach above the laid hands' wrists; the feet stay planted for the first half and then ride the straight legs of the pitched body.
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
    HumanBound.least("seconds", hold, 0, "s");
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
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 0, y: 0, z: 1 },
    );
    // The wrist of a palm laid flat on the floor, from the palm's point.
    const laid: IAutoMovieVector3 = AutoMovieMotionHumanPlaced.wrist(
      body,
      "left",
      { point: { x: 0, y: 0, z: 0 }, facing: { x: 0, y: -1, z: 0 }, forward },
    );
    const height: number = laid.y + REACH * (m.upperArm + m.forearm);
    const girdle: IAutoMovieVector3 = AutoMovieMotionHumanPlaced.girdle(body);
    const hipsRest: IAutoMovieVector3 = body.rest.get("hips")!;
    const standing: IAutoMovieVector3 = Vector3.add(
      entry.root,
      Quaternion.rotateVector(resolveHumanPosture.heading(entry), hipsRest),
    );
    // The hips from the shoulders at the hands' touchdown, in the entry's frame.
    const carried: IAutoMovieVector3 = Quaternion.rotateVector(
      resolveHumanPosture.heading({ yaw: 0, pitch: DOWN, roll: 0 }),
      Vector3.subtract(hipsRest, girdle),
    );
    // The hips go as far ahead of the ankles as the planted legs reach at that height.
    const ankles: number =
      (HumanFrame.local(frame, context.entry.feet.left.ankle).z +
        HumanFrame.local(frame, context.entry.feet.right.ankle).z) /
      2;
    const drop: number = height + carried.y - m.ankleHeight;
    const leg: number = LEG * (m.thigh + m.shank);
    const ahead: number =
      ankles + Math.sqrt(Math.max(0, leg * leg - drop * drop)) - carried.z;
    const shoulders: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: 0,
      y: height,
      z: ahead,
    });
    // The shoulders stand over the middle of the hand's base, between the wrist and the palm.
    const hands: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: 0,
      y: 0,
      z: ahead - Vector3.dot(laid, forward) / 2,
    });
    const down: IAutoMovieVector3 = Vector3.add(
      shoulders,
      Quaternion.rotateVector(
        resolveHumanPosture.heading({ yaw: entry.yaw, pitch: DOWN, roll: 0 }),
        Vector3.subtract(hipsRest, girdle),
      ),
    );
    // The pitch that stands the hips straight above the shoulders.
    const inverted: number = AutoMovieMotionHumanPlaced.pitch(body, -Infinity);
    // The share of the way into the inverted pose: the fold over the first half, the swing over the second.
    const fold = (s: number): number =>
      clock.envelope(["start", "handsDown"], ["relax", "end"], s);
    const swing = (s: number): number =>
      clock.envelope(["handsDown", "inverted"], ["relax", "end"], s);
    const primitives: IAutoMovieMotionHumanPrimitive[] = [
      {
        channels: ["root", "trunk"],
        from: 0,
        to: clock.duration,
        write: (posture: IHumanPosture, s: number): IHumanPosture => {
          const pitched: IHumanPosture = {
            ...posture,
            pitch:
              posture.pitch + DOWN * fold(s) + (inverted - DOWN) * swing(s),
          };
          // Carried by the hips while the feet stand, pivoted on the shoulders while the hands bear.
          const byHips: IAutoMovieVector3 = Vector3.subtract(
            Vector3.lerp(standing, down, fold(s)),
            Quaternion.rotateVector(
              resolveHumanPosture.heading(pitched),
              hipsRest,
            ),
          );
          const byShoulders: IAutoMovieVector3 =
            AutoMovieMotionHumanPlaced.root(pitched, girdle, shoulders);
          const bearing: number =
            s > clock.at("relax") ? swing(s) : swing(s) > 0 ? 1 : 0;
          return {
            ...pitched,
            root: Vector3.lerp(byHips, byShoulders, bearing),
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
            forward,
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

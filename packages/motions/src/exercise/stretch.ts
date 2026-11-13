import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { tags } from "typia";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanLegPhrase } from "../compose/AutoMovieMotionHumanLegPhrase";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { stretchQuadriceps } from "./stretchQuadriceps";

/**
 * A standing static stretch or yoga pose held and released (#3246, M24):
 * the neck side bend, the cross-body shoulder stretch, the overhead side
 * bend, the standing quadriceps stretch holding the ankle, and the tree
 * pose (ACSM's Guidelines, 11th ed.; the hold of 30 s, Bandy et al. 1997).
 *
 * Each pose is a phrase: `enter` to `reachEnd` over 1.5 s (provisional, a
 * stretch is entered slowly), the hold, and the release over 1.5 s. The
 * intensity names the share of the joint's own range a stretch uses
 * (`mild` half, `moderate` deep, `AutoMovieMotionHumanRange`), never more
 * than the range table allows.
 *
 * - Neck side bend: the neck and head bend to one side by the share of the
 *   neck's lateral range.
 * - Cross-body: the stretched arm crosses the chest to beyond the other
 *   shoulder (provisional place), and the other palm presses the stretched
 *   arm near its elbow.
 * - Overhead side bend: both arms overhead, palms facing, the spine and
 *   the chest bent to one side by the share of their lateral ranges, the
 *   pelvis level over the planted feet and the arms riding the chest.
 * - Quadriceps: the hips move over the standing foot, the other knee bends
 *   to at least 130 degrees (provisional) and as far as the same-side hand
 *   needs to hold the ankle (`stretchQuadriceps`).
 * - Tree: the hips over the standing foot, the other foot's sole on the
 *   inside of the standing calf, the knee turned out, the palms together
 *   before the chest.
 *
 * Events: `enter`, `reachEnd`, `release`, with the phrase instants.
 *
 * Not drafted: seated and floor stretches, PNF, dynamic stretches and the
 * flows (sun salutation); they need floor supports for the hands and seat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the poses, the timing and its sources, the intensity rule, each pose's geometry and what is not drafted.
 * @evidence contracts/development/design.md#principled-representation A law record whose poses are rows of head, arm, leg and root primitives over one phrase.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the kinds, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Angles are range levels and places named grid places or body measures.
 */
export namespace stretch {
  /** The action's name. */
  export const name: HumanActionName = "stretch";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      stretch: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
    });

  /** The poses. */
  export type Kind =
    | "neckSide"
    | "crossBody"
    | "overheadSide"
    | "quadriceps"
    | "tree";

  /** How far into the range: `mild` half and `moderate` deep. */
  export const INTENSITY: Readonly<
    Record<"mild" | "moderate", AutoMovieMotionHumanRange.Level>
  > = { mild: "half", moderate: "deep" };

  /** The entry's and the release's seconds (provisional). */
  export const ENTER: number = 1.5;

  /** The hold by default, seconds (Bandy et al. 1997). */
  export const HOLD: number = 30;

  /** The bent knee's least flexion in the quadriceps stretch, degrees (provisional). */
  export const KNEE: number = 130;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The pose, the side, the hold and the intensity.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The intensity is a closed union.
   */
  export interface IParams {
    /** The pose. */
    kind: Kind;

    /** The side stretched or lifted; `right` when absent. */
    side?: "left" | "right";

    /** Seconds held; `HOLD` when absent. */
    seconds?: number & tags.Minimum<0>;

    /** How far into the range; `moderate` when absent. */
    intensity?: "mild" | "moderate";

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /**
   * Plan a stretch.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation One phrase; each pose's parts rise to their places on its envelope.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Clock, then one branch per pose.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Range levels, named places and body measures only; provisional values are named.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per arm per second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the placed arm, the head share, the joint pulse, the leg placement and the foot rocker.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the clock and the stance.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const m = body.measure;
    const hold: number = p.seconds ?? HOLD;
    HumanBound.least("seconds", hold, 0, "s");
    const level: AutoMovieMotionHumanRange.Level =
      INTENSITY[p.intensity ?? "moderate"];
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
        { name: "enter", seconds: 0 },
        { name: "reachEnd", seconds: timed.at("ready") },
        { name: "release", seconds: timed.at("relax") },
      ],
    );
    const weight = (seconds: number): number =>
      clock.envelope(["start", "ready"], ["relax", "end"], seconds);
    const entry: IHumanPosture = context.entry.posture;
    const side: "left" | "right" = p.side ?? "right";
    const other: "left" | "right" = side === "right" ? "left" : "right";
    const sign: number = side === "left" ? 1 : -1;
    const frame: HumanFrame.IFrame = {
      origin: { x: 0, y: 0, z: 0 },
      yaw: entry.yaw,
    };
    const forward: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: 0,
      y: 0,
      z: 1,
    });
    const leftward: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: 1,
      y: 0,
      z: 0,
    });
    const stance: Record<"left" | "right", HumanFoot.IPlacement> = {
      left: {
        ankle: context.entry.feet.left.ankle,
        rotation: context.entry.feet.left.rotation,
      },
      right: {
        ankle: context.entry.feet.right.ankle,
        rotation: context.entry.feet.right.rotation,
      },
    };
    const rest = (s: "left" | "right"): AutoMovieMotionHumanArm.IAngles =>
      AutoMovieMotionHumanArm.angles(context.entry.pose, s);
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    let contacts: IHumanContactWindow[] = AutoMovieMotionHumanBase.plants();
    const facing = (
      posture: IHumanPosture,
      local: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
        local,
      );

    // The hips carried over the standing foot, for the one-leg poses.
    const over = (standing: "left" | "right"): IAutoMovieVector3 =>
      Vector3.scale(
        leftward,
        Vector3.dot(
          Vector3.subtract(stance[standing].ankle, entry.root),
          leftward,
        ),
      );
    const balance = (
      standing: "left" | "right",
    ): IAutoMovieMotionHumanPrimitive => ({
      channels: ["root"],
      from: 0,
      to: clock.duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => ({
        ...posture,
        root: Vector3.add(
          posture.root,
          Vector3.scale(
            over(standing),
            clock.envelope(["start", "reachEnd"], ["release", "end"], seconds),
          ),
        ),
      }),
    });
    const lifted = (
      placement: HumanFoot.IPlacement,
    ): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanLeg.place({
        body,
        side,
        from: 0,
        to: clock.duration,
        placement: (_: IHumanPosture, seconds: number): HumanFoot.IPlacement =>
          AutoMovieMotionHumanLegPhrase.between(
            stance[side],
            placement,
            weight(seconds),
          ),
        planted: (seconds: number): boolean => weight(seconds) <= 0,
      });
    const standingOn = (standing: "left" | "right"): IHumanContactWindow[] => [
      {
        part: `${standing}Foot`,
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
    ];
    const hip: IAutoMovieVector3 = HumanFrame.point(
      { origin: Vector3.add(entry.root, over(other)), yaw: entry.yaw },
      body.rest.get(`${side}UpperLeg`)!,
    );

    switch (p.kind) {
      case "neckSide":
        primitives.push(
          AutoMovieMotionHumanHead.tilt(
            clock,
            ["start", "ready"],
            ["relax", "end"],
            -sign *
              AutoMovieMotionHumanRange.degrees("neck", "abduction", level) *
              modifiers.extent,
          ),
        );
        break;
      case "crossBody": {
        const reach = (posture: IHumanPosture): IAutoMovieVector3 =>
          HumanFrame.point(
            {
              origin: { x: posture.root.x, y: 0, z: posture.root.z },
              yaw: posture.yaw,
            },
            {
              x: -sign * 1.2 * m.shoulderHalfWidth,
              y: m.shoulderHeight,
              z: 0.35 * (m.upperArm + m.forearm),
            },
          );
        primitives.push(
          ...AutoMovieMotionHumanPlaced.arm({
            body,
            side,
            from: 0,
            to: clock.duration,
            rest: rest(side),
            weight,
            place: (posture: IHumanPosture) => ({
              point: reach(posture),
              facing: facing(posture, { x: 0, y: 0, z: -1 }),
              forward: facing(posture, { x: -sign, y: 0, z: 0 }),
            }),
            bend: "forward",
          }),
          ...AutoMovieMotionHumanPlaced.arm({
            body,
            side: other,
            from: 0,
            to: clock.duration,
            rest: rest(other),
            weight,
            place: (posture: IHumanPosture) => {
              const shoulder: IAutoMovieVector3 = HumanFrame.point(
                { origin: posture.root, yaw: posture.yaw },
                body.rest.get(`${side}UpperArm`)!,
              );
              return {
                point: Vector3.add(
                  Vector3.lerp(reach(posture), shoulder, 0.45),
                  Vector3.scale(forward, m.forearmRadius + m.upperArmRadius),
                ),
                facing: facing(posture, { x: 0, y: 0, z: -1 }),
              };
            },
            bend: "folded",
          }),
        );
        break;
      }
      case "overheadSide": {
        // The bend is the spine's: a pelvis rolled with it would take the
        // hip joints off the planted legs.
        const bend = (bone: "spine" | "chest"): [number, number, number] => [
          0,
          -sign *
            AutoMovieMotionHumanRange.degrees(bone, "abduction", level) *
            modifiers.extent,
          0,
        ];
        primitives.push(
          AutoMovieMotionHumanJoints.pulse(
            clock,
            ["start", "ready"],
            ["relax", "end"],
            { spine: bend("spine"), chest: bend("chest") },
          ),
        );
        for (const s of ["left", "right"] as const)
          primitives.push(
            ...AutoMovieMotionHumanPlaced.arm({
              body,
              side: s,
              from: 0,
              to: clock.duration,
              rest: rest(s),
              weight,
              place: (posture: IHumanPosture) => {
                const ride = (point: IAutoMovieVector3): IAutoMovieVector3 =>
                  AutoMovieMotionHumanPlaced.carried(
                    body,
                    entry,
                    posture,
                    point,
                  );
                const point: IAutoMovieVector3 =
                  AutoMovieMotionHumanPlaced.grid(body, entry, s, {
                    height: "overhead",
                    lateral: "inside",
                    distance: "close",
                  });
                return {
                  point: ride(point),
                  facing: Vector3.subtract(
                    ride(
                      Vector3.add(
                        point,
                        facing(entry, { x: s === "left" ? -1 : 1, y: 0, z: 0 }),
                      ),
                    ),
                    ride(point),
                  ),
                };
              },
              bend: "raised",
            }),
          );
        break;
      }
      case "quadriceps": {
        const ankle: IAutoMovieVector3 = stretchQuadriceps({
          body,
          side,
          hip,
          shoulder: AutoMovieMotionHumanPlaced.joint(
            body,
            { ...entry, root: Vector3.add(entry.root, over(other)) },
            `${side}UpperArm`,
          ),
          forward,
          least: KNEE,
        });
        const placement: HumanFoot.IPlacement = {
          ankle,
          rotation: HumanFoot.rotation(entry.yaw, -60),
        };
        primitives.push(
          balance(other),
          lifted(placement),
          ...AutoMovieMotionHumanPlaced.arm({
            body,
            side,
            from: 0,
            to: clock.duration,
            rest: rest(side),
            weight,
            surface: "grip",
            shape: "fist",
            place: (posture: IHumanPosture) => ({
              point: ankle,
              facing: facing(posture, { x: 0, y: 0, z: -1 }),
            }),
            bend: "behind",
          }),
        );
        contacts = standingOn(other);
        break;
      }
      case "tree": {
        const calf: IAutoMovieVector3 = Vector3.add(stance[other].ankle, {
          x: 0,
          y: 0.6 * m.shank,
          z: 0,
        });
        const placement: HumanFoot.IPlacement = {
          ankle: Vector3.add(
            calf,
            Vector3.scale(leftward, sign * (m.shankRadius + m.ankleHeight)),
          ),
          rotation: Quaternion.multiply(
            Quaternion.fromAxisAngle(forward, sign * 90),
            HumanFoot.rotation(entry.yaw - sign * 45, 0),
          ),
        };
        primitives.push(balance(other), lifted(placement));
        for (const s of ["left", "right"] as const) {
          const pad: number = AutoMovieMotionHumanTouchEffector.pad(body, s, {
            surface: "palm",
            shape: "flat",
          });
          primitives.push(
            ...AutoMovieMotionHumanPlaced.arm({
              body,
              side: s,
              from: 0,
              to: clock.duration,
              rest: rest(s),
              weight,
              place: (posture: IHumanPosture) => ({
                point: Vector3.add(
                  AutoMovieMotionHumanPlaced.grid(body, posture, s, {
                    height: "chest",
                    lateral: "centre",
                    distance: "near",
                  }),
                  facing(posture, {
                    x: (s === "left" ? 1 : -1) * pad,
                    y: 0,
                    z: 0,
                  }),
                ),
                facing: facing(posture, {
                  x: s === "left" ? -1 : 1,
                  y: 0,
                  z: 0,
                }),
                forward: { x: 0, y: 1, z: 0 },
              }),
              bend: "front",
            }),
          );
        }
        contacts = standingOn(other);
        break;
      }
    }
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(clock.duration, entry, contacts),
      clock,
      primitives,
      contact: "reachEnd",
    });
  }
}

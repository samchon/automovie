import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { walk } from "../actions/walk";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * Walking to a floor point while carrying a load or pushing a wheeled one:
 * a bag in one hand, a box in both hands before the body, a child on the
 * hip, or a cart or stroller pushed by its handle.
 *
 * The walk is the walk law's own (`walk.plan`), the base every unclaimed
 * channel keeps, so footfalls, pelvis and the free arm's swing are the
 * walk's; the load claims the arms that hold it, which stop swinging (arm
 * swing is suppressed on the loaded side), and leans the trunk by its mass,
 * a share of the body's mass in [0, 0.25] (the issue's band):
 *
 * - `oneHand`: the loaded arm hangs straight beside the body with the hand
 *   closed on the handle, and the trunk leans laterally away from the load
 *   (Zhang, Ye and Wang 2010, Comput Methods Biomech Biomed Engin 13:339).
 * - `twoHands`: both palms press the sides of a box as wide as 0.8 of the
 *   shoulders, held at waist height a third of the arm before the root, and
 *   the trunk leans back over it (Chaffin et al. 2006's front load).
 * - `hip`: the hand of the hip side lies palm up under the child's seat
 *   before that hip, and the trunk leans away to the other side.
 * - `push`: both hands grip a handle at the elbow's height 0.6 of the arm
 *   before the root, a shoulder width apart, and the trunk leans forward
 *   (Hoozemans et al. 1998 on handle height in pushing).
 *
 * Each lean is `LEAN` degrees per unit of the load's mass share
 * (provisional: no located study gives the slope), shared between the chest
 * and the spine, and grows in over the first `RAMP` seconds. The load
 * itself is not a prop yet, so no grip window is declared. Events: the
 * walk's.
 *
 * Not yet: shoulder straps, backpacks, overhead and head loads, a level
 * tray, the child in the arms, on the shoulders or in a carrier, pulling a
 * trolley or a suitcase, the cart as a moving support (A2), changing hands
 * (`shiftLoad`) and the frozen hand offset of a held prop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the base, each way of carrying with its source, the lean law, the mass band, the events and what is missing, with provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record composed over the walk's plan: arm rows and a trunk row on the walk's clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the lean table, the hold places and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every place is a share of the body's measure in its moving floor frame.
 */
export namespace carry {
  /** The action's name. */
  export const name: HumanActionName = "carry";

  /** Cancel table: a carry ends into standing, putting down or handing over at its last footfall. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: ["lastFootfall", 1],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
      },
    ],
    putDown: [
      {
        window: ["lastFootfall", 1],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
      },
    ],
    handOver: [
      {
        window: ["lastFootfall", 1],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
      },
    ],
  };

  /** How the load is held. */
  export type How = "oneHand" | "twoHands" | "hip" | "push";

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and default.
   * @evidence contracts/development/design.md#principled-representation The walk's destination and pace, the way of carrying, the side and the load's mass share.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hand place is typed.
   */
  export interface IParams {
    /** The floor point walked to, world metres. */
    to: IAutoMovieVector3;

    /** How the load is held. */
    how: How;

    /** The loaded side for `oneHand` and `hip`; `right` when absent. */
    side?: HumanHand.Side;

    /** The load's mass as a share of the body's, in [0, 0.25]; 0.1 when absent. */
    load?: number;

    /** The walk's pace; `normal` when absent. */
    pace?: "slow" | "normal" | "fast";
  }

  /** Trunk lean per unit of the load's mass share by way of carrying, degrees (provisional). */
  export const LEAN: Readonly<Record<How, number>> = {
    oneHand: 30,
    twoHands: 25,
    hip: 30,
    push: 40,
  };

  /** Seconds over which the hold and the lean grow in (provisional). */
  export const RAMP: number = 0.4;

  /**
   * A hand's hold place in the performer's moving floor frame.
   *
   * @param body The body.
   * @param posture The posture whose root and heading carry the frame.
   * @param how How the load is held.
   * @param side The hand.
   * @param loaded The loaded side.
   * @returns The point and the outward normal of the place, world, or undefined for a free hand.
   */
  export function place(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw">,
    how: How,
    side: HumanHand.Side,
    loaded: HumanHand.Side,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } | undefined {
    const m = body.measure;
    const arm: number = m.upperArm + m.forearm;
    const out: number = side === "left" ? 1 : -1;
    const frame: HumanFrame.IFrame = {
      origin: { x: posture.root.x, y: 0, z: posture.root.z },
      yaw: posture.yaw,
    };
    const turn = (v: IAutoMovieVector3): IAutoMovieVector3 =>
      HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw }, v);
    switch (how) {
      case "twoHands":
        return {
          point: HumanFrame.point(frame, {
            x: out * 0.8 * m.shoulderHalfWidth,
            y: m.waistHeight,
            z: arm / 3,
          }),
          normal: turn({ x: -out, y: 0, z: 0 }),
        };
      case "push":
        return {
          point: HumanFrame.point(frame, {
            x: out * m.shoulderHalfWidth,
            y: m.shoulderHeight - m.upperArm,
            z: 0.6 * arm,
          }),
          normal: { x: 0, y: 1, z: 0 },
        };
      case "hip":
        return side !== loaded
          ? undefined
          : {
              point: HumanFrame.point(frame, {
                x: out * m.hipHalfWidth,
                y: m.hipHeight - 0.05,
                z: 0.2 * arm,
              }),
              normal: { x: 0, y: -1, z: 0 },
            };
      case "oneHand":
        return undefined;
    }
  }

  /**
   * Plan a carry.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the load's share lies outside [0, 0.25], or the walk refuses its destination.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const p: IParams = context.params;
    const how: How = p.how;
    const loaded: HumanHand.Side = p.side ?? "right";
    const load: number = p.load ?? 0.1;
    HumanBound.within("load", load, 0, 0.25, "of the body's mass");
    const base: IHumanActionPlan = walk.plan({
      ...context,
      params: { to: p.to, ...(p.pace === undefined ? {} : { pace: p.pace }) },
    });
    const duration: number = base.duration;
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      duration,
      base.events.map((e) => ({ name: e.name, seconds: e.share * duration })),
    );
    const ramp = (seconds: number): number =>
      Math.min(1, Math.max(0, seconds / RAMP));

    // The trunk's lean: lateral away from a one-hand or hip load, back over a
    // front box, forward over a pushed handle; chest and spine share it.
    const degrees: number = LEAN[how] * load;
    // A positive lateral bend of the trunk leans it to the body's right.
    const away: number = loaded === "left" ? 1 : -1;
    const lean = (share: number): readonly [number, number, number] =>
      how === "oneHand" || how === "hip"
        ? [0, away * degrees * share * 0.5, 0]
        : how === "twoHands"
          ? [-degrees * share * 0.5, 0, 0]
          : [degrees * share * 0.5, 0, 0];
    const trunk: IAutoMovieMotionHumanPrimitive = {
      channels: ["trunk"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const add = lean(ramp(seconds));
        const sum = (
          held: readonly [number, number, number] | undefined,
        ): readonly [number, number, number] => [
          (held?.[0] ?? 0) + add[0],
          (held?.[1] ?? 0) + add[1],
          (held?.[2] ?? 0) + add[2],
        ];
        return {
          ...posture,
          joints: {
            ...posture.joints,
            chest: sum(posture.joints.chest),
            spine: sum(posture.joints.spine),
          },
        };
      },
    };

    // The loaded arms: a hanging closed hand for one-hand loads, hand goals
    // on the hold places otherwise.
    const arms: IAutoMovieMotionHumanPrimitive[] = [];
    for (const side of ["left", "right"] as const) {
      if (how === "oneHand") {
        if (side !== loaded) continue;
        arms.push({
          channels: [`${side}Arm`, `${side}Hand`],
          from: 0,
          to: duration,
          write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
            const s: number = ramp(seconds);
            return {
              ...posture,
              joints: {
                ...posture.joints,
                ...HumanHand.shape(side, s > 0.5 ? "fist" : "relaxed"),
                [`${side}UpperArm`]: [0, 8 * s, 0],
                [`${side}LowerArm`]: [12 * (1 - s) + 3 * s, 0, 0],
                [`${side}Hand`]: [0, 0, 0],
              },
            };
          },
        });
        continue;
      }
      if (place(body, context.entry.posture, how, side, loaded) === undefined)
        continue;
      arms.push(
        AutoMovieMotionHumanArm.carried({
          body,
          side,
          from: 0,
          to: duration,
          rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
          weight: ramp,
          goal: (posture: IHumanPosture): IHumanPosture.IGoal => {
            const at = place(body, posture, how, side, loaded)!;
            return AutoMovieMotionHumanArm.goal(
              body,
              side,
              AutoMovieMotionHumanTarget.hand(body, posture, side, at, {
                surface: how === "push" ? "grip" : "palm",
                shape: "relaxed",
                ...(how === "push" ? { curl: 40 } : {}),
              }),
            );
          },
        }),
      );
    }
    return composeAutoMovieMotionHumanAction({
      base,
      clock,
      primitives: [trunk, ...arms],
    });
  }
}

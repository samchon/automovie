import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  AutoMovieMotionHumanChannelClaim,
  IAutoMovieAngleRange,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarry,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walk } from "../actions/walk";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { prepareHumanShapeBlend } from "../handling/prepareHumanShapeBlend";
import { HumanBound } from "../law/HumanBound";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";

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
 * - `push`: both hands grip a handle at the elbow's height a forearm
 *   before the shoulders, the upper arms hanging, a shoulder width apart,
 *   and the trunk leans forward (Hoozemans et al. 1998 on handle height in
 *   pushing).
 *
 * A held load's lean is the trunk's balance over the hips (`tilt`): the
 * trunk leans until its own weight's moment about the hips matches the
 * load's, the head, arms and trunk weighing 0.678 of the body with their
 * centre 0.626 of the way from the hips to the shoulders (Winter 2009,
 * Biomechanics and Motor Control of Human Movement, Table 4.1). It is an
 * upper bound: the legs also tilt toward the free side (Zhang, Ye and Wang
 * 2010). A pushed handle's forward lean is `PUSH` degrees per unit of the
 * cart's mass share, with no located study of the slope (a push's force is
 * the cart's rolling resistance, which the law does not know). The lean is
 * shared between the chest and the spine and grows in over the first
 * `RAMP` seconds. The load
 * itself is not a prop yet, so no grip window is declared. Events: the
 * walk's. An overlay may take the head and, under a one-hand or hip load,
 * the free arm and hand (the plan's `yields`), so a wave or a phone rides a
 * carry as it rides a walk.
 *
 * Not yet: shoulder straps, backpacks, overhead and head loads, a level
 * tray, the child in the arms, on the shoulders or in a carrier, pulling a
 * trolley or a suitcase, the cart as a moving support (A2), changing hands
 * (`shiftLoad`) and the frozen hand offset of a held prop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the base, each way of carrying with its source, the lean law, the mass band, the events and what is missing, with provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record composed over the walk's plan: arm rows and a trunk row on the walk's clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the balance lean with its segment data, the hanging arm, the hold places and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every place is a share of the body's measure in its moving floor frame.
 */
export namespace carry {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "carry";

  /** Cancel table: a carry ends into standing, putting down or handing over at its last footfall. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
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

  /** The head, arms and trunk's share of the body's mass (Winter 2009, Table 4.1). */
  export const HAT_MASS: number = 0.678;

  /** Where the head, arms and trunk's centre of mass lies from the hips to the shoulders, as a share (Winter 2009, Table 4.1). */
  export const HAT_CENTRE: number = 0.626;

  /** A pushed handle's forward trunk lean per unit of the cart's mass share, degrees; no located study gives it. */
  export const PUSH: number = 40;

  /**
   * The trunk's lean that balances a held load over the hips, degrees: the
   * head, arms and trunk tip by `asin(s d / (HAT_MASS h))`, with `s` the
   * load's mass share, `d` the load's offset from the hips' midline (the
   * shoulder's half width for a hanging bag, the hip's for a child, the
   * box's reach ahead) and `h` the height of the trunk's centre above the
   * hips. A pushed handle leans by `PUSH`.
   *
   * @param body The body.
   * @param how How the load is held.
   * @param load The load's mass share.
   * @returns Degrees of lean, away from a side load, back from a front one, forward over a pushed handle.
   */
  export function tilt(
    body: IAutoMovieMotionHumanBody,
    how: IAutoMovieMotionHumanCarry.How,
    load: number,
  ): number {
    if (how === "push") return PUSH * load;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const offset: number =
      how === "oneHand"
        ? m.shoulderHalfWidth
        : how === "hip"
          ? m.hipHalfWidth
          : (m.upperArm + m.forearm) / 3;
    const above: number = HAT_CENTRE * (m.shoulderHeight - m.hipHeight);
    return (
      (Math.asin(Math.min(1, (load * offset) / (HAT_MASS * above))) * 180) /
      Math.PI
    );
  }

  /** Seconds over which the hold and the lean grow in (provisional). */
  export const RAMP: number = 0.4;

  /**
   * The one-hand load's hanging arm, clinical `[flexion, abduction, twist]`
   * degrees. The load pulls the arm straight down, so the elbow sits at its
   * range's full extension (`DEFAULT_HUMANOID_ROM`), and the upper arm is
   * abducted just enough that the straight arm's wrist clears the thigh: the
   * wrist's line, a forearm's radius in from the wrist's outer side, lies
   * beside the thigh's outer surface (the hip joint's half width plus the
   * thigh's radius), reached from the shoulder's half width over the arm's
   * length. A body whose shoulders stand wider than that hangs its arm
   * plumb.
   *
   * @param body The body.
   * @param side The loaded arm.
   * @returns The upper arm's and the elbow's angles.
   * @throws {Error} When the range-of-motion table gives the elbow no flexion.
   */
  export function hang(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): {
    upper: readonly [number, number, number];
    lower: readonly [number, number, number];
  } {
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const elbow: IAutoMovieAngleRange | null | undefined =
      DEFAULT_HUMANOID_ROM[`${side}LowerArm`]?.flexion;
    if (elbow === null || elbow === undefined)
      throw new Error("The range-of-motion table gives the elbow no flexion");
    const out: number =
      m.hipHalfWidth + m.thighRadius + m.forearmRadius - m.shoulderHalfWidth;
    const abduction: number =
      (Math.asin(Math.min(1, Math.max(0, out) / (m.upperArm + m.forearm))) *
        180) /
      Math.PI;
    return { upper: [0, abduction, 0], lower: [elbow.min, 0, 0] };
  }

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
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">,
    how: IAutoMovieMotionHumanCarry.How,
    side: AutoMovieHumanSide,
    loaded: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanCarry.IPlaceResult {
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const arm: number = m.upperArm + m.forearm;
    const out: number = side === "left" ? 1 : -1;
    const frame: IAutoMovieMotionHumanFrame = {
      origin: { x: posture.root.x, y: 0, z: posture.root.z },
      yaw: posture.yaw,
    };
    const turn: (v: IAutoMovieVector3) => IAutoMovieVector3 = (v: IAutoMovieVector3): IAutoMovieVector3 =>
      HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw }, v);
    // A pushed handle at the elbow's height (Hoozemans et al. 1998) is held
    // with the upper arm hanging and the forearm level, so the grip lies the
    // shoulder less the upper arm high and a forearm ahead, a shoulder width
    // apart. The box's and the child's places are shares of the body's
    // measures standing in for the load's own size, which a load that is not
    // yet a prop cannot give (the namespace's "not yet").
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
            z: m.forearm,
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
   * @throws {HumanRefusal} When the load's share lies outside [0, 0.25], or the walk refuses its destination.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCarry.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const p: IAutoMovieMotionHumanCarry.IParams = context.params;
    const how: IAutoMovieMotionHumanCarry.How = p.how;
    const loaded: AutoMovieHumanSide = p.side ?? "right";
    // A tenth of the body's mass when the author names none, the
    // contract's default (`IAutoMovieMotionHumanCarry.IParams.load`).
    const load: number = p.load ?? 0.1;
    HumanBound.within("load", load, 0, 0.25, "of the body's mass");
    const base: IAutoMovieMotionHumanActionPlan = walk.plan({
      ...context,
      params: {
        to: p.to,
        ...(p.pace === undefined ? {} : { pace: p.pace }),
        ...(p.manner === undefined ? {} : { manner: p.manner }),
      },
    });
    const duration: number = base.duration;
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(
      duration,
      base.events.map(
        (e: IAutoMovieMotionHumanActionPlan["events"][number]): { name: string; seconds: number } => ({
          name: e.name,
          seconds: e.share * duration,
        }),
      ),
    );
    const ramp: (seconds: number) => number = (seconds: number): number =>
      Math.min(1, Math.max(0, seconds / RAMP));

    // The trunk's lean: lateral away from a one-hand or hip load, back over a
    // front box, forward over a pushed handle; chest and spine share it.
    const degrees: number = tilt(body, how, load);
    // A positive lateral bend of the trunk leans it to the body's right.
    const away: number = loaded === "left" ? 1 : -1;
    const lean: (share: number) => readonly [number, number, number] = (share: number): readonly [number, number, number] =>
      how === "oneHand" || how === "hip"
        ? [0, away * degrees * share * 0.5, 0]
        : how === "twoHands"
          ? [-degrees * share * 0.5, 0, 0]
          : [degrees * share * 0.5, 0, 0];
    const trunk: IAutoMovieMotionHumanPrimitive = {
      channels: ["trunk"],
      from: 0,
      to: duration,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const add: readonly [number, number, number] = lean(ramp(seconds));
        const sum: (held: readonly [number, number, number] | undefined) => readonly [number, number, number] = (
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

        // The arm and the fingers move from the entry's own angles to the
        // hanging hold over the ramp, so the carry starts where the entry
        // left the arm and the hand closes on the handle continuously.
        const rest: IAutoMovieMotionHumanArmAngles.IAngles =
          AutoMovieMotionHumanArm.angles(context.entry.pose, side);
        const hung: ReturnType<typeof hang> = hang(body, side);
        const close: (weight: number) => IAutoMovieMotionHumanPosture["joints"] =
          prepareHumanShapeBlend(rest.fingers ?? {}, HumanHand.shape(side, "fist"));
        arms.push({
          channels: [`${side}Arm`, `${side}Hand`],
          from: 0,
          to: duration,
          write: (
            posture: IAutoMovieMotionHumanPosture,
            seconds: number,
          ): IAutoMovieMotionHumanPosture => {
            const s: number = ramp(seconds);
            return {
              ...posture,
              joints: {
                ...posture.joints,
                ...close(s),
                [`${side}UpperArm`]: blendHumanJoint(body, `${side}UpperArm`, rest.upper, hung.upper, s),
                [`${side}LowerArm`]: blendHumanJoint(body, `${side}LowerArm`, rest.lower, hung.lower, s),
                [`${side}Hand`]: blendHumanJoint(body, `${side}Hand`, rest.hand, [0, 0, 0], s),
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
          goal: (
            posture: IAutoMovieMotionHumanPosture,
          ): IAutoMovieHumanLimbGoal => {
            const at: NonNullable<IAutoMovieMotionHumanCarry.IPlaceResult> = place(body, posture, how, side, loaded)!;
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
    // The head and an arm no load holds are the walk's to yield, as a
    // walk's own are: a one-hand or hip load leaves the other arm free.
    const free: readonly AutoMovieHumanSide[] =
      how === "oneHand" || how === "hip"
        ? [loaded === "left" ? "right" : "left"]
        : [];
    return {
      ...composeAutoMovieMotionHumanAction({
        base,
        clock,
        primitives: [trunk, ...arms],
      }),
      yields: [
        "head",
        ...free.flatMap(
          (side: AutoMovieHumanSide): AutoMovieMotionHumanChannelClaim[] => [
            `${side}Arm`,
            `${side}Hand`,
          ],
        ),
      ],
    };
  }
}

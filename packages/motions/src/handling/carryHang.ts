import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanCarryHang,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanGrip } from "./HumanGrip";

/**
 * Loads carried at the sides with the arms hanging, performed over a walk
 * (`HumanChain.over`): a farmer's walk. Each hand that holds a prop is let
 * down until its arm hangs nearly straight from the shoulder, a little out
 * from the thigh, the hand turned as it held the prop, and holds it there.
 *
 * Each wrist goes `HANG` of the arm (upper arm and forearm) below its
 * shoulder, read on the walk's posture each second, and `OUT` of the half
 * shoulder width out to the side; the arms leave their carrying pose over
 * `SETTLE` seconds and keep the walk's posture otherwise. The props stay in
 * the hands: the law grips them through its whole length and leaves them
 * held after.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the place of each wrist, what keeps the props and the timing.
 * @evidence contracts/development/design.md#principled-representation An overlay of both arms over a walk, a place of the trunk's own frame carried with it, with the holds kept.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the overlay flag, three constants, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The props are the hands' holds, never placed by hand.
 */
export namespace carryHang {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "carryHang";

  /** Cancel table: the arms may be taken over at any time. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
  };

  /** A carry of the arms is performed over a walk. */
  export const overlay: boolean = true;

  /** How far below the shoulder each wrist hangs, a share of the arm (provisional: nearly straight). */
  export const HANG: number = 0.97;

  /** How far out from the shoulder each wrist hangs, a share of the half shoulder width (provisional: clear of the thigh with a load). */
  export const OUT: number = 0.25;

  /** Seconds the arms take to let the loads down (provisional). */
  export const SETTLE: number = 0.5;

  /**
   * Plan a carry with hanging arms.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the carry's length is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Each wrist is a place below its shoulder on the posture of each second, the hand turned as it holds the prop at the start, and the arm carried there from the carrier's own arm by the settle's envelope.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Sides, duration, the held fingers, the posture.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A non-positive length throws; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolve and one posture resolve per frame.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to the carrier, the arm carry and the grip's fingers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the base plan and the hands' rotations.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCarryHang.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanCarryHang.IParams = context.params;
    const body = context.body;
    const duration: number = p.seconds ?? 3;
    HumanBound.above("seconds", duration, 0, "s");
    const base: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, duration);
    const sides: IAutoMovieMotionHumanHand.Side[] = (
      ["left", "right"] as const
    ).filter(
      (side: IAutoMovieMotionHumanHand.Side): boolean => p[side] !== undefined,
    );
    const bones = poseBones(body, context.entry.pose);
    const turns = Object.fromEntries(
      sides.map((side: IAutoMovieMotionHumanHand.Side) => [
        side,
        bones.get(`${side}Hand`)!.worldRotation,
      ]),
    );
    const fingers = Object.fromEntries(
      sides.map((side: IAutoMovieMotionHumanHand.Side) => [
        side,
        HumanGrip.fingers(context.entry.pose, side),
      ]),
    );
    const arm: number = body.measure.upperArm + body.measure.forearm;
    return {
      duration,
      events: [{ name: "settled", share: Math.min(1, SETTLE / duration) }],
      // Each hand keeps its prop: a grip from the start, then the hold.
      contacts: [
        ...base.contacts,
        ...sides.map(
          (
            side: IAutoMovieMotionHumanHand.Side,
          ): IAutoMovieMotionHumanContactWindow => ({
            part: `${side}Hand`,
            kind: "grip",
            from: 0,
            to: 1,
            support: { kind: "prop", subject: p[side]! },
          }),
        ),
      ],
      hands: sides,
      holds: sides.map((side: IAutoMovieMotionHumanHand.Side) => ({
        side,
        prop: p[side]!,
        from: 0,
        fingers: fingers[side],
      })),
      ...(context.carrier === undefined
        ? {}
        : {
            channels: sides.flatMap((side: IAutoMovieMotionHumanHand.Side) => [
              `${side}Arm` as const,
              `${side}Hand` as const,
            ]),
          }),
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const posture: IAutoMovieMotionHumanPosture = base.posture(t);
        const share: number = minimumJerk(Math.min(1, t / SETTLE)).s;
        const trunk = HumanTrunk.resolve(body, posture);
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...posture.limbs,
        };
        let joints: IAutoMovieMotionHumanPosture["joints"] = {
          ...posture.joints,
        };
        for (const side of sides) {
          const shoulder: IAutoMovieVector3 = trunk.get(
            `${side}UpperArm`,
          )!.worldPosition;
          const sign: number = side === "left" ? 1 : -1;
          limbs[`${side}Arm`] = {
            point: {
              ...HumanFrame.point(
                { origin: shoulder, yaw: posture.yaw },
                { x: sign * OUT * body.measure.shoulderHalfWidth, y: 0, z: 0 },
              ),
              y: shoulder.y - HANG * arm,
            },
            rotation: turns[side]!,
            bend: HumanFrame.point(
              { origin: shoulder, yaw: posture.yaw },
              {
                x: sign * 0.2 * body.measure.upperArm,
                y: -0.5 * arm,
                z: -0.1 * arm,
              },
            ),
          };
          joints = { ...joints, ...fingers[side] };
        }
        const walked = resolveHumanPosture(body, posture);
        const run: Partial<
          Record<
            IAutoMovieMotionHumanHand.Side,
            IAutoMovieMotionHumanArmAngles.IAngles
          >
        > = Object.fromEntries(
          sides.map((side: IAutoMovieMotionHumanHand.Side) => [
            side,
            AutoMovieMotionHumanArm.angles(walked, side),
          ]),
        );
        return AutoMovieMotionHumanArm.carry(
          body,
          { ...posture, joints, limbs },
          run,
          share,
        );
      },
    };
  }
}

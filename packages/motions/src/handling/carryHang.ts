import { type IAutoMovieResolvedBone, minimumJerk } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
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
  export const name: HumanActionKey = "carryHang";

  /** Cancel table: the arms may be taken over at any time. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
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
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The props held in each hand and how long the carry lasts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A hand with no prop is left to the walk.
   */
  export interface IParams {
    /** The prop the left hand holds; that arm is left to the walk when absent. */
    left?: string;

    /** The prop the right hand holds; that arm is left to the walk when absent. */
    right?: string;

    /** Seconds the carry lasts; 3 when absent. */
    seconds?: number;
  }

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
   * @evidence contracts/development/implementation.md#efficient-algorithms Each active frame demands only carrying shoulders and shares one yaw transform across both wrist/bend placements. The carrier's full posture supplies baseline arm angles only during settle, since carry returns the goal body unchanged at share one. Empty carries read only their base body; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Entry hand turns and finger tuples prepare once; each changing carrier posture still supplies its original shoulder and settle solve. Optional same-person FK/ROM loans pass through the complete carrier, raw shoulder FK, actual baseline seeded solve and carry without changing their source policies.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns its original base/hand geometry; optional current-call FK/ROM inputs are borrowed only synchronously and never retained in the plan, goals, returned posture or a time history.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body: IHumanBody = context.body;
    const duration: number = p.seconds ?? 3;
    HumanBound.above("seconds", duration, 0, "s");
    const base: IHumanActionPlan = AutoMovieMotionHumanBase.under(
      context,
      duration,
    );
    const sides: HumanHand.Side[] = (["left", "right"] as const).filter(
      (side: HumanHand.Side): boolean => p[side] !== undefined,
    );
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set(
      sides.map((side: HumanHand.Side): AutoMovieHumanoidBone => `${side}Hand`),
    );
    const shoulders: ReadonlySet<AutoMovieHumanoidBone> = new Set(
      sides.map((side: HumanHand.Side): AutoMovieHumanoidBone => `${side}UpperArm`),
    );
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, context.entry.pose, undefined, requested);
    const turns: Partial<Record<HumanHand.Side, IAutoMovieQuaternion>> = {};
    const fingers: Partial<Record<HumanHand.Side, IHumanPosture["joints"]>> = {};
    for (const side of sides) {
      turns[side] = bones.get(`${side}Hand`)!.worldRotation;
      fingers[side] = HumanGrip.fingers(context.entry.pose, side);
    }
    const arm: number = body.measure.upperArm + body.measure.forearm;
    return {
      duration,
      events: [{ name: "settled", share: Math.min(1, SETTLE / duration) }],
      // Each hand keeps its prop: a grip from the start, then the hold.
      contacts: [
        ...base.contacts,
        ...sides.map(
          (side: HumanHand.Side): IHumanContactWindow => ({
            part: `${side}Hand`,
            kind: "grip",
            from: 0,
            to: 1,
            support: { kind: "prop", subject: p[side]! },
          }),
        ),
      ],
      hands: sides,
      holds: sides.map((side: HumanHand.Side) => ({
        side,
        prop: p[side]!,
        from: 0,
        fingers: fingers[side],
      })),
      ...(context.carrier === undefined
        ? {}
        : {
            channels: sides.flatMap((side: HumanHand.Side) => [
              `${side}Arm` as const,
              `${side}Hand` as const,
            ]),
          }),
      posture: (seconds: number, _channels?: Parameters<IHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IHumanActionPlan["posture"]>[2],
        projection?: Parameters<IHumanActionPlan["posture"]>[3]): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const posture: IHumanPosture = base.posture(t, undefined, resolution, projection);
        if (sides.length === 0) return posture;
        const share: number = minimumJerk.share(Math.min(1, t / SETTLE));
        const trunk: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          HumanTrunk.resolve(body, posture, undefined, resolution, shoulders);
        const heading: HumanFrame.IPrepared = HumanFrame.prepare({ origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw });
        const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
        const joints: IHumanPosture["joints"] = { ...posture.joints };
        for (const side of sides) {
          const shoulder: IAutoMovieVector3 = trunk.get(
            `${side}UpperArm`,
          )!.worldPosition;
          const sign: number = side === "left" ? 1 : -1;
          limbs[`${side}Arm`] = {
            point: {
              ...heading.point(
                { x: sign * OUT * body.measure.shoulderHalfWidth, y: 0, z: 0 },
                shoulder,
              ),
              y: shoulder.y - HANG * arm,
            },
            rotation: turns[side]!,
            bend: heading.point(
              {
                x: sign * 0.2 * body.measure.upperArm,
                y: -0.5 * arm,
                z: -0.1 * arm,
              },
              shoulder,
            ),
          };
          Object.assign(joints, fingers[side]);
        }
        const carrying: IHumanPosture = { ...posture, joints, limbs };
        if (share >= 1) return carrying;
        const walked: ReturnType<typeof resolveHumanPosture> = resolveHumanPosture.seeded(body,
          posture, undefined, undefined, resolution, undefined, projection).pose;
        const run: Partial<
          Record<HumanHand.Side, AutoMovieMotionHumanArm.IAngles>
        > = Object.fromEntries(
          sides.map((side: HumanHand.Side) => [
            side,
            AutoMovieMotionHumanArm.angles(walked, side),
          ]),
        );
        return AutoMovieMotionHumanArm.carry(
          body,
          carrying,
          run,
          share,
          undefined,
          resolution,
          projection,
        );
      },
    };
  }
}

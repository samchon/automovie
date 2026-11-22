import { Quaternion, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  AutoMovieMotionHumanChannelClaim,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarryHang,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionPropHold,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
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
 * from the thigh, the hand turned as it held the prop (carried round with the
 * body when the walk turns), and holds it there.
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the overlay flag, four constants, the parameters and the plan.
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

  /** Seconds a carry lasts when its parameters name none (provisional: a farmer's walk set of a few seconds). */
  export const SECONDS: number = 3;

  /**
   * Plan a carry with hanging arms.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the carry's length is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Each wrist is a place below its shoulder on the posture of each second, the hand at the turn it held the prop at the start relative to the heading, the elbow on the hanging preset (`AutoMovieMotionHumanBend.hang`), and the arm carried there from the carrier's own arm by the settle's minimum-jerk envelope.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Sides, duration, the held fingers, the posture.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A non-positive length throws; nothing is clamped; the shares are named provisional.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each frame resolves only the carrying shoulders; the carrier's full posture is solved for its arm angles only during the settle.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The entry hand turns and finger angles are read once at planning.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds its base plan, the entry turns and fingers; the FK workspace and projection a caller passes are used within the call only.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCarryHang.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanCarryHang.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const duration: number = p.seconds ?? SECONDS;
    HumanBound.above("seconds", duration, 0, "s");
    const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
      context,
      duration,
    );
    const sides: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
      (side: AutoMovieHumanSide): boolean => p[side] !== undefined,
    );
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set(
      sides.map((side: AutoMovieHumanSide): AutoMovieHumanoidBone => `${side}Hand`),
    );
    const shoulders: ReadonlySet<AutoMovieHumanoidBone> = new Set(
      sides.map((side: AutoMovieHumanSide): AutoMovieHumanoidBone => `${side}UpperArm`),
    );
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, context.entry.pose, undefined, requested);
    const turns: Partial<Record<AutoMovieHumanSide, IAutoMovieQuaternion>> = {};
    const fingers: Partial<Record<AutoMovieHumanSide, IAutoMovieMotionHumanPosture["joints"]>> = {};
    for (const side of sides) {
      turns[side] = bones.get(`${side}Hand`)!.worldRotation;
      fingers[side] = HumanGrip.fingers(context.entry.pose, side);
    }
    const arm: number = body.measure.upperArm + body.measure.forearm;
    const entryYaw: number = context.entry.posture.yaw;
    return {
      duration,
      events: [{ name: "settled", share: Math.min(1, SETTLE / duration) }],
      // Each hand keeps its prop: a grip from the start, then the hold.
      contacts: [
        ...base.contacts,
        ...sides.map(
          (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
            part: `${side}Hand`,
            kind: "grip",
            from: 0,
            to: 1,
            support: { kind: "prop", subject: p[side]! },
          }),
        ),
      ],
      hands: sides,
      holds: sides.map((side: AutoMovieHumanSide): IAutoMovieMotionPropHold => ({
        side,
        prop: p[side]!,
        from: 0,
        fingers: fingers[side],
      })),
      ...(context.carrier === undefined
        ? {}
        : {
            channels: sides.flatMap((side: AutoMovieHumanSide): AutoMovieMotionHumanChannelClaim[] => [
              `${side}Arm`,
              `${side}Hand`,
            ]),
          }),
      posture: (seconds: number, _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3]): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const posture: IAutoMovieMotionHumanPosture = base.posture(t, undefined, resolution, projection);
        if (sides.length === 0) return posture;
        const share: number = minimumJerk.share(Math.min(1, t / SETTLE));
        const trunk: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          HumanTrunk.resolve(body, posture, undefined, resolution, shoulders);
        const heading: HumanFrame.IPrepared = HumanFrame.prepare({ origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw });

        // The hand keeps the turn it held the prop at relative to the body,
        // so a walk that turns carries it round with the trunk.
        const turned: IAutoMovieQuaternion = Quaternion.fromAxisAngle(UP, posture.yaw - entryYaw);
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
        const joints: IAutoMovieMotionHumanPosture["joints"] = { ...posture.joints };
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
            rotation: Quaternion.normalize(Quaternion.multiply(turned, turns[side]!)),

            // The hanging arm's elbow: down, a little out and behind.
            bend: AutoMovieMotionHumanBend.hang(body, posture, side),
          };
          Object.assign(joints, fingers[side]);
        }
        const carrying: IAutoMovieMotionHumanPosture = { ...posture, joints, limbs };
        if (share >= 1) return carrying;
        const walked: ReturnType<typeof resolveHumanPosture> = resolveHumanPosture.seeded(body,
          posture, undefined, undefined, resolution, undefined, projection).pose;
        const run: Partial<
          Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
        > = Object.fromEntries(
          sides.map((side: AutoMovieHumanSide): [AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles] => [
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

/** The world's up, the axis a heading turns about. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

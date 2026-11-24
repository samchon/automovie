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
import { AutoMovieMotionHumanArmJointCourse } from "../compose/AutoMovieMotionHumanArmJointCourse";
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
 * (`HumanChain.over`): a farmer's walk. Each hand that holds a prop is let down
 * until its arm hangs nearly straight from the shoulder, a little out from the
 * thigh, the hand turned as it held the prop (carried round with the body when
 * the walk turns), and holds it there.
 *
 * Each wrist goes `HANG` of the arm (upper arm and forearm) below its shoulder,
 * read on the walk's posture each second, and `OUT` of the half shoulder width
 * out to the side; the arms leave their carrying pose over `SETTLE` seconds and
 * keep the walk's posture otherwise. The props stay in the hands: the law grips
 * them through its whole length and leaves them held after.
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

  /**
   * How far below the shoulder each wrist hangs, a share of the arm
   * (provisional: nearly straight).
   */
  export const HANG: number = 0.97;

  /**
   * How far out from the shoulder each wrist hangs, a share of the half
   * shoulder width (provisional: clear of the thigh with a load).
   */
  export const OUT: number = 0.25;

  /** Seconds the arms take to let the loads down (provisional). */
  export const SETTLE: number = 0.5;

  /**
   * Seconds a carry lasts when its parameters name none (provisional: a
   * farmer's walk set of a few seconds).
   */
  export const SECONDS: number = 3;

  /**
   * Plan a carry with hanging arms.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the carry's length is not positive.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCarryHang.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanCarryHang.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const duration: number = p.duration ?? SECONDS;
    HumanBound.above("duration", duration, 0, "s");
    const base: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, duration);
    const sides: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
      (side: AutoMovieHumanSide): boolean => p[side] !== undefined,
    );
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set(
      sides.map(
        (side: AutoMovieHumanSide): AutoMovieHumanoidBone => `${side}Hand`,
      ),
    );
    const shoulders: ReadonlySet<AutoMovieHumanoidBone> = new Set(
      sides.map(
        (side: AutoMovieHumanSide): AutoMovieHumanoidBone => `${side}UpperArm`,
      ),
    );
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      context.entry.pose,
      undefined,
      requested,
    );
    const turns: Partial<Record<AutoMovieHumanSide, IAutoMovieQuaternion>> = {};
    const fingers: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanPosture["joints"]>
    > = {};
    for (const side of sides) {
      turns[side] = bones.get(`${side}Hand`)!.worldRotation;
      fingers[side] = HumanGrip.fingers(context.entry.pose, side);
    }
    const arm: number = body.measure.upperArm + body.measure.forearm;
    const entryYaw: number = context.entry.posture.yaw;
    // The carry's inputs at a second, which the knot course is solved from
    // once the performance is prepared (`AutoMovieMotionHumanArmJointCourse`).
    let course: AutoMovieMotionHumanArmJointCourse.Course | undefined;
    const inputs = (
      t: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): AutoMovieMotionHumanArmJointCourse.IInput => {
      const posture: IAutoMovieMotionHumanPosture = base.posture(
        t,
        undefined,
        resolution,
        projection,
      );
      if (sides.length === 0)
        return { posture, sides: [], held: {}, share: 1 };
      const share: number = minimumJerk.share(Math.min(1, t / SETTLE));
      const trunk: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        HumanTrunk.resolve(body, posture, undefined, resolution, shoulders);
      const heading: HumanFrame.IPrepared = HumanFrame.prepare({
        origin: { x: 0, y: 0, z: 0 },
        yaw: posture.yaw,
      });

      // The hand keeps the turn it held the prop at relative to the body,
      // so a walk that turns carries it round with the trunk.
      const turned: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        UP,
        posture.yaw - entryYaw,
      );
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
        ...posture.limbs,
      };
      const joints: IAutoMovieMotionHumanPosture["joints"] = {
        ...posture.joints,
      };
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
          rotation: Quaternion.normalize(
            Quaternion.multiply(turned, turns[side]!),
          ),

          // The hanging arm's elbow: down, a little out and behind.
          bend: AutoMovieMotionHumanBend.hang(body, posture, side),
        };
        Object.assign(joints, fingers[side]);
      }
      const carrying: IAutoMovieMotionHumanPosture = {
        ...posture,
        joints,
        limbs,
      };
      if (share >= 1)
        return { posture: carrying, sides, held: {}, share: 1 };
      // The arms as the walk swings them, read where the carry leaves them:
      // at the course's knots, and at every second before it is solved.
      if (course !== undefined) return { posture: carrying, sides, held: {}, share };
      const swung = (): Held => {
        const walked: ReturnType<typeof resolveHumanPosture> =
          resolveHumanPosture.seeded(
            body,
            posture,
            undefined,
            undefined,
            resolution,
            undefined,
            projection,
          ).pose;
        return Object.fromEntries(
          sides.map(
            (
              side: AutoMovieHumanSide,
            ): [AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles] => [
              side,
              AutoMovieMotionHumanArm.angles(walked, side),
            ],
          ),
        );
      };
      return { posture: carrying, sides, held: swung(), share };
    };
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
      holds: sides.map(
        (side: AutoMovieHumanSide): IAutoMovieMotionPropHold => ({
          side,
          prop: p[side]!,
          from: 0,
          fingers: fingers[side],
        }),
      ),
      ...(context.carrier === undefined
        ? {}
        : {
            channels: sides.flatMap(
              (
                side: AutoMovieHumanSide,
              ): AutoMovieMotionHumanChannelClaim[] => [
                `${side}Arm`,
                `${side}Hand`,
              ],
            ),
          }),
      posture: (
        seconds: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const input: AutoMovieMotionHumanArmJointCourse.IInput = inputs(
          t,
          resolution,
          projection,
        );
        return course === undefined
          ? AutoMovieMotionHumanArm.carry(
              body,
              input.posture,
              input.held,
              input.share,
              undefined,
              resolution,
              projection,
            )
          : course(t, input.posture, input.share);
      },
      prepare: (): void => {
        base.prepare?.();
        // The settle's branch points: its ends and its centre.
        const settle: number = Math.min(duration, SETTLE);
        course = AutoMovieMotionHumanArmJointCourse(
          body,
          [0, settle / 2, settle].map(
            (t: number): AutoMovieMotionHumanArmJointCourse.IKnot => ({
              seconds: t,
              input: inputs(t),
            }),
          ),
        );
      },
    };
  }
}

/** Each carried arm's held angles. */
type Held = Partial<
  Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
>;

/** The world's up, the axis a heading turns about. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { HumanHandTarget } from "../posture/HumanHandTarget";
import type { HumanKnot } from "../posture/HumanKnot";
import { poseBones } from "../posture/poseBones";
import { prepareHumanKnotCourse } from "../posture/prepareHumanKnotCourse";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { ILadderAccessGrip } from "./ILadderAccessGrip";
import { climbLadderHands } from "./climbLadderHands";

/**
 * The longest easing onto or off a grip outside its window, seconds
 * (provisional).
 */
const SEAT: number = 0.12;

/**
 * Seat each ladder grip of the access route on its staged point throughout its
 * window, including while another limb moves, and ease the hand onto and off it
 * over up to `SEAT` seconds outside the window, never past half the gap to that
 * hand's neighbouring grip. A rung grip uses the ladder climb's own hand
 * placement (`climbLadderHands`); a rail grip wraps the upright bar with the
 * hand's grip frame, the elbow bent as hanging. A grip held behind the body, as
 * from the landing, keeps the support law's own held-hand fit, which already
 * meets its target; this is decided once per hold, at its middle.
 *
 * @param body The canonical motion body.
 * @param normal World unit direction the gripping palm faces.
 * @param plan The support law's plan of the route.
 * @param grips The route's rung and rail grips and their windows.
 * @returns The route's posture with the arms seated on their grips.
 */
export function seatLadderAccessGrips(
  body: IAutoMovieMotionHumanBody,
  normal: IAutoMovieVector3,
  plan: IAutoMovieMotionHumanActionPlan,
  grips: readonly ILadderAccessGrip[],
): IAutoMovieMotionHumanActionPlan["posture"] {
  const rung: ReturnType<typeof climbLadderHands> = climbLadderHands(
    body,
    normal,
  );
  const rail = (
    side: AutoMovieHumanSide,
  ): ReturnType<typeof HumanHandTarget.prepareFrame> =>
    HumanHandTarget.prepareFrame(body, side, normal, {
      surface: "grip",
      forward: { x: 0, y: side === "left" ? 1 : -1, z: 0 },
    });
  const rails: Record<
    AutoMovieHumanSide,
    ReturnType<typeof HumanHandTarget.prepareFrame>
  > = { left: rail("left"), right: rail("right") };
  const offsets: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: HumanHand.offset(body, "left", "grip").point,
    right: HumanHand.offset(body, "right", "grip").point,
  };
  // The route's own wrist and elbow over an easing window, which the hand
  // eases from or into: solved here at the window's two ends and its middle
  // and read between them from a knot course (`prepareHumanKnotCourse`), so
  // a read resolves no posture.
  const hand = (
    side: AutoMovieHumanSide,
    from: number,
    to: number,
  ): prepareHumanKnotCourse.ICourse => {
    const times: number[] = to > from ? [from, (from + to) / 2, to] : [from];
    let near: IAutoMovieQuaternion | undefined;
    const knots: HumanKnot.IKnot[] = times.map(
      (t: number): HumanKnot.IKnot => {
        const bones: ReturnType<typeof poseBones> = poseBones(
          body,
          resolveHumanPosture.seeded(body, plan.posture(t)).pose,
        );
        const wrist: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
        const elbow: IAutoMovieResolvedBone = bones.get(`${side}LowerArm`)!;
        const q: IAutoMovieQuaternion = wrist.worldRotation;
        const sign: number =
          near !== undefined &&
          q.x * near.x + q.y * near.y + q.z * near.z + q.w * near.w < 0
            ? -1
            : 1;
        near = { x: sign * q.x, y: sign * q.y, z: sign * q.z, w: sign * q.w };
        return {
          position: [
            wrist.worldPosition.x,
            wrist.worldPosition.y,
            wrist.worldPosition.z,
            near.x,
            near.y,
            near.z,
            near.w,
            elbow.worldPosition.x,
            elbow.worldPosition.y,
            elbow.worldPosition.z,
          ],
          dwell: 0,
        };
      },
    );
    return prepareHumanKnotCourse(knots, { kind: "fixed", times });
  };
  const schedule = (side: AutoMovieHumanSide): ISeat[] => {
    const own: ILadderAccessGrip[] = grips.filter(
      (grip: ILadderAccessGrip): boolean => grip.side === side,
    );
    return own.map((grip: ILadderAccessGrip, index: number): ISeat => {
      const from: number = grip.window.from * plan.duration;
      const to: number = grip.window.to * plan.duration;
      const before: number =
        index === 0 ? 0 : own[index - 1]!.window.to * plan.duration;
      const after: number =
        index === own.length - 1
          ? plan.duration
          : own[index + 1]!.window.from * plan.duration;
      // A grip the body holds behind its shoulder, as it does from the landing,
      // keeps the support law's own held-hand fit, which meets the target.
      const middle: IAutoMovieMotionHumanPosture = plan.posture(
        (from + to) / 2,
      );
      const shoulder: IAutoMovieVector3 = poseBones(
        body,
        resolveHumanPosture.seeded(body, middle).pose,
      ).get(`${side}UpperArm`)!.worldPosition;
      const behind: boolean =
        Vector3.dot(
          Vector3.subtract(grip.point, shoulder),
          HumanFrame.forward(middle.yaw),
        ) < 0;
      const prepare: number = Math.min(SEAT, (from - before) / 2);
      const leave: number = Math.min(SEAT, (after - to) / 2);
      return {
        grip,
        from,
        to,
        behind,
        prepare,
        leave,
        onto: hand(side, from - prepare, from),
        off: hand(side, to, to + leave),
      };
    });
  };
  const tracks: Record<AutoMovieHumanSide, ISeat[]> = {
    left: schedule("left"),
    right: schedule("right"),
  };

  return (
    seconds: number,
    ...rest: SampleRest
  ): IAutoMovieMotionHumanPosture => {
    const channels: SampleRest[0] = rest[0];
    const posture: IAutoMovieMotionHumanPosture = plan.posture(
      seconds,
      ...rest,
    );
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const side of ["left", "right"] as const) {
      const arm: AutoMovieHumanLimb = `${side}Arm`;
      if (channels !== undefined && !channels.includes(arm)) continue;
      const active: ISeat | undefined = tracks[side].find(
        (seat: ISeat): boolean =>
          seconds >= seat.from - seat.prepare &&
          seconds <= seat.to + seat.leave,
      );
      if (active === undefined || active.behind) continue;
      const target: IAutoMovieHumanLimbGoal = active.grip.rail
        ? AutoMovieMotionHumanArmTarget.fromWrist(
            rails[side](posture).place(active.grip.point),
            AutoMovieMotionHumanBend.arm(body, posture, side, "hang"),
            offsets[side],
          )
        : rung(side, posture, active.grip.point);
      if (seconds >= active.from && seconds <= active.to) {
        limbs[arm] = { ...target, planted: true };
        continue;
      }
      const weight: number = minimumJerk.share(
        seconds < active.from
          ? 1 - (active.from - seconds) / active.prepare
          : 1 - (seconds - active.to) / active.leave,
      );
      if (weight === 0) continue;
      const c: number[] = (seconds < active.from ? active.onto : active.off)
        .position(seconds);
      const wrist: IAutoMovieVector3 = { x: c[0]!, y: c[1]!, z: c[2]! };
      const turned: IAutoMovieQuaternion = Quaternion.normalize({
        x: c[3]!,
        y: c[4]!,
        z: c[5]!,
        w: c[6]!,
      });
      const elbow: IAutoMovieVector3 = { x: c[7]!, y: c[8]!, z: c[9]! };
      limbs[arm] = {
        ...target,
        point: Vector3.lerp(wrist, target.point, weight),
        rotation: Quaternion.slerp(turned, target.rotation!, weight),
        bend: Vector3.lerp(elbow, target.bend!, weight),
      };
    }
    return { ...posture, limbs };
  };
}

/** The posture reader's arguments after the time. */
type SampleRest =
  Parameters<IAutoMovieMotionHumanActionPlan["posture"]> extends [
    number,
    ...infer Rest,
  ]
    ? Rest
    : never;

/** A grip with its window and easing in plan seconds. */
interface ISeat {
  /** The grip. */
  grip: ILadderAccessGrip;

  /** Its window's start, seconds. */
  from: number;

  /** Its window's end, seconds. */
  to: number;

  /** Whether the grip is held behind the body, left to the support law's fit. */
  behind: boolean;

  /** The easing onto it before the start, seconds. */
  prepare: number;

  /** The easing off it after the end, seconds. */
  leave: number;

  /**
   * The route's wrist position, wrist rotation and elbow position over the
   * easing onto the grip (`hand`).
   */
  onto: prepareHumanKnotCourse.ICourse;

  /** The same over the easing off it. */
  off: prepareHumanKnotCourse.ICourse;
}

import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
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

import { AutoMovieMotionHumanArmCourse } from "../../compose/internal/AutoMovieMotionHumanArmCourse";
import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { PreparedHumanIntervals } from "../../perform/internal/PreparedHumanIntervals";
import { HumanArmTrajectoryTerms } from "../../posture/internal/HumanArmTrajectoryTerms";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { HumanHandTarget } from "../../posture/internal/HumanHandTarget";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanSampledCourse } from "../../posture/internal/prepareHumanSampledCourse";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import type { ILadderAccessGrip } from "./ILadderAccessGrip";
import { climbLadderHands } from "./climbLadderHands";

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
  // eases from or into: solved here at knots AutoKnots places over the window
  // (Vitenti et al. 2024, arXiv:2412.13423) to the limb solver's millimetre
  // (`HumanArmTrajectoryTerms.TOLERANCE`) and read between them from a knot
  // course (`prepareHumanSampledCourse`), so a read resolves no posture. The
  // wrist's rotation is taken in the hemisphere of its rotation at the
  // window's start, so its components stay continuous whatever order the
  // knots are solved in.
  const hand = (
    side: AutoMovieHumanSide,
    from: number,
    to: number,
  ): ((seconds: number) => number[]) => {
    const bonesAt: (t: number) => ReturnType<typeof poseBones> = (
      t: number,
    ): ReturnType<typeof poseBones> =>
      poseBones(body, resolveHumanPosture.seeded(body, plan.posture(t)).pose);
    const start: IAutoMovieQuaternion = bonesAt(from).get(
      `${side}Hand`,
    )!.worldRotation;
    return prepareHumanSampledCourse({
      from,
      to,
      sample: (t: number): number[] => {
        const bones: ReturnType<typeof poseBones> = bonesAt(t);
        const wrist: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
        const elbow: IAutoMovieResolvedBone = bones.get(`${side}LowerArm`)!;
        const q: IAutoMovieQuaternion = wrist.worldRotation;
        const sign: number =
          q.x * start.x + q.y * start.y + q.z * start.z + q.w * start.w < 0
            ? -1
            : 1;
        return [
          wrist.worldPosition.x,
          wrist.worldPosition.y,
          wrist.worldPosition.z,
          sign * q.x,
          sign * q.y,
          sign * q.z,
          sign * q.w,
          elbow.worldPosition.x,
          elbow.worldPosition.y,
          elbow.worldPosition.z,
        ];
      },
      tolerance: {
        kind: "absolute",
        absolute: HumanArmTrajectoryTerms.TOLERANCE / 1000,
      },
      step: AutoMovieMotionHumanArmCourse.STEP,
    });
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
        target:
          grip.rung === undefined
            ? rung
            : climbLadderHands(
                body,
                grip.rung.normal,
                Vector3.scale(grip.rung.axis, -1),
              ),
      };
    });
  };
  const tracks: Record<AutoMovieHumanSide, ISeat[]> = {
    left: schedule("left"),
    right: schedule("right"),
  };
  const index = (
    side: AutoMovieHumanSide,
  ): ((seconds: number) => ISeat | undefined) => {
    const lookup = PreparedHumanIntervals.first(
      tracks[side].map(
        (seat: ISeat): { from: number; to: number; seat: ISeat } => ({
          from: seat.from - seat.prepare,
          to: seat.to + seat.leave,
          seat,
        }),
      ),
    );
    return (seconds: number): ISeat | undefined => lookup(seconds)?.seat;
  };
  const activeTrack: Record<AutoMovieHumanSide, ReturnType<typeof index>> = {
    left: index("left"),
    right: index("right"),
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
      const active: ISeat | undefined = activeTrack[side](seconds);
      if (active === undefined || active.behind) continue;
      const target: IAutoMovieHumanLimbGoal = active.grip.rail
        ? AutoMovieMotionHumanArmTarget.fromWrist(
            rails[side](posture).place(active.grip.point),
            AutoMovieMotionHumanBend.arm(body, posture, side, "hang"),
            offsets[side],
          )
        : active.target(side, posture, active.grip.point);
      if (seconds >= active.from && seconds <= active.to) {
        limbs[arm] = { ...target, planted: true };
        continue;
      }
      const weight: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        seconds < active.from
          ? 1 - (active.from - seconds) / active.prepare
          : 1 - (seconds - active.to) / active.leave,
      );
      if (weight === 0) continue;
      const c: number[] = (seconds < active.from ? active.onto : active.off)(
        seconds,
      );
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

/**
 * The longest easing onto or off a grip outside its window, seconds
 * (provisional).
 */
const SEAT: number = 0.12;

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
  /** The prepared grip writer for this rung. */
  target: ReturnType<typeof climbLadderHands>;

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
  onto: (seconds: number) => number[];

  /** The same over the easing off it. */
  off: (seconds: number) => number[];
}

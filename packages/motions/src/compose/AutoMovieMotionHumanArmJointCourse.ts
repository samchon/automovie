import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { blendHumanJoint } from "../posture/blendHumanJoint";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";
import { AutoMovieMotionHumanArmCourse } from "./AutoMovieMotionHumanArmCourse";
import { AutoMovieMotionHumanArmJointCarry } from "./AutoMovieMotionHumanArmJointCarry";

/**
 * The knot course of a joint-space carry (`AutoMovieMotionHumanArmJointCarry`):
 * the carry solved once, when the action is prepared, at knots on the frame
 * grid of its span (`AutoMovieMotionHumanArmCourse.STEP`) and at its end, from
 * the carry's inputs at each knot, and a second between two knots reading each
 * carried arm's joints blended between theirs (`blendHumanJoint.between`: a
 * ball joint on the shorter arc, a hinge angle by angle), so no read solves
 * the arm's goal or its clearing course.
 *
 * A knot's arm is the held angles where the carry has not left them (share 0),
 * the goal's own solution where it has arrived (share 1), and the carry's
 * blended, cleared arm between. A second whose share is 0 holds the angles it
 * is given; one whose share is 1 returns its posture as it is, the goal for the
 * display to fit; any other second writes the blended knots over the posture it
 * is given and drops the carried arms' goals.
 *
 * @param body The body.
 * @param duration The span's last second, from 0.
 * @param sample The carry's inputs at a second of the span.
 * @returns The carried posture at a second, given that second's inputs.
 */
export function AutoMovieMotionHumanArmJointCourse(
  body: IAutoMovieMotionHumanBody,
  duration: number,
  sample: (seconds: number) => AutoMovieMotionHumanArmJointCourse.IInput,
): AutoMovieMotionHumanArmJointCourse.Course {
  const step: number = AutoMovieMotionHumanArmCourse.STEP;
  const times: number[] = [];
  for (let k: number = 0; k * step < duration - 1e-9; ++k) times.push(k * step);
  times.push(duration);
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const knots: readonly IKnot[] = times.map(
    (t: number): IKnot => knot(body, sample(t), resolution),
  );
  return (
    seconds: number,
    input: AutoMovieMotionHumanArmJointCourse.IInput,
  ): IAutoMovieMotionHumanPosture => {
    const share: number = Math.min(1, Math.max(0, input.share));
    if (share <= 0 || share >= 1)
      return AutoMovieMotionHumanArmJointCarry(
        body,
        input.posture,
        input.from,
        share,
      );
    const t: number = Math.min(duration, Math.max(0, seconds));
    const k: number = Math.min(
      times.length - 2,
      Math.max(0, Math.floor(t / step + 1e-9)),
    );
    const before: IKnot = knots[k]!;
    const after: IKnot = knots[Math.min(k + 1, knots.length - 1)]!;
    const span: number = times[Math.min(k + 1, times.length - 1)]! - times[k]!;
    const u: number = span > 0 ? Math.min(1, Math.max(0, (t - times[k]!) / span)) : 0;
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...input.posture.joints,
    };
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
      ...input.posture.limbs,
    };
    for (const side of SIDES) {
      if (input.from[side] === undefined) continue;
      const a: IAutoMovieMotionHumanArmAngles.IAngles | undefined =
        before[side] ?? after[side];
      const b: IAutoMovieMotionHumanArmAngles.IAngles | undefined =
        after[side] ?? before[side];
      if (a === undefined || b === undefined) continue;
      for (const [bone, from, to] of [
        [`${side}UpperArm`, a.upper, b.upper],
        [`${side}LowerArm`, a.lower, b.lower],
        [`${side}Hand`, a.hand, b.hand],
      ] as const)
        joints[bone as AutoMovieHumanoidBone] = blendHumanJoint.between(
          body,
          bone,
          from,
          to,
        )(u);
      delete limbs[`${side}Arm`];
    }
    return { ...input.posture, joints, limbs };
  };
}

/** Companion types of {@link AutoMovieMotionHumanArmJointCourse}. */
export namespace AutoMovieMotionHumanArmJointCourse {
  /** The carry's inputs at one second. */
  export interface IInput {
    /** The posture, with the goals of the arms to carry. */
    posture: IAutoMovieMotionHumanPosture;

    /** The held angles of each arm to carry. */
    from: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
    >;

    /** How far each arm is from its held angles to its goal. */
    share: number;

    /** The arrival's posture the clearing course is planned against, if fixed. */
    planned?: IAutoMovieMotionHumanPosture;
  }

  /**
   * A prepared course's reader.
   *
   * @param seconds The span's second.
   * @param input The carry's inputs at that second.
   * @returns The carried posture.
   */
  export type Course = (
    seconds: number,
    input: IInput,
  ) => IAutoMovieMotionHumanPosture;
}

/** The arms. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/** One knot: each carried arm's joints there. */
type IKnot = Partial<
  Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
>;

/** The carried arms' joints at one knot. */
function knot(
  body: IAutoMovieMotionHumanBody,
  input: AutoMovieMotionHumanArmJointCourse.IInput,
  resolution: ReturnType<typeof prepareHumanPoseResolution>,
): IKnot {
  const share: number = Math.min(1, Math.max(0, input.share));
  const out: IKnot = {};
  const shown: IAutoMovieMotionHumanPosture | undefined =
    share >= 1
      ? undefined
      : AutoMovieMotionHumanArmJointCarry(
          body,
          input.posture,
          input.from,
          share,
          input.planned,
          resolution,
        );
  const arrived: IAutoMoviePose | undefined =
    share >= 1
      ? resolveHumanPosture.seeded(
          body,
          input.posture,
          undefined,
          undefined,
          resolution,
        ).pose
      : undefined;
  for (const side of SIDES) {
    if (input.from[side] === undefined) continue;
    out[side] =
      arrived !== undefined
        ? AutoMovieMotionHumanArmAngles.angles(arrived, side)
        : {
            ...input.from[side]!,
            upper: shown!.joints[`${side}UpperArm`] ?? input.from[side]!.upper,
            lower: shown!.joints[`${side}LowerArm`] ?? input.from[side]!.lower,
            hand: shown!.joints[`${side}Hand`] ?? input.from[side]!.hand,
          };
  }
  return out;
}

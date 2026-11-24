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
    if (share >= 1) return input.posture;
    if (share <= 0)
      return AutoMovieMotionHumanArmJointCarry(
        body,
        input.posture,
        input.held(),
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
      if (!input.sides.includes(side)) continue;
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

/** Companion types and the plan-side carrier of {@link AutoMovieMotionHumanArmJointCourse}. */
export namespace AutoMovieMotionHumanArmJointCourse {
  /**
   * A plan's joint-space carrier: a plan that carries its arms by
   * `AutoMovieMotionHumanArm.carry` inside its posture carries them through
   * this instead, and its `prepare` solves the knot course from the plan's own
   * posture: each knot second of the span is read once through the posture,
   * whose carry there gives the knot its inputs. Before that every carry is
   * the joint-space carry of its second; after it, the knot course.
   *
   * @param body The body.
   * @returns The carrier.
   */
  export function carrier(body: IAutoMovieMotionHumanBody): ICarrier {
    let course: Course | undefined;
    let recorded: Map<number, IInput> | undefined;
    return {
      carry: (
        seconds: number,
        input: IInput,
        resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
        projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
      ): IAutoMovieMotionHumanPosture => {
        if (recorded !== undefined) {
          recorded.set(seconds, input);
          return input.posture;
        }
        return course === undefined
          ? AutoMovieMotionHumanArmJointCarry(
              body,
              input.posture,
              input.held(),
              input.share,
              input.planned,
              resolution,
              projection,
            )
          : course(seconds, input);
      },
      prepare: (
        duration: number,
        posture: (seconds: number) => unknown,
      ): void => {
        // The knots' inputs, read through the plan's own posture at each
        // knot second; a knot the posture does not carry at keeps the
        // nearest carried one's.
        recorded = new Map();
        const at: (seconds: number) => IInput | undefined = (
          seconds: number,
        ): IInput | undefined => {
          recorded!.clear();
          posture(seconds);
          return recorded!.get(seconds) ?? [...recorded!.values()][0];
        };
        const fallback: IInput = {
          posture: { root: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, roll: 0, joints: {}, limbs: {} },
          sides: [],
          held: (): Partial<Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>> => ({}),
          share: 1,
        };
        try {
          const inputs: Map<number, IInput> = new Map();
          const step: number = AutoMovieMotionHumanArmCourse.STEP;
          for (let k: number = 0; k * step < duration - 1e-9; ++k)
            inputs.set(k * step, at(k * step) ?? fallback);
          inputs.set(duration, at(duration) ?? fallback);
          recorded = undefined;
          course = AutoMovieMotionHumanArmJointCourse(
            body,
            duration,
            (seconds: number): IInput => inputs.get(seconds) ?? fallback,
          );
        } finally {
          recorded = undefined;
        }
      },
    };
  }

  /** A plan's joint-space carrier (`carrier`). */
  export interface ICarrier {
    /**
     * The carried posture at a second: the knot course once prepared, the
     * joint-space carry of the second before.
     *
     * @param seconds The plan's second.
     * @param input The carry's inputs there.
     * @param resolution Optional same-body FK source.
     * @param projection Optional same-body ROM projector.
     * @returns The posture.
     */
    carry(
      seconds: number,
      input: IInput,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
    ): IAutoMovieMotionHumanPosture;

    /**
     * Solve the knot course from the plan's own posture over its span.
     *
     * @param duration The span's last second, from 0.
     * @param posture The plan's posture, read at each knot second.
     */
    prepare(duration: number, posture: (seconds: number) => unknown): void;
  }

  /** The carry's inputs at one second. */
  export interface IInput {
    /** The posture, with the goals of the arms to carry. */
    posture: IAutoMovieMotionHumanPosture;

    /** The arms to carry. */
    sides: readonly AutoMovieHumanSide[];

    /**
     * The held angles of each arm to carry, read where the carry leaves
     * them: before the course is prepared, at its knots and where the share
     * is 0.
     *
     * @returns The angles by arm.
     */
    held(): Partial<
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
  const held: Partial<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
  > = share >= 1 ? {} : input.held();
  const shown: IAutoMovieMotionHumanPosture | undefined =
    share >= 1
      ? undefined
      : AutoMovieMotionHumanArmJointCarry(
          body,
          input.posture,
          held,
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
    if (!input.sides.includes(side)) continue;
    const from: IAutoMovieMotionHumanArmAngles.IAngles | undefined = held[side];
    if (arrived !== undefined)
      out[side] = AutoMovieMotionHumanArmAngles.angles(arrived, side);
    else if (from !== undefined)
      out[side] = {
        ...from,
        upper: shown!.joints[`${side}UpperArm`] ?? from.upper,
        lower: shown!.joints[`${side}LowerArm`] ?? from.lower,
        hand: shown!.joints[`${side}Hand`] ?? from.hand,
      };
  }
  return out;
}

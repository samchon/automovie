import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { prepareHumanKnotCourse } from "../posture/prepareHumanKnotCourse";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";
import { AutoMovieMotionHumanArmJointCarry } from "./AutoMovieMotionHumanArmJointCarry";

/**
 * The knot course of a joint-space carry (`AutoMovieMotionHumanArmJointCarry`):
 * the carry solved once, when the action is prepared, at its branch points
 * alone (the ends of each of the carry's ramps, the ramp's centre, and every
 * instant its law names where the carried goal changes), and each carried arm's
 * nine joint angles joined through those knots by the minimum-jerk path at the
 * knots' own seconds (Flash and Hogan 1985, `prepareHumanKnotCourse` with a
 * fixed timing), so no read solves the arm's goal or its clearing course.
 *
 * A knot's arm is the held angles where the carry has not left them (share 0),
 * the goal's own solution where it has arrived (share 1), and the carry's
 * blended, cleared arm between. Each angle is unwrapped against the knot before
 * it, so a twist through ±180 degrees takes the short way. A second whose share
 * is 1 returns its posture as it is, the goal for the display to fit; any other
 * second writes the course's angles over the posture it is given and drops the
 * carried arms' goals.
 *
 * @param body The body.
 * @param knots The carry's branch points: each second with its inputs there,
 *   ascending.
 * @returns The carried posture at a second, given that second's posture and
 *   share.
 */
export function AutoMovieMotionHumanArmJointCourse(
  body: IAutoMovieMotionHumanBody,
  knots: readonly AutoMovieMotionHumanArmJointCourse.IKnot[],
): AutoMovieMotionHumanArmJointCourse.Course {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const sides: readonly AutoMovieHumanSide[] = knots[0]?.input.sides ?? [];
  const solved: readonly IArms[] = knots.map(
    (knot: AutoMovieMotionHumanArmJointCourse.IKnot): IArms =>
      arms(body, knot.input, resolution),
  );

  // Each arm's angles as one coordinate vector per knot, unwrapped.
  const courses: Partial<
    Record<AutoMovieHumanSide, prepareHumanKnotCourse.ICourse>
  > = {};
  for (const side of sides) {
    const positions: number[][] = [];
    for (const arm of solved) {
      const at: IAutoMovieMotionHumanArmAngles.IAngles = arm[side]!;
      const raw: number[] = [...at.upper, ...at.lower, ...at.hand];
      const before: number[] | undefined = positions.at(-1);
      positions.push(
        before === undefined
          ? raw
          : raw.map(
              (v: number, i: number): number =>
                v - 360 * Math.round((v - before[i]!) / 360),
            ),
      );
    }
    courses[side] =
      positions.length === 1
        ? undefined
        : prepareHumanKnotCourse(
            positions.map(
              (position: number[]): { position: number[]; dwell: number } => ({
                position,
                dwell: 0,
              }),
            ),
            {
              kind: "fixed",
              times: knots.map(
                (knot: AutoMovieMotionHumanArmJointCourse.IKnot): number =>
                  knot.seconds,
              ),
            },
          );
  }
  return (
    seconds: number,
    posture: IAutoMovieMotionHumanPosture,
    share: number,
  ): IAutoMovieMotionHumanPosture => {
    if (share >= 1) return posture;
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const side of sides) {
      const course: prepareHumanKnotCourse.ICourse | undefined = courses[side];
      const v: readonly number[] =
        course === undefined
          ? [
              ...solved[0]![side]!.upper,
              ...solved[0]![side]!.lower,
              ...solved[0]![side]!.hand,
            ]
          : course.position(seconds);
      const bones: readonly AutoMovieHumanoidBone[] = [
        `${side}UpperArm`,
        `${side}LowerArm`,
        `${side}Hand`,
      ];
      bones.forEach((bone: AutoMovieHumanoidBone, j: number): void => {
        joints[bone] = [v[3 * j]!, v[3 * j + 1]!, v[3 * j + 2]!];
      });
      delete limbs[`${side}Arm`];
    }
    return { ...posture, joints, limbs };
  };
}

/**
 * Companion types and the plan-side carrier of
 * {@link AutoMovieMotionHumanArmJointCourse}.
 */
export namespace AutoMovieMotionHumanArmJointCourse {
  /** The carry's inputs at one second. */
  export interface IInput {
    /** The posture, with the goals of the arms to carry. */
    posture: IAutoMovieMotionHumanPosture;

    /** The arms to carry. */
    sides: readonly AutoMovieHumanSide[];

    /** The held angles of each arm to carry. */
    held: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
    >;

    /** How far each arm is from its held angles to its goal. */
    share: number;

    /** The arrival's posture the clearing course is planned against, if fixed. */
    planned?: IAutoMovieMotionHumanPosture;
  }

  /** One branch point of a carry: its second and its inputs there. */
  export interface IKnot {
    /** The second, on the carry's clock. */
    seconds: number;

    /** The carry's inputs there. */
    input: IInput;
  }

  /**
   * A prepared course's reader.
   *
   * @param seconds The carry's second.
   * @param posture That second's posture, with the carried arms' goals.
   * @param share That second's share.
   * @returns The carried posture.
   */
  export type Course = (
    seconds: number,
    posture: IAutoMovieMotionHumanPosture,
    share: number,
  ) => IAutoMovieMotionHumanPosture;

  /**
   * A plan's joint-space carrier: a plan that carries its arms by
   * `AutoMovieMotionHumanArm.carry` inside its posture carries them through
   * this instead, and its `prepare` solves the knot course from the plan's own
   * posture at the branch points the law names: each is read once through the
   * posture, whose carry there gives the knot its inputs. Before that every
   * carry is the joint-space carry of its second (`solved` false, and the law
   * gives its held angles); after it, the knot course, which reads no held
   * angles.
   *
   * @param body The body.
   * @returns The carrier.
   */
  export function carrier(body: IAutoMovieMotionHumanBody): ICarrier {
    let course: Course | undefined;
    let recorded: Map<number, IInput> | undefined;
    const out: ICarrier = {
      solved: false,
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
              input.held,
              input.share,
              input.planned,
              resolution,
              projection,
            )
          : course(seconds, input.posture, input.share);
      },
      prepare: (
        seconds: readonly number[],
        posture: (seconds: number) => unknown,
      ): void => {
        // The knots' inputs, read through the plan's own posture at each
        // branch point; a branch point the posture does not carry at is no
        // knot.
        recorded = new Map();
        const knots: IKnot[] = [];
        try {
          const instants: number[] = [...new Set<number>(seconds)].sort(
            (a: number, b: number): number => a - b,
          );
          for (const at of instants) {
            recorded.clear();
            posture(at);
            const input: IInput | undefined =
              recorded.get(at) ?? [...recorded.values()][0];
            if (input !== undefined) knots.push({ seconds: at, input });
          }
        } finally {
          recorded = undefined;
        }
        if (knots.length === 0) return;
        course = AutoMovieMotionHumanArmJointCourse(body, knots);
        out.solved = true;
      },
    };
    return out;
  }

  /** A plan's joint-space carrier (`carrier`). */
  export interface ICarrier {
    /**
     * Whether the knot course is solved: from then on a carry reads no held
     * angles, so the law need not give them.
     */
    solved: boolean;

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
     * Solve the knot course from the plan's own posture at its branch points.
     *
     * @param seconds The carry's branch points, ascending.
     * @param posture The plan's posture, read at each branch point.
     */
    prepare(
      seconds: readonly number[],
      posture: (seconds: number) => unknown,
    ): void;
  }
}

/** Each carried arm's angles at one knot. */
type IArms = Partial<
  Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
>;

/** The carried arms' angles at one knot: held, arrived or carried between. */
function arms(
  body: IAutoMovieMotionHumanBody,
  input: AutoMovieMotionHumanArmJointCourse.IInput,
  resolution: ReturnType<typeof prepareHumanPoseResolution>,
): IArms {
  const share: number = Math.min(1, Math.max(0, input.share));
  const pose: IAutoMoviePose | undefined =
    share >= 1
      ? resolveHumanPosture.seeded(
          body,
          input.posture,
          undefined,
          undefined,
          resolution,
        ).pose
      : undefined;
  const carried: IAutoMovieMotionHumanPosture | undefined =
    share >= 1
      ? undefined
      : AutoMovieMotionHumanArmJointCarry(
          body,
          input.posture,
          input.held,
          share,
          input.planned,
          resolution,
        );
  const out: IArms = {};
  for (const side of input.sides) {
    if (pose !== undefined) {
      out[side] = AutoMovieMotionHumanArmAngles.angles(pose, side);
      continue;
    }
    const from: IAutoMovieMotionHumanArmAngles.IAngles | undefined =
      input.held[side];
    if (from === undefined) continue;
    out[side] = {
      upper: carried!.joints[`${side}UpperArm`] ?? from.upper,
      lower: carried!.joints[`${side}LowerArm`] ?? from.lower,
      hand: carried!.joints[`${side}Hand`] ?? from.hand,
    };
  }
  return out;
}

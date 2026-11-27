import { ROM_TOLERANCE } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { prepareHumanAdaptiveKnots } from "../../posture/internal/prepareHumanAdaptiveKnots";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";
import { AutoMovieMotionHumanArmCourse } from "./AutoMovieMotionHumanArmCourse";
import { AutoMovieMotionHumanArmJointCarry } from "./AutoMovieMotionHumanArmJointCarry";

/*
 * The knot course of a joint-space carry (`AutoMovieMotionHumanArmJointCarry`):
 * over each stretch the display reads it on, the carry solved once, when the
 * action is prepared, at knots placed adaptively by AutoKnots (Vitenti et al.
 * 2024, arXiv:2412.13423; `prepareHumanAdaptiveKnots`) and the carried arms'
 * nine joint angles each joined through them by the shared minimum-jerk course
 * (Flash and Hogan 1985), so no read solves the arm's goal or its clearing
 * course. A knot is accepted to the solver's own angular resolution
 * (`ROM_TOLERANCE`, degrees, the paper's criteria in absolute form), and no
 * stretch is knotted finer than the frame grid the display reads
 * (`AutoMovieMotionHumanArmCourse.STEP`).
 *
 * A knot's arm is the held angles where the carry has not left them (share 0),
 * the goal's own solution where it has arrived (share 1), and the carry's
 * blended, cleared arm between. A second whose share is 1 returns its posture
 * as it is, the goal for the display to fit; any other second writes the
 * course's angles over the posture it is given and drops the carried arms'
 * goals.
 * Parameter body: The body.
 * Parameter stretches: The stretches the carry is read on, each its first and last
 * second, ascending and apart.
 * Parameter input: The carry's inputs at a second of a stretch.
 * Returns: The carried posture at a second, given that second's posture and
 * share.
 */
export function AutoMovieMotionHumanArmJointCourse(
  body: IAutoMovieMotionHumanBody,
  stretches: readonly (readonly [number, number])[],
  input: (seconds: number) => AutoMovieMotionHumanArmJointCourse.IInput,
): AutoMovieMotionHumanArmJointCourse.Course {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const kept: readonly (readonly [number, number])[] = stretches.filter(
    ([a, b]: readonly [number, number]): boolean => b > a,
  );
  const sides: readonly AutoMovieHumanSide[] =
    kept.length === 0 ? [] : input(kept[0]![0]).sides;
  const courses: readonly IStretch[] = kept.map(
    ([from, to]: readonly [number, number]): IStretch => ({
      from,
      to,
      knots: prepareHumanAdaptiveKnots({
        from,
        to,
        evaluate: (seconds: number): readonly number[] =>
          angles(body, input(seconds), sides, resolution),
        tolerance: { kind: "absolute", absolute: ROM_TOLERANCE },
        maxKnots:
          Math.ceil((to - from) / AutoMovieMotionHumanArmCourse.STEP) + 1,
      }),
    }),
  );
  return (
    seconds: number,
    posture: IAutoMovieMotionHumanPosture,
    share: number,
  ): IAutoMovieMotionHumanPosture => {
    if (share >= 1 || courses.length === 0) return posture;
    // The stretch that holds the second, else the nearest one.
    const stretch: IStretch = courses.reduce(
      (best: IStretch, c: IStretch): IStretch =>
        distance(c, seconds) < distance(best, seconds) ? c : best,
    );
    const v: readonly number[] = stretch.knots.course.position(
      Math.min(stretch.to, Math.max(stretch.from, seconds)),
    );
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    sides.forEach((side: AutoMovieHumanSide, s: number): void => {
      armBones(side).forEach((bone: AutoMovieHumanoidBone, j: number): void => {
        const k: number = 9 * s + 3 * j;
        joints[bone] = [v[k]!, v[k + 1]!, v[k + 2]!];
      });
      delete limbs[`${side}Arm`];
    });
    return { ...posture, joints, limbs };
  };
}

/*
 * Companion types and the plan-side carrier of
 * AutoMovieMotionHumanArmJointCourse.
 */
export namespace AutoMovieMotionHumanArmJointCourse {
  /*
   * The carry's inputs at one second.
   */
  export interface IInput {
    /*
     * The posture, with the goals of the arms to carry.
     */
    posture: IAutoMovieMotionHumanPosture;

    /*
     * The arms to carry.
     */
    sides: readonly AutoMovieHumanSide[];

    /*
     * The held angles of each arm to carry.
     */
    held: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanArmAngles.IAngles>
    >;

    /*
     * How far each arm is from its held angles to its goal.
     */
    share: number;

    /*
     * The arrival's posture the clearing course is planned against, if fixed.
     */
    planned?: IAutoMovieMotionHumanPosture;
  }

  /*
   * A prepared course's reader.
   * Parameter seconds: The carry's second.
   * Parameter posture: That second's posture, with the carried arms' goals.
   * Parameter share: That second's share.
   * Returns: The carried posture.
   */
  export type Course = (
    seconds: number,
    posture: IAutoMovieMotionHumanPosture,
    share: number,
  ) => IAutoMovieMotionHumanPosture;

  /*
   * A plan's joint-space carrier: a plan that carries its arms by
   * `AutoMovieMotionHumanArm.carry` inside its posture carries them through
   * this instead, and its `prepare` solves the knot course from the plan's own
   * posture over the stretches the law carries on: each knot is read through
   * the posture, whose carry there gives the knot its inputs. Before that every
   * carry is the joint-space carry of its second (`solved` false, and the law
   * gives its held angles); after it, the knot course, which reads no held
   * angles.
   * Parameter body: The body.
   * Returns: The carrier.
   */
  export function carrier(body: IAutoMovieMotionHumanBody): ICarrier {
    let course: Course | undefined;
    let recorded: IInput | undefined;
    let recording: boolean = false;
    const out: ICarrier = {
      solved: false,
      carry: (
        seconds: number,
        input: IInput,
        resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
        projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
      ): IAutoMovieMotionHumanPosture => {
        if (recording) {
          recorded = input;
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
        stretches: readonly (readonly [number, number])[],
        posture: (seconds: number) => IAutoMovieMotionHumanPosture,
      ): void => {
        // A knot's inputs, read through the plan's own posture at its second;
        // a second the posture does not carry at shows the arms as the
        // posture gives them, the carried arms those of its middle's carry.
        const probe = (
          seconds: number,
        ): [IInput | undefined, IAutoMovieMotionHumanPosture] => {
          recording = true;
          recorded = undefined;
          let shown: IAutoMovieMotionHumanPosture;
          try {
            shown = posture(seconds);
          } finally {
            recording = false;
          }
          return [recorded, shown];
        };
        const kept: (readonly [number, number])[] = stretches.filter(
          ([a, b]: readonly [number, number]): boolean => b > a,
        );
        const sides: readonly AutoMovieHumanSide[] =
          kept.length === 0
            ? []
            : (probe((kept[0]![0] + kept[0]![1]) / 2)[0]?.sides ?? []);
        const read = (seconds: number): IInput => {
          const [input, shown]: [
            IInput | undefined,
            IAutoMovieMotionHumanPosture,
          ] = probe(seconds);
          return input ?? { posture: shown, sides, held: {}, share: 1 };
        };
        course = AutoMovieMotionHumanArmJointCourse(body, stretches, read);
        out.solved = true;
      },
    };
    return out;
  }

  /*
   * A plan's joint-space carrier (`carrier`).
   */
  export interface ICarrier {
    /*
     * Whether the knot course is solved: from then on a carry reads no held
     * angles, so the law need not give them.
     */
    solved: boolean;

    /*
     * The carried posture at a second: the knot course once prepared, the
     * joint-space carry of the second before.
     * Parameter seconds: The plan's second.
     * Parameter input: The carry's inputs there.
     * Parameter resolution: Optional same-body FK source.
     * Parameter projection: Optional same-body ROM projector.
     * Returns: The posture.
     */
    carry(
      seconds: number,
      input: IInput,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
    ): IAutoMovieMotionHumanPosture;

    /*
     * Solve the knot course from the plan's own posture over the stretches it
     * carries on.
     * Parameter stretches: The stretches, each its first and last second, ascending
     * and apart.
     * Parameter posture: The plan's posture, read at each knot.
     */
    prepare(
      stretches: readonly (readonly [number, number])[],
      posture: (seconds: number) => IAutoMovieMotionHumanPosture,
    ): void;
  }
}

/*
 * One stretch's knots.
 */
interface IStretch {
  /*
   * The stretch's first second.
   */
  from: number;

  /*
   * Its last second.
   */
  to: number;

  /*
   * Its adaptive knots and their course.
   */
  knots: prepareHumanAdaptiveKnots.IKnots;
}

/*
 * How far a second lies outside a stretch; zero inside it.
 */
function distance(stretch: IStretch, seconds: number): number {
  return Math.max(0, stretch.from - seconds, seconds - stretch.to);
}

/*
 * An arm's three bones, shoulder to hand.
 */
function armBones(side: AutoMovieHumanSide): readonly AutoMovieHumanoidBone[] {
  return [`${side}UpperArm`, `${side}LowerArm`, `${side}Hand`];
}

/*
 * The carried arms' nine angles each at a second, side after side: held,
 * arrived or carried between; an arm the carry leaves keeps the posture's own.
 */
function angles(
  body: IAutoMovieMotionHumanBody,
  input: AutoMovieMotionHumanArmJointCourse.IInput,
  sides: readonly AutoMovieHumanSide[],
  resolution: ReturnType<typeof prepareHumanPoseResolution>,
): number[] {
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
  const carried: IAutoMovieMotionHumanPosture =
    share >= 1
      ? input.posture
      : AutoMovieMotionHumanArmJointCarry(
          body,
          input.posture,
          input.held,
          share,
          input.planned,
          resolution,
        );
  return sides.flatMap((side: AutoMovieHumanSide): number[] => {
    if (pose !== undefined) {
      const arm: IAutoMovieMotionHumanArmAngles.IAngles =
        AutoMovieMotionHumanArmAngles.angles(pose, side);
      return [...arm.upper, ...arm.lower, ...arm.hand];
    }
    const from: IAutoMovieMotionHumanArmAngles.IAngles | undefined =
      input.held[side];
    return armBones(side).flatMap(
      (bone: AutoMovieHumanoidBone, j: number): number[] => [
        ...(carried.joints[bone] ??
          (from === undefined
            ? (input.posture.joints[bone] ?? [0, 0, 0])
            : [from.upper, from.lower, from.hand][j]!)),
      ],
    );
  });
}

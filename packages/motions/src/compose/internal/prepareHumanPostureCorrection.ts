import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import type { HumanPhysics } from "../../law/internal/HumanPhysics";
import { prepareHumanSampledCourse } from "../../posture/internal/prepareHumanSampledCourse";

/*
 * Prepare a balance correction over a window as a course of the changes it
 * makes, solved in preparation on the posture it corrects.
 *
 * What the correction changes, the root, the heading's three angles and each
 * joint it sets, is the value of a sampled course
 * (`prepareHumanSampledCourse`): AutoKnots (Vitenti et al. 2024,
 * arXiv:2412.13423) places its knots to the caller's requirement, and the
 * shared minimum-jerk path (Flash and Hogan 1985, J. Neurosci. 5(7):1688) joins
 * them. The correction (a constrained fit, a search or a resolve of the posture
 * it reads) runs only at those knots, on the uncorrected posture there. Each
 * second the support or the weight changes at (`marks`) is a forced knot the
 * course passes without stopping. The root's change is read in units of its
 * requirement and each angle's in units of the angle requirement, so one
 * absolute tolerance of one is each coordinate's own requirement.
 *
 * A read adds the course's change at its second to the posture it is given,
 * with no fit, search or resolve; outside the window the posture is left as it
 * is, the correction's weight being none there. The joints coursed are those
 * the correction writes at the window's ends and its forced knots; a joint no
 * knot changes is not written.
 * Parameter upstream: The uncorrected posture at a second.
 * Parameter window: The correction's window.
 * Parameter events: Seconds the correction's support or weight changes at.
 * Parameter correct: The exact correction of a posture at a second.
 * Parameter requirement: The correction's own resolution.
 * Returns: The corrected posture at a second.
 */
export function prepareHumanPostureCorrection(
  upstream: (seconds: number) => IAutoMovieMotionHumanPosture,
  window: NonNullable<HumanPhysics.Window>,
  events: readonly number[],
  correct: (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ) => IAutoMovieMotionHumanPosture,
  requirement: prepareHumanPostureCorrection.IRequirement,
): (
  posture: IAutoMovieMotionHumanPosture,
  seconds: number,
) => IAutoMovieMotionHumanPosture {
  const marks: number[] = prepareHumanPostureCorrection.marks(window, events);
  const solve = (seconds: number): IPair => {
    const before: IAutoMovieMotionHumanPosture = upstream(seconds);
    return { before, after: correct(before, seconds) };
  };

  // The forced knots solved first, the joints they write fixing the course's
  // coordinates; the course samples them again from these solutions.
  const forced: Map<number, IPair> = new Map(
    [window.from, ...marks, window.to].map((t: number): [number, IPair] => [
      t,
      solve(t),
    ]),
  );
  const bones: AutoMovieHumanoidBone[] = [];
  for (const { after } of forced.values())
    for (const bone of Object.keys(after.joints) as AutoMovieHumanoidBone[])
      if (!bones.includes(bone)) bones.push(bone);

  // The joints some knot changes, gathered as the knots are solved.
  const changed: Set<AutoMovieHumanoidBone> = new Set();
  const course: (seconds: number) => number[] = prepareHumanSampledCourse({
    from: window.from,
    to: window.to,
    marks,
    sample: (seconds: number): number[] => {
      const { before, after }: IPair = forced.get(seconds) ?? solve(seconds);
      const value: number[] = [
        (after.root.x - before.root.x) / requirement.root,
        (after.root.y - before.root.y) / requirement.root,
        (after.root.z - before.root.z) / requirement.root,
        (after.yaw - before.yaw) / requirement.angle,
        (after.pitch - before.pitch) / requirement.angle,
        (after.roll - before.roll) / requirement.angle,
      ];
      for (const bone of bones) {
        const a: readonly [number, number, number] =
          before.joints[bone] ?? ZERO;
        const b: readonly [number, number, number] = after.joints[bone] ?? a;
        if (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]) changed.add(bone);
        value.push(
          (b[0] - a[0]) / requirement.angle,
          (b[1] - a[1]) / requirement.angle,
          (b[2] - a[2]) / requirement.angle,
        );
      }
      return value;
    },
    tolerance: { kind: "absolute", absolute: 1 },
    step: requirement.step,
  });
  const written: [AutoMovieHumanoidBone, number][] = bones
    .map(
      (
        bone: AutoMovieHumanoidBone,
        i: number,
      ): [AutoMovieHumanoidBone, number] => [bone, 6 + 3 * i],
    )
    .filter(([bone]: [AutoMovieHumanoidBone, number]): boolean =>
      changed.has(bone),
    );
  return (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    if (seconds < window.from || seconds > window.to) return posture;
    const d: number[] = course(seconds);
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    for (const [bone, k] of written) {
      const a: readonly [number, number, number] = posture.joints[bone] ?? ZERO;
      joints[bone] = [
        a[0] + d[k]! * requirement.angle,
        a[1] + d[k + 1]! * requirement.angle,
        a[2] + d[k + 2]! * requirement.angle,
      ];
    }
    return {
      ...posture,
      root: {
        x: posture.root.x + d[0]! * requirement.root,
        y: posture.root.y + d[1]! * requirement.root,
        z: posture.root.z + d[2]! * requirement.root,
      },
      yaw: posture.yaw + d[3]! * requirement.angle,
      pitch: posture.pitch + d[4]! * requirement.angle,
      roll: posture.roll + d[5]! * requirement.angle,
      joints,
    };
  };
}

/*
 * The forced knots and the requirement of a correction course.
 */
export namespace prepareHumanPostureCorrection {
  /*
   * The resolution a correction is coursed to: the caller's own.
   */
  export interface IRequirement {
    /*
     * The root's, metres.
     */
    root: number;
    /*
     * The heading's and each joint's, degrees.
     */
    angle: number;
    /*
     * The finest knot spacing, seconds: the grid the display reads on.
     */
    step: number;
  }

  /*
   * The forced knots of a correction over a window: its ramps' ends and its
   * support phase's bounds, where its weight changes, and each event, where its
   * support changes, strictly inside the window, ascending and distinct.
   * Parameter window: The correction's window.
   * Parameter events: Seconds the correction's support or weight changes at.
   * Returns: The forced knot seconds.
   */
  export function marks(
    window: NonNullable<HumanPhysics.Window>,
    events: readonly number[],
  ): number[] {
    return [
      window.from + window.ramp.in,
      window.to - window.ramp.out,
      ...(window.phase === undefined
        ? []
        : [window.phase.from, window.phase.to]),
      ...events,
    ]
      .filter((t: number): boolean => t > window.from && t < window.to)
      .sort((a: number, b: number): number => a - b)
      .filter(
        (t: number, i: number, all: number[]): boolean =>
          i === 0 || t > all[i - 1]!,
      );
  }
}

/*
 * A knot's uncorrected and corrected postures.
 */
interface IPair {
  before: IAutoMovieMotionHumanPosture;
  after: IAutoMovieMotionHumanPosture;
}

/*
 * The angles of a joint a posture leaves out.
 */
const ZERO: readonly [number, number, number] = [0, 0, 0];

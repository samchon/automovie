import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import type { HumanPhysics } from "../law/HumanPhysics";
import { prepareHumanSampledCourse } from "../posture/prepareHumanSampledCourse";

/**
 * Prepare a balance correction over a window as a course of the changes it
 * makes, solved in preparation on the posture it corrects.
 *
 * The correction (a constrained fit, a search or a resolve of the posture it
 * reads) runs only at the knots: the window's two ends and its ramps' ends,
 * each given event inside it and the middle of each interval between two of
 * them, on the uncorrected posture there. What it changes, the root, the
 * heading's three angles and each joint it sets, is a coordinate of a knot
 * course (`prepareHumanSampledCourse`, a minimum-jerk path after Flash and Hogan
 * 1985, J. Neurosci. 5(7):1688). A read adds the course's change at its second
 * to the posture it is given, with no fit, search or resolve; outside the
 * window the posture is left as it is, the correction's weight being none
 * there.
 *
 * @param upstream The uncorrected posture at a second.
 * @param window The correction's window.
 * @param events Seconds the correction's support or weight changes at.
 * @param correct The exact correction of a posture at a second.
 * @returns The corrected posture at a second.
 */
export function prepareHumanPostureCorrection(
  upstream: (seconds: number) => IAutoMovieMotionHumanPosture,
  window: NonNullable<HumanPhysics.Window>,
  events: readonly number[],
  correct: (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ) => IAutoMovieMotionHumanPosture,
): (
  posture: IAutoMovieMotionHumanPosture,
  seconds: number,
) => IAutoMovieMotionHumanPosture {
  const times: number[] = prepareHumanPostureCorrection.knots(window, events);
  const pairs: [IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanPosture][] =
    times.map(
      (
        t: number,
      ): [IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanPosture] => {
        const before: IAutoMovieMotionHumanPosture = upstream(t);
        return [before, correct(before, t)];
      },
    );

  // The joints any knot's correction changes.
  const bones: AutoMovieHumanoidBone[] = [];
  for (const [before, after] of pairs)
    for (const bone of Object.keys(after.joints) as AutoMovieHumanoidBone[]) {
      const a: readonly [number, number, number] = before.joints[bone] ?? ZERO;
      const b: readonly [number, number, number] = after.joints[bone]!;
      if (
        !bones.includes(bone) &&
        (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2])
      )
        bones.push(bone);
    }
  const course: (seconds: number) => number[] = prepareHumanSampledCourse.through(
    pairs.map(
      (
        [before, after]: [IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanPosture],
        i: number,
      ): prepareHumanSampledCourse.IKnot => {
        const position: number[] = [
          after.root.x - before.root.x,
          after.root.y - before.root.y,
          after.root.z - before.root.z,
          after.yaw - before.yaw,
          after.pitch - before.pitch,
          after.roll - before.roll,
        ];
        for (const bone of bones) {
          const a: readonly [number, number, number] =
            before.joints[bone] ?? ZERO;
          const b: readonly [number, number, number] = after.joints[bone] ?? a;
          position.push(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        }
        return { seconds: times[i]!, position };
      },
    ),
  );
  return (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    if (seconds < times[0]! || seconds > times[times.length - 1]!)
      return posture;
    const d: number[] = course(seconds);
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    bones.forEach((bone: AutoMovieHumanoidBone, i: number): void => {
      const a: readonly [number, number, number] = posture.joints[bone] ?? ZERO;
      const k: number = 6 + 3 * i;
      joints[bone] = [a[0] + d[k]!, a[1] + d[k + 1]!, a[2] + d[k + 2]!];
    });
    return {
      ...posture,
      root: {
        x: posture.root.x + d[0]!,
        y: posture.root.y + d[1]!,
        z: posture.root.z + d[2]!,
      },
      yaw: posture.yaw + d[3]!,
      pitch: posture.pitch + d[4]!,
      roll: posture.roll + d[5]!,
      joints,
    };
  };
}

/** The knots of a correction course. */
export namespace prepareHumanPostureCorrection {
  /**
   * The knot seconds of a correction over a window: its two ends, its ramps'
   * ends and its support phase's bounds, each event strictly inside it, with
   * the middle of each interval between two of them.
   *
   * @param window The correction's window.
   * @param events Seconds the correction's support or weight changes at.
   * @returns The knot seconds, ascending and distinct.
   */
  export function knots(
    window: NonNullable<HumanPhysics.Window>,
    events: readonly number[],
  ): number[] {
    const inside = (t: number): boolean => t > window.from && t < window.to;
    const marks: number[] = [
      window.from,
      window.to,
      window.from + window.ramp.in,
      window.to - window.ramp.out,
      ...(window.phase === undefined
        ? []
        : [window.phase.from, window.phase.to]),
      ...events,
    ];
    const sorted: number[] = [window.from, ...marks.filter(inside), window.to]
      .sort((a: number, b: number): number => a - b)
      .filter((t: number, i: number, all: number[]): boolean =>
        i === 0 ? true : t > all[i - 1]!,
      );
    const out: number[] = [];
    for (let i: number = 0; i < sorted.length; i++) {
      if (i > 0) out.push((sorted[i - 1]! + sorted[i]!) / 2);
      out.push(sorted[i]!);
    }
    return out;
  }
}

/** The angles of a joint a posture leaves out. */
const ZERO: readonly [number, number, number] = [0, 0, 0];

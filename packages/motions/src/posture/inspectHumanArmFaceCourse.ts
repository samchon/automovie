import { ROM_TOLERANCE, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanArmGeometry } from "./HumanArmGeometry";
import type { HumanArmTrajectory } from "./HumanArmTrajectory";
import type { HumanArmTrajectoryKnots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryPairs } from "./HumanArmTrajectoryPairs";
import { HumanArmTrajectoryTerms } from "./HumanArmTrajectoryTerms";
import { prepareHumanArmCurveSpeed } from "./prepareHumanArmCurveSpeed";

interface IFaceCourse {
  course: HumanArmTrajectory.IAdmitted;
  rates: HumanArmTrajectoryKnots.IRates;
  ready: number;
  recover: number;
  contact: IAutoMovieVector3;
  target(seconds: number): IAutoMovieVector3;
  targetSpeed: number;
}

/** An unchanged course is certified when both records are empty. */
interface IInspection {
  misses: number[];
  uncertain?: { time: number; metres?: number };
  unsupported?: true;
}

/**
 * Inspect a fixed-parent arm's placed tool face against its active contact.
 * The Bernstein rate bounds of the played quintics bound the face's speed by
 * the links' lever arms (Zhang et al. 2007, SIGGRAPH, section 6). Adding the
 * target's analytic speed bounds the residual. Subdivide only when the end
 * errors and that bound leave an interval undecided.
 */
export function inspectHumanArmFaceCourse(props: IFaceCourse): IInspection {
  const { course, rates, ready, recover, contact, target, targetSpeed } = props;
  const { context, x } = course.read;
  const { times } = context;
  const setup = context.setups[0]!;
  const frames = context.frames[0]!;
  const first = times.indexOf(ready);
  const last = times.indexOf(recover);
  if (first < 0 || last <= first)
    return { misses: [], uncertain: { time: ready } };
  const frame = frames[first]!;
  const q = x[0]!;
  const velocities = rates.velocities[0]!;
  const accelerations = rates.accelerations[0]!;
  const trajectory = course.trajectories[0]!;
  const upperLength = Vector3.length(setup.rest.lower.translation);
  const lowerLength = Vector3.length(setup.rest.hand.translation);
  const faceLength = Vector3.length(contact);
  const levers = [
    upperLength + lowerLength + faceLength,
    lowerLength + faceLength,
    faceLength,
  ] as const;
  const radians = Math.PI / 180;
  const bound = prepareHumanArmCurveSpeed(setup, levers);
  if (bound === undefined) return { misses: [], unsupported: true };
  const resolution = ROM_TOLERANCE * radians * levers[0]!;
  const tolerance = HumanArmTrajectoryTerms.TOLERANCE / 1000;
  const misses: number[] = [];
  let uncertain: IInspection["uncertain"];

  const error = (seconds: number): number => {
    const coordinates = HumanArmGeometry.encode(setup, trajectory(seconds));
    const arm = HumanArmGeometry.chain(setup, frame, coordinates);
    return Vector3.distance(
      HumanArmTrajectoryPairs.pad(arm, contact),
      target(seconds),
    );
  };
  let left = error(ready);
  for (let i = first; i < last; ++i) {
    const from = times[i]!;
    const to = times[i + 1]!;
    const at = frames[i + 1]!;
    if (
      !same(at.parent.position, frame.parent.position) ||
      !same(at.parent.rotation, frame.parent.rotation) ||
      at.parent.rotation.w !== frame.parent.rotation.w ||
      (at.shoulder === undefined
        ? frame.shoulder !== undefined
        : frame.shoulder === undefined || !same(at.shoulder, frame.shoulder))
    )
      return { misses: [], unsupported: true };

    const armSpeed = bound(
      [q[i]!, velocities[i]!, accelerations[i]!],
      [q[i + 1]!, velocities[i + 1]!, accelerations[i + 1]!],
      to - from,
    );
    if (armSpeed === undefined) return { misses: [], unsupported: true };
    const speed = targetSpeed + armSpeed;
    const right = error(to);
    if (left > tolerance || right > tolerance)
      return {
        misses: [],
        uncertain:
          left > tolerance
            ? { time: from, metres: left }
            : { time: to, metres: right },
      };
    const pending: IInterval[] = [{ from, to, left, right }];
    left = right;
    while (pending.length !== 0) {
      const interval = pending.pop()!;
      const a = interval.from;
      const b = interval.to;
      const travel = speed * (b - a);
      // The smaller of the two endpoint Lipschitz cones bounds the error.
      if (
        Math.max(
          interval.left,
          interval.right,
          (interval.left + interval.right + travel) / 2,
        ) <= tolerance
      )
        continue;
      const time = a + (b - a) / 2;
      if (!(a < time && time < b)) {
        uncertain ??= { time: a };
        continue;
      }
      const metres = error(time);
      if (metres > tolerance) {
        if (targetSpeed * Math.min(time - from, to - time) > resolution)
          misses.push(time);
        else uncertain ??= { time, metres };
        break;
      }
      // An undecided span as short as the rig can resolve cannot certify.
      if (travel <= resolution) {
        uncertain ??= { time };
        continue;
      }
      pending.push(
        { from: time, to: b, left: metres, right: interval.right },
        { from: a, to: time, left: interval.left, right: metres },
      );
    }
  }
  return { misses, ...(uncertain === undefined ? {} : { uncertain }) };
}

interface IInterval {
  from: number;
  to: number;
  left: number;
  right: number;
}

function same(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}

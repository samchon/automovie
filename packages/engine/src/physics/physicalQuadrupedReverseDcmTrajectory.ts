// Ported from IHMC Open Robotics Software, tag 201903_Stable (Apache-2.0):
// ihmc-quadruped-robotics/src/main/java/us/ihmc/quadrupedRobotics/planning/
// trajectory/PiecewiseReverseDcmTrajectory.java l.39-47, initializeTrajectory
// l.102-134, computeTrajectory l.143-163 and l.165-173; the capacity from
// DCMPlanner.java l.43 and l.105. See NOTICE.
import { physicalQuadrupedStep as Step } from "./physicalQuadrupedStep";

/**
 * IHMC's DCM plan over a piecewise-constant centre of pressure, integrated
 * backward from its final point (`PiecewiseReverseDcmTrajectory`).
 *
 * Each interval's virtual repellent point is its centre of pressure raised by
 * the centre of mass's height h, so the DCM xi obeys xi' = omega (xi - vrp)
 * with omega = sqrt(g / h). The height is floored at 1 mm (l.47, l.172). From
 * the final DCM, each interval's starting DCM is (l.125-131)
 *
 *     xi_i = vrp_i + exp(-omega (t_{i+1} - t_i)) (xi_{i+1} - vrp_i)
 *
 * @param input The intervals' start times, seconds, and centres of pressure,
 *   metres, the final time and DCM, the centre of mass's height over the centre
 *   of pressure, metres, and gravity's magnitude, metres per second squared.
 * @returns The trajectory.
 * @throws {Error} When there are more intervals than the planner's buffer
 *   holds, or fewer start times or points than intervals, as the reference does
 *   (l.108-111).
 */
export function physicalQuadrupedReverseDcmTrajectory(input: {
  times: readonly number[];
  cops: readonly Step.IPoint[];
  finalTime: number;
  finalDcm: Step.IPoint;
  comHeight: number;
  gravity: number;
}): physicalQuadrupedReverseDcmTrajectory.ITrajectory {
  const height: number = Math.max(input.comHeight, 0.001);
  const omega: number = Math.sqrt(input.gravity / height);
  const count: number = input.cops.length;
  if (
    physicalQuadrupedReverseDcmTrajectory.CAPACITY < count ||
    input.times.length < count
  )
    throw new Error("number of steps exceeds the maximum buffer size");

  const times: number[] = [...input.times.slice(0, count), input.finalTime];
  const vrps: Step.IPoint[] = input.cops.map(
    (cop: Step.IPoint): Step.IPoint => ({
      x: cop.x,
      y: cop.y,
      z: cop.z + height,
    }),
  );

  // Integrate backward from the final DCM (l.123-131).
  const dcms: Step.IPoint[] = new Array<Step.IPoint>(count + 1);
  dcms[count] = { ...input.finalDcm };
  for (let i: number = count - 1; i >= 0; i--) {
    const vrp: Step.IPoint = vrps[i]!;
    const after: Step.IPoint = dcms[i + 1]!;
    const decay: number = Math.exp(-omega * (times[i + 1]! - times[i]!));
    dcms[i] = {
      x: (after.x - vrp.x) * decay + vrp.x,
      y: (after.y - vrp.y) * decay + vrp.y,
      z: (after.z - vrp.z) * decay + vrp.z,
    };
  }
  return { times, vrps, dcms, omega };
}

/** The trajectory's shape and evaluation. */
export namespace physicalQuadrupedReverseDcmTrajectory {
  /** A planned DCM trajectory. */
  export interface ITrajectory {
    /** The intervals' start times and the final time, seconds, ascending. */
    times: number[];

    /** Each interval's virtual repellent point, metres. */
    vrps: Step.IPoint[];

    /** The DCM at each of `times`, metres. */
    dcms: Step.IPoint[];

    /** The pendulum's natural frequency, per second. */
    omega: number;
  }

  /** A trajectory's value at a time. */
  export interface ISample {
    /** The DCM, metres. */
    position: Step.IPoint;

    /** Its rate, metres per second. */
    velocity: Step.IPoint;
  }

  /**
   * The most intervals the DCM planner's trajectory holds
   * (`STEP_SEQUENCE_CAPACITY`, DCMPlanner l.43 and l.105).
   */
  export const CAPACITY: number = 50;

  /**
   * The trajectory at a time, clamped to its span (`computeTrajectory`,
   * l.143-163): within interval i, xi = vrp_i + exp(omega (t - t_i)) (xi_i -
   * vrp_i) and xi' = omega (xi - vrp_i).
   *
   * @param trajectory The trajectory.
   * @param time The time, seconds.
   * @returns The DCM and its rate.
   */
  export function evaluate(
    trajectory: Readonly<ITrajectory>,
    time: number,
  ): ISample {
    const times: readonly number[] = trajectory.times;
    const count: number = trajectory.vrps.length;
    const t: number = Math.min(Math.max(time, times[0]!), times[count]!);
    let i: number = count - 1;
    while (i > 0 && !(t >= times[i]!)) i--;

    // Euclid's interpolate(vrp, dcm, e) is (1 - e) vrp + e dcm (l.155-159).
    const vrp: Step.IPoint = trajectory.vrps[i]!;
    const dcm: Step.IPoint = trajectory.dcms[i]!;
    const exponential: number = Math.exp(trajectory.omega * (t - times[i]!));
    const position: Step.IPoint = {
      x: (1 - exponential) * vrp.x + exponential * dcm.x,
      y: (1 - exponential) * vrp.y + exponential * dcm.y,
      z: (1 - exponential) * vrp.z + exponential * dcm.z,
    };
    return {
      position,
      velocity: {
        x: (position.x - vrp.x) * trajectory.omega,
        y: (position.y - vrp.y) * trajectory.omega,
        z: (position.z - vrp.z) * trajectory.omega,
      },
    };
  }
}

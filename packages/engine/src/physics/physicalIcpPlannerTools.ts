// Ported from IHMC Open Robotics Software (Apache-2.0), 201903_Stable:
// ihmc-common-walking-control-modules/src/main/java/us/ihmc/
// commonWalkingControlModules/capturePoint/CapturePointTools.java EPSILON
// l.23, computeDesiredCornerPointsSingleSupport l.601-642,
// computeDesiredCapturePointPosition l.678-685 and
// computeDesiredCapturePointVelocity l.723-733;
// ihmc-robotics-toolkit/src/main/java/us/ihmc/robotics/math/trajectories/
// VelocityConstrainedPositionTrajectoryGenerator.java initializePolynomials
// l.176-181 and compute l.191-231, with YoPolynomial.java
// setInitialPositionVelocityZeroFinalHighOrderDerivatives l.434-453 and
// compute l.622-641; ihmc-robotics-toolkit/src/main/java/us/ihmc/robotics/
// screwTheory/MovingMidFrameZUpFrame.java updateTransformToParent l.37-60,
// the mid-feet frame of ihmc-humanoid-robotics/src/main/java/us/ihmc/
// humanoidRobotics/frames/HumanoidReferenceFrames.java l.141.
// See vendor/ihmc/NOTICE.
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";

/**
 * The closed forms IHMC's 201903 ICP planner builds its plan from, on the
 * engine's floor: points and vectors are world x and z in metres (metres per
 * second for rates), times in seconds and omega the pendulum's rate per second;
 * and the frames its plan points ride on.
 */
export namespace physicalIcpPlannerTools {
  /** A point or vector on the floor: world x and z. */
  export interface IFloor {
    /** World x. */
    x: number;

    /** World z. */
    z: number;
  }

  /** A capture point and its rate. */
  export interface IState {
    /** The capture point, metres. */
    position: IFloor;

    /** Its rate, metres per second. */
    velocity: IFloor;
  }

  /**
   * The distance under which a capture point on its pivot stays there
   * (`CapturePointTools.EPSILON`, l.23), metres.
   */
  export const EPSILON: number = 1.0e-15;

  /**
   * The capture point a time after it was at an initial point over a constant
   * pivot: the pivot plus e^(omega t) times the offset, and its rate omega
   * e^(omega t) times the offset; a capture point within `EPSILON` of the pivot
   * stays with no rate (l.678-685, l.723-733).
   *
   * @param omega The pendulum's rate, per second.
   * @param time The time since the initial point, seconds.
   * @param initial The initial capture point.
   * @param pivot The constant pivot.
   * @returns The capture point and its rate.
   */
  export function capturePoint(
    omega: number,
    time: number,
    initial: IFloor,
    pivot: IFloor,
  ): IState {
    if (!(Math.hypot(initial.x - pivot.x, initial.z - pivot.z) > EPSILON))
      return { position: { ...initial }, velocity: { x: 0, z: 0 } };
    const growth: number = Math.exp(omega * time);
    const rate: number = omega * growth;
    return {
      position: interpolate(pivot, initial, growth),
      velocity: {
        x: (initial.x - pivot.x) * rate,
        z: (initial.z - pivot.z) * rate,
      },
    };
  }

  /**
   * The entry and exit corner points of each single support, computed backward
   * from the next entry pivot with two pivots per support
   * (`computeDesiredCornerPointsSingleSupport` l.601-642): the exit corner lies
   * between the exit pivot and the next entry corner by e^(-omega t_exit), the
   * entry corner between the entry pivot and the exit corner by e^(-omega
   * t_entry), where t_entry is the swing's split share plus the previous
   * transfer's share after its split, and t_exit the rest of the swing plus the
   * next transfer's share before its split. A step without a swing has no
   * corner points and passes its entry pivot back as the next entry corner.
   *
   * @param input The entry and exit pivots, one more than the corners; the
   *   swing durations and swing splits per step; the transfer durations and
   *   transfer splits per step, one more than the steps; the number of corner
   *   pairs; and omega.
   * @returns The entry and exit corner points, undefined where skipped.
   */
  export function cornerPoints(input: {
    entries: readonly IFloor[];
    exits: readonly IFloor[];
    swings: readonly (number | undefined)[];
    swingSplits: readonly number[];
    transfers: readonly number[];
    transferSplits: readonly number[];
    count: number;
    omega: number;
  }): { entries: (IFloor | undefined)[]; exits: (IFloor | undefined)[] } {
    const entries: (IFloor | undefined)[] = new Array<IFloor | undefined>(
      input.count,
    );
    const exits: (IFloor | undefined)[] = new Array<IFloor | undefined>(
      input.count,
    );
    let next: IFloor = input.entries[input.count]!;
    for (let i: number = input.count - 1; i >= 0; i--) {
      const swing: number | undefined = input.swings[i];
      if (swing === undefined) {
        next = input.entries[i]!;
        exits[i] = undefined;
        entries[i] = undefined;
        continue;
      }
      const split: number = input.swingSplits[i]!;
      const onEntry: number =
        swing * split + input.transfers[i]! * (1.0 - input.transferSplits[i]!);
      const onExit: number =
        swing * (1.0 - split) +
        input.transfers[i + 1]! * input.transferSplits[i + 1]!;
      exits[i] = interpolate(
        input.exits[i]!,
        next,
        Math.exp(-input.omega * onExit),
      );
      entries[i] = interpolate(
        input.entries[i]!,
        exits[i]!,
        Math.exp(-input.omega * onEntry),
      );
      next = entries[i]!;
    }
    return { entries, exits };
  }

  /** A cubic per axis from an initial to a final point and rate. */
  export interface ICubic {
    /** The cubic's duration, seconds. */
    duration: number;

    /** The initial point. */
    initial: IFloor;

    /** The initial rate. */
    initialVelocity: IFloor;

    /** The final point. */
    final: IFloor;

    /** The final rate. */
    finalVelocity: IFloor;
  }

  /**
   * A velocity-constrained cubic at a time
   * (`VelocityConstrainedPositionTrajectoryGenerator.compute` l.191-231):
   * before the start the initial point at rest, after the end the final point
   * at rest, a zero duration the initial point and rate, and between the cubic
   * per axis through both points and rates. The cubic's coefficients are the
   * closed-form solution of the reference's four position and velocity rows
   * (`YoPolynomial` l.434-453): a0 = z0, a1 = v0, a2 = (3 (z1 - z0) / T - 2 v0
   *
   * - V1) / T, a3 = (2 (z0 - z1) / T + v0 + v1) / T^2.
   *
   * @param cubic The cubic.
   * @param time The time since its start, seconds.
   * @returns The point and its rate.
   */
  export function cubic(cubic: ICubic, time: number): IState {
    const T: number = cubic.duration;
    if (time < 0.0)
      return { position: { ...cubic.initial }, velocity: { x: 0, z: 0 } };
    if (time > T)
      return { position: { ...cubic.final }, velocity: { x: 0, z: 0 } };
    if (Math.abs(T) <= Number.MIN_VALUE)
      return {
        position: { ...cubic.initial },
        velocity: { ...cubic.initialVelocity },
      };
    const axis = (
      z0: number,
      v0: number,
      z1: number,
      v1: number,
    ): [number, number] => {
      const a2: number = ((3 * (z1 - z0)) / T - 2 * v0 - v1) / T;
      const a3: number = ((2 * (z0 - z1)) / T + v0 + v1) / (T * T);
      return [
        z0 + v0 * time + a2 * time * time + a3 * time * time * time,
        v0 + 2 * a2 * time + 3 * a3 * time * time,
      ];
    };
    const [x, vx] = axis(
      cubic.initial.x,
      cubic.initialVelocity.x,
      cubic.final.x,
      cubic.finalVelocity.x,
    );
    const [z, vz] = axis(
      cubic.initial.z,
      cubic.initialVelocity.z,
      cubic.final.z,
      cubic.finalVelocity.z,
    );
    return { position: { x, z }, velocity: { x: vx, z: vz } };
  }

  /** A capture point and its rate in a frame's own coordinates. */
  export interface IAttached {
    /** The point in the frame, x forward and y to the left, metres. */
    position: Polygon.IPoint;

    /** Its rate in the frame, metres per second. */
    velocity: Polygon.IPoint;
  }

  /**
   * A floor state expressed in a frame, as Euclid's `changeFrame` holds a point
   * and a vector in the frame they are attached to: the point by the frame's
   * transform, the vector by its rotation only.
   *
   * @param frame The frame.
   * @param state The state on the floor.
   * @returns The state in the frame.
   */
  export function attach(frame: Polygon.IFrame, state: IState): IAttached {
    const f: IFloor = frame.forward;
    return {
      position: Polygon.local(frame, state.position),
      velocity: {
        x: state.velocity.x * f.x + state.velocity.z * f.z,
        y: state.velocity.x * f.z - state.velocity.z * f.x,
      },
    };
  }

  /**
   * A state attached to a frame, back on the floor where the frame now is
   * (`setMatchingFrame`): the inverse of `attach` for the frame's current
   * pose.
   *
   * @param frame The frame as it is now.
   * @param attached The state in the frame.
   * @returns The state on the floor.
   */
  export function detach(frame: Polygon.IFrame, attached: IAttached): IState {
    const f: IFloor = frame.forward;
    return {
      position: Polygon.world(frame, attached.position),
      velocity: {
        x: attached.velocity.x * f.x + attached.velocity.y * f.z,
        z: attached.velocity.x * f.z - attached.velocity.y * f.x,
      },
    };
  }

  /**
   * Two states interpolated, position and rate alike
   * (`ICPPlannerSegmentedTrajectoryGenerator` l.423-446).
   *
   * @param a The state at alpha 0.
   * @param b The state at alpha 1.
   * @param alpha The fraction.
   * @returns The interpolated state.
   */
  export function blend(a: IState, b: IState, alpha: number): IState {
    return {
      position: interpolate(a.position, b.position, alpha),
      velocity: interpolate(a.velocity, b.velocity, alpha),
    };
  }

  /**
   * The mid-feet frame between the two soles (`MovingMidFrameZUpFrame` l.37-60,
   * built on the sole frames in `HumanoidReferenceFrames` l.141): its origin
   * halfway between the sole origins, its forward axis perpendicular to the
   * vector from the left sole to the right, turned so that the left sole is on
   * its left. When the soles are within sqrt(1e-7) m of each other the
   * reference keeps the frame's previous rotation (l.55-56); this function
   * keeps the given fallback's.
   *
   * @param left The left sole frame.
   * @param right The right sole frame.
   * @param fallback The frame whose forward axis to keep for coincident soles.
   * @returns The mid-feet frame.
   */
  export function midFeet(
    left: Polygon.IFrame,
    right: Polygon.IFrame,
    fallback: Polygon.IFrame,
  ): Polygon.IFrame {
    const origin: IFloor = interpolate(left.origin, right.origin, 0.5);

    // The reference's x axis is (-v_y, v_x) for v = right - left in its z-up
    // frame, where y is left; on the floor that y is -z, so the axis is
    // (v_z, -v_x) in world x and z.
    const v: IFloor = {
      x: right.origin.x - left.origin.x,
      z: right.origin.z - left.origin.z,
    };
    const axis: IFloor = { x: v.z, z: -v.x };
    const length2: number = axis.x * axis.x + axis.z * axis.z;
    if (length2 < 1.0e-7) return { origin, forward: { ...fallback.forward } };
    const length: number = Math.sqrt(length2);
    return { origin, forward: { x: axis.x / length, z: axis.z / length } };
  }

  /**
   * (1 - alpha) a + alpha b, as Euclid's `interpolate` (a point of the segment
   * for alpha in [0, 1], extrapolated outside it).
   *
   * @param a The point at alpha 0.
   * @param b The point at alpha 1.
   * @param alpha The fraction.
   * @returns The interpolated point.
   */
  export function interpolate(a: IFloor, b: IFloor, alpha: number): IFloor {
    return {
      x: (1.0 - alpha) * a.x + alpha * b.x,
      z: (1.0 - alpha) * a.z + alpha * b.z,
    };
  }
}

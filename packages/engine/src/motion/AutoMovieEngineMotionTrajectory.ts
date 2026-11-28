import { classifyLocomoteGroundDisplacement as classifyLocomoteGroundDisplacementImplementation } from "./internal/classifyLocomoteGroundDisplacement";
import { integrateMotionTrajectory as integrateMotionTrajectoryImplementation } from "./internal/integrateMotionTrajectory";
import { superposeMinimumJerk as superposeMinimumJerkImplementation } from "./internal/superposeMinimumJerk";
import { speedProfile as speedProfileImplementation } from "./internal/speedProfile";
import { speedProfileReach as speedProfileReachImplementation } from "./internal/speedProfileReach";

import { locomoteMotion as locomoteMotionImplementation } from "./internal/locomoteMotion";

import {
  type IAutoMoviePathLocomotion,
  type IAutoMovieFollowPathMotion,
  type IAutoMovieMotion,
  type IAutoMovieVector3,
  type IAutoMovieQuaternion,
  type IAutoMovieTransform,
  type IAutoMovieWarpRoot,
  type IAutoMovieClassifyLocomoteGroundDisplacement,
  type IAutoMovieIntegrateMotionTrajectory,
  type IAutoMovieMotionTrajectoryInterval,
  type IAutoMovieSuperposeMinimumJerk,
  type IAutoMovieSpeedProfile,
} from "@automovie/interface";
import { followPathMotion as followPathMotionImplementation } from "./internal/followPathMotion";
import { timeScaleMotion as timeScaleMotionImplementation } from "./internal/timeScaleMotion";
import { travelMotion as travelMotionImplementation } from "./internal/travelMotion";
import { warpRoot as warpRootImplementation } from "./internal/warpRoot";

/** Public operations for Auto Movie Engine Motion Trajectory. */
export namespace AutoMovieEngineMotionTrajectory {
  /**
   * Progress along a path in time from speed marks: how far a moving thing has
   * gone and how fast it goes at any film second, with its acceleration and
   * braking bounded, in closed form.
   *
   * The path is cut into stretches, each ending at a speed mark. A distance
   * stretch covers a stated length and ends at its mark: from the speed it enters
   * at, the mover accelerates at the profile's acceleration toward the stretch's
   * cap, holds it, and brakes at the profile's deceleration so as to reach the
   * mark exactly at the stretch's end; a stretch too short to reach its cap peaks
   * where accelerating and braking meet. A seconds stretch lasts a stated time
   * and changes speed at a constant rate from its entry to its mark, the one
   * profile two speeds and a duration fix. The mover may start already moving and
   * end still moving, and it holds at the path's start until the profile's first
   * second. A distance stretch entered and left at its cap holds that speed
   * throughout and reads neither rate, so a path run at one speed needs none; a
   * stretch that changes speed needs the rates it uses. Every phase therefore has
   * a constant acceleration, so distance is quadratic in time and time a square
   * root of distance.
   *
   * A braking phase is evaluated back from its end, so a distance stretch ends at
   * its stretch's length and its mark exactly, with no rounding carried in from
   * the phases before it.
   *
   * @param props The start, the rates and the stretches.
   * @returns The profile.
   * @throws {Error} When the start, a given rate, a speed, a length, a duration
   *   or a cap is not finite or not in its range, a stretch that changes speed
   *   lacks a rate it needs, a distance stretch's mark lies outside what its
   *   length can reach, its cap is below its entry or its mark, or a seconds
   *   stretch changes speed faster than the rates allow.
   */
  export function speedProfile(
    props: IAutoMovieSpeedProfile.IProps,
  ): IAutoMovieSpeedProfile.IProfile {
    return speedProfileImplementation(props);
  }

  /**
   * The speeds a stretch of a length can end at from an entry speed under the
   * rates: from braking all the way to accelerating all the way.
   *
   * @param speed The entry speed, metres per second.
   * @param length The stretch's length, metres.
   * @param acceleration The acceleration, metres per second squared.
   * @param deceleration The braking, metres per second squared.
   * @returns The least and greatest end speed, metres per second; the least is
   *   0 when the stretch is long enough to stop in.
   */
  export function speedProfileReach(
    speed: number,
    length: number,
    acceleration: number,
    deceleration: number,
  ): IAutoMovieSpeedProfile.IReachResult {
    return speedProfileReachImplementation(
      speed,
      length,
      acceleration,
      deceleration,
    );
  }

  /**
   * A point moved by overlapping minimum-jerk units, each adding its own
   * displacement over its own time window.
   *
   * Flash and Henis (1991, J. Cogn. Neurosci. 3:220) and Henis and Flash (1995)
   * found that when a target jumps during a reach, the observed hand path is
   * fitted best by superposing a second minimum-jerk unit, from the old target to
   * the new one, on the unmodified first, rather than by aborting and
   * re-planning; Meyer et al. (1988) model corrective submovements the same way.
   * Because every unit is a quintic with zero velocity and acceleration at its
   * ends, the sum is continuous in position, velocity and acceleration at every
   * unit's start and end, ends at rest at the origin plus every displacement, and
   * equals the first unit alone when a later unit's displacement is zero.
   * position reads only that same accumulated point, omitting derivative profiles
   * and velocity/acceleration/state records. Every unit still receives its
   * original positive-duration check and normalized-time admission; an empty unit
   * list performs no time admission, as in the complete reader.
   *
   * @param origin Where the point starts, metres.
   * @param units Displacements in metres with their start and duration in
   *   seconds.
   * @param seconds The instant.
   * @returns Position (m), velocity (m/s) and acceleration (m/s²).
   */
  export function superposeMinimumJerk(
    origin: IAutoMovieVector3,
    units: readonly IAutoMovieSuperposeMinimumJerk.IUnit[],
    seconds: number,
  ): IAutoMovieSuperposeMinimumJerk.IState {
    return superposeMinimumJerkImplementation.superpose(origin, units, seconds);
  }

  /** Read only the accumulated position of overlapping minimum-jerk units. */
  export function superposeMinimumJerkPosition(
    origin: IAutoMovieVector3,
    units: readonly IAutoMovieSuperposeMinimumJerk.IUnit[],
    seconds: number,
  ): IAutoMovieVector3 {
    return superposeMinimumJerkImplementation.position(origin, units, seconds);
  }

  /**
   * A trajectory planned once and read by time: the solution of `dx/dt = f(t, x)`
   * from `t0` to `t1` by classical fourth-order Runge-Kutta at a fixed step, its
   * knots kept with their derivatives and read between them by cubic Hermite
   * interpolation.
   *
   * The step count is `ceil((t1 - t0) / h)`, the last step shortened to land on
   * `t1` exactly. A state may carry an orientation block, a unit quaternion
   * advanced on the exponential map by the body-frame angular velocity `f`
   * returns, by the fourth-order Runge-Kutta-Munthe-Kaas method: each stage turns
   * the step's start orientation by a rotation vector built from the earlier
   * stages, each stage's body rate is carried to that vector's derivative by the
   * inverse differential of the exponential, and the step turns the start by the
   * stages' weighted vector, renormalised at each knot. Between knots the vector
   * is the cubic Hermite of the two knots' values and derivatives, exact at knots
   * and C1 between; the orientation is the start knot turned by the cubic Hermite
   * of the rotation vector to the end knot, matching both knots' body rates, so a
   * rate read between knots is the motion's and not the step's mean. Reads
   * outside `[t0, t1]` hold the nearer end.
   *
   * Given a `tolerance`, Dormand-Prince 5(4) controls its existing endpoint RMS
   * estimate. Its default continuous extension is quartic; orientation slopes at
   * both ends use the exact right exponential Jacobian. An explicit
   * `rotationDefect` additionally builds the paired quintic continuous extensions
   * of Enright and Hayes and checks their actual body angular velocities in the
   * caller's physical units. The maximum of the existing RMS and physical
   * estimate controls the same step controller. These sampled estimates are not
   * continuous or global-error certificates for an arbitrary pure callback.
   *
   * The output depends on the numeric inputs, pure `f` and optional pure defect
   * callback, never on playback times or order. The default fixed step is a
   * sixtieth of a second; a stiff RHS needs a smaller fixed step or adaptive
   * control. Optional orientation-only playback reads the same solved quaternion
   * without vector interpolation or vector copying, and still returns a fresh
   * quaternion. The caller supplies finite numeric state and rate components.
   * This wrapper checks vector lengths and the presence of an angular rate for an
   * oriented state; it does not validate the components of x0, dx or w for
   * finiteness.
   *
   * @param props The right-hand side, the start state, the interval and the step.
   * @returns The trajectory.
   * @throws {Error} When interval, step, tolerance, partition, failure scope or
   *   defect-mode combination is invalid, a fixed step's count over the interval
   *   is not a safe integer, the state is empty, required rate shape is missing,
   *   a defect is negative/NaN, adaptive refinement reaches time resolution, or
   *   adaptive stepping needs more than DOPRI5's default maximum of 100000 step
   *   attempts. Errors from the pure physical model propagate unchanged.
   */
  export function integrateMotionTrajectory(
    props: IAutoMovieIntegrateMotionTrajectory.IProps,
  ): IAutoMovieIntegrateMotionTrajectory.ITrajectory {
    return integrateMotionTrajectoryImplementation.integrate(props);
  }

  /** Return the default fixed integration step in seconds. */
  export function integrateMotionTrajectoryStep(): number {
    return integrateMotionTrajectoryImplementation.STEP;
  }

  /** The actual fixed Hermite knot data retained by an integrated trajectory. */
  export type IInterval = IAutoMovieMotionTrajectoryInterval;

  /**
   * Bake an admitted in-place gait along an authored world XZ polyline.
   *
   * Supply a finite positive speed in m/s and gait duration in seconds. The
   * corner blend width is a finite nonnegative distance in metres. It defaults
   * to 0.5 m, and zero disables blending. Ground supplies Y independently of
   * waypoint height. Whole gait cycles determine the exact-arrival duration.
   * Facing follows the tangent through the shortest turn and carries the
   * gait's local root offsets with it.
   *
   * Throws for invalid timing, an unrepresentable baked duration, or a path
   * without a usable stretch between adjacent waypoints.
   */
  export function followPathMotion(props: IAutoMovieFollowPathMotion.IProps): IAutoMoviePathLocomotion {
    return followPathMotionImplementation(props);
  }

  /**
   * Multiply an admitted clip's seconds clock by a positive finite factor.
   * Keyframe times, duration and optional stride period/phase scale together;
   * pose and expression values are borrowed and unchanged.
   */
  export function timeScaleMotion(clip: IAutoMovieMotion, k: number): IAutoMovieMotion {
    return timeScaleMotionImplementation(clip, k);
  }

  /**
   * Repeat an admitted in-place clip a positive safe-integer number of cycles and
   * add velocity times global seconds to its root. Velocity uses the receiving
   * motion's metre frame, not necessarily the final staged world frame; optional
   * facing rotates base root translation and orientation.
   */
  export function travelMotion(id: string, base: IAutoMovieMotion, cycles: number, velocity: IAutoMovieVector3, facing?: IAutoMovieQuaternion): IAutoMovieMotion {
    return travelMotionImplementation(id, base, cycles, velocity, facing);
  }

  /**
   * Warp a motion's root so it arrives at a different place and heading by a
   * named instant, leaving the motion's own shape intact.
   *
   * Motion warping (Witkin and Popović, SIGGRAPH 1995) adds a smooth displacement
   * map to a clip so it meets new keyframe constraints. Here the displacement
   * (`translation`, metres, and `yaw`, degrees about +Y) is spread over `[start,
   * end]` seconds by the minimum-jerk profile, so the warp adds no velocity or
   * acceleration discontinuity at either end of the window; before the window the
   * root is the source's, after it the full displacement holds. The yaw turns the
   * root about +Y in the parent frame before the translation is added.
   *
   * @param root The source root at the instant.
   * @param warp The displacement and its window.
   * @param seconds The instant.
   * @returns The warped root.
   */
  export function warpRoot(root: IAutoMovieTransform, warp: IAutoMovieWarpRoot.IWarp, seconds: number): IAutoMovieTransform {
    return warpRootImplementation(root, warp, seconds);
  }

  /**
   * Carry an admitted gait over a positive metre distance in a finite nonzero
   * direction at a requested positive speed. Whole cycles determine duration; a
   * trip shorter than half a nominal stride compresses one cycle, and optional
   * faceTravel aligns model +Z with the horizontal heading.
   */
  export function locomoteMotion(id: string, gait: IAutoMovieMotion, distance: number, speed: number, direction: IAutoMovieVector3, faceTravel?: boolean): IAutoMovieMotion {
    return locomoteMotionImplementation(id, gait, distance, speed, direction, faceTravel);
  }

  /**
   * Classify an admitted finite root displacement in metres into no travel,
   * vertical-only travel or ground-plan travel using the shared locomotion
   * epsilon.
   */
  export function classifyLocomoteGroundDisplacement(displacement: IAutoMovieVector3): IAutoMovieClassifyLocomoteGroundDisplacement.IResult {
    return classifyLocomoteGroundDisplacementImplementation(displacement);
  }
}

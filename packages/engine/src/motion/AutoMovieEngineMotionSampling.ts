import { samplePoseVelocity as samplePoseVelocityImplementation } from "./internal/samplePoseVelocity";
import { sampleMotion as sampleMotionImplementation } from "./internal/sampleMotion";
import { cubicBezierEasing as cubicBezierEasingImplementation } from "./internal/cubicBezierEasing";
import { type IAutoMovieSpringStep, type IAutoMovieSpringParams, type AutoMovieEasing, type IAutoMovieInertializeOffset, type AutoMovieMotionSampleSide, type IAutoMoviePose, type IAutoMoviePoseState, type IAutoMoviePoseRig, type IAutoMoviePoseJointCodec, type IAutoMoviePoseLayer, type IAutoMovieQuaternion, type IAutoMovieVector3, type IAutoMovieMotion, type IAutoMovieMotionSample, type IAutoMovieTransform } from "@automovie/interface";
import { dampedSpring as dampedSpringImplementation } from "./internal/dampedSpring";
import { ease as easeImplementation } from "./internal/ease";
import { inertializeOffset as inertializeOffsetImplementation } from "./internal/inertializeOffset";
import { inertializePose as inertializePoseImplementation } from "./internal/inertializePose";
import { sampleTimes as sampleTimesImplementation } from "./internal/sampleTimes";
import { smoothMinimum as smoothMinimumImplementation } from "./internal/smoothMinimum";
import { windowSampleTimes as windowSampleTimesImplementation } from "./internal/windowSampleTimes";
import { blendPoses as blendPosesImplementation } from "../perform/internal/blendPoses";
import { mergePoses as mergePosesImplementation } from "../perform/internal/mergePoses";

/** Public operations for Auto Movie Engine Motion Sampling. */
export namespace AutoMovieEngineMotionSampling {
  /**
   * Read the pose and its rates from a pure seconds-to-pose function, using a
   * symmetric or one-sided second-order difference. The caller owns the input
   * function, rig and optional same-rig codec.
   *
   * @param sample The pose as a pure function of seconds.
   * @param seconds The instant.
   * @param step The difference interval, seconds; 1 ms by default.
   * @param side Which side to read; both by default.
   * @param rig The rig used for joint angular rates.
   * @param continued Optional function that continues the instant's fitted pose.
   * @param prepared Optional same-rig codec or lazy getter.
   * @returns The pose at the instant and its velocity.
   */
  export function samplePoseVelocity(
    sample: (seconds: number) => IAutoMoviePose,
    seconds: number,
    step: number = 1e-3,
    side: AutoMovieMotionSampleSide = "both",
    rig?: IAutoMoviePoseRig,
    continued?: (seconds: number) => IAutoMoviePose,
    prepared?:
      | IAutoMoviePoseJointCodec.ICodec
      | (() => IAutoMoviePoseJointCodec.ICodec),
  ): IAutoMoviePoseState {
    return samplePoseVelocityImplementation.sample(
      sample,
      seconds,
      step,
      side,
      rig,
      continued,
      prepared,
    );
  }

  /** Return the continued-fit tolerance in degrees for a difference step and decay. */
  export function samplePoseVelocityTolerance(step: number, duration: number): number {
    return samplePoseVelocityImplementation.tolerance(step, duration);
  }

  /** Read the shorter-arc rotation vector of a unit quaternion. */
  export function samplePoseVelocityRotationVector(q: IAutoMovieQuaternion): IAutoMovieVector3 {
    return samplePoseVelocityImplementation.rotationVector(q);
  }

  /**
   * Sample caller-admitted clinical motion at finite seconds using clamped or
   * looping clip time and the outgoing segment's easing. Ordered finite keyframes
   * and valid pose/easing data are validateMotion's premise. End samples
   * shallowly share frame data; interior samples interpolate joints, roots and
   * expressions, treating unauthored values as neutral.
   */
  export function sampleMotion(
    motion: IAutoMovieMotion,
    seconds: number,
  ): IAutoMovieMotionSample {
    return sampleMotionImplementation.sample(motion, seconds);
  }

  /**
   * Sample the clinical pose of admitted motion at clip-local seconds. This
   * uses the full sample's skeleton, joint order, easing and neutral values.
   * Endpoint pose wrappers borrow their key's joints and root.
   */
  export function samplePose(
    motion: IAutoMovieMotion,
    seconds: number,
  ): IAutoMoviePose {
    return sampleMotionImplementation.pose(motion, seconds);
  }

  /** Sample the root of an admitted motion, borrowing endpoint transforms. */
  export function sampleRoot(
    motion: IAutoMovieMotion,
    seconds: number,
  ): IAutoMovieTransform | null {
    return sampleMotionImplementation.root(motion, seconds);
  }



  /**
   * Evaluate a CSS-style cubic Bézier easing `[x1, y1, x2, y2]` at progress `t`.
   *
   * Solves the parametric x(s) = t for the curve parameter `s` (Newton with a
   * bisection fallback), then returns y(s). Endpoints are fixed at (0,0)–(1,1).
   * The caller supplies CSS-legal x controls in [0,1], as validateMotion
   * requires; finite y controls may overshoot the output interval. Progress is
   * clamped to [0,1].
   */
  export function cubicBezierEasing(control: readonly [number, number, number, number], t: number): number {
    return cubicBezierEasingImplementation(control, t);
  }

  /**
   * Advance a one-dimensional damped spring one fixed timestep (semi-implicit
   * Euler): a generic numeric integrator for **secondary motion**, a value that
   * lags, overshoots, and settles toward a moving target instead of snapping to
   * it. Driving a tail or ear joint's angle through this off the animated target
   * gives the follow-through a physics joint produces, while staying a pure,
   * deterministic function (same inputs → same output, replayable
   * frame-for-frame).
   *
   * `force = stiffness·(target − current) − damping·velocity`, integrated as
   * `velocity += force·dt; value += velocity·dt`. Unlike the world-space
   * {@link stepSpring} (VRM SpringBone, for the Node/Channel core), this works in
   * the humanoid pose path's angle space. Finite inputs, nonnegative coefficients
   * and positive dt are required. The caller chooses a timestep appropriate to
   * the coefficients; the explicit step does not guarantee stability for
   * arbitrary dt or prevent arithmetic overflow at extreme magnitudes.
   */
  export function dampedSpring(current: number, velocity: number, target: number, params: IAutoMovieSpringParams, dt: number): IAutoMovieSpringStep {
    return dampedSpringImplementation(current, velocity, target, params, dt);
  }

  /**
   * Evaluate a normalized easing curve: maps a linear progress `t` in `[0, 1]`
   * between two keyframes to an eased progress in `[0, 1]`.
   *
   * Covers the named {@link AutoMovieEasing} curves. `cubicBezier` is handled
   * separately by {@link cubicBezierEasing} since it needs the keyframe's control
   * points; passing `"cubicBezier"` here falls back to linear.
   */
  export function ease(curve: AutoMovieEasing, t: number): number {
    return easeImplementation(curve, t);
  }

  /**
   * The decaying offset of one channel after a transition, by inertialization.
   *
   * Bollo (Inertialization: High-Performance Animation Transitions in Gears of
   * War, GDC 2018) replaces a cross-fade with an offset: at the cut the new
   * motion starts at once, and the difference between the old and the new value
   * (`x0`) and velocity (`v0`) decays to zero over `t1` seconds on a quintic with
   * zero value, velocity and acceleration at `t1`. Written about `s = t1 - t`,
   * that quintic is `x(t) = s^4 (b + c s)` with `b = (5 x0 + v0 t1) / t1^4` and
   * `c = -(4 x0 + v0 t1) / t1^5`: it starts at `x0` with slope `v0`, so the
   * displayed value and velocity are continuous at the cut, and it keeps the sign
   * of `x0` exactly when `b` does, that is when `t1 <= -5 x0 / v0` for a velocity
   * heading toward zero. Bollo's clamp shortens `t1` to that bound, so the offset
   * never overshoots; a velocity heading away needs no clamp. A zero offset
   * leaves the signed lobe `v0 s^4 t / t1^4`, which returns to zero without
   * crossing it.
   *
   * Unlike a critically damped spring, which only approaches zero, the quintic
   * ends at exactly zero at `t1`, so a transition has a finite, known end; it is
   * closed-form in the elapsed time, so any frame can be evaluated alone.
   *
   * The clamp buys its guarantee with acceleration: the quintic starts at `-(8 v0
   * t1 + 20 x0) / t1^2`, which at the clamped time is `4 v0^2 / (5 x0)`, without
   * bound as a channel is cut nearer the instant it passes its target. A channel
   * cut there stops within milliseconds, a step in velocity in all but name. With
   * `through` the clamp is not taken: the same quintic runs the whole `duration`,
   * so its starting acceleration stays within `(8 |v0| duration + 20 |x0|) /
   * duration^2`, and the offset passes through zero and returns, by no more than
   * the velocity in excess of `5 |x0| / duration` times `256 duration / 3125`,
   * the peak of the signed lobe. That is the follow-through of a body that
   * reaches a pose at speed.
   *
   * @param x0 Offset at the cut, any unit.
   * @param v0 Offset velocity at the cut, that unit per second.
   * @param duration Requested decay time `t1`, seconds; positive.
   * @param elapsed Seconds since the cut.
   * @param through Whether an offset heading to zero faster than the decay
   *   absorbs passes through it, bounded as above, instead of stopping short.
   * @returns The offset, its velocity and the decay time used.
   */
  export function inertializeOffset(x0: number, v0: number, duration: number, elapsed: number, through?: boolean): IAutoMovieInertializeOffset.IState {
    return inertializeOffsetImplementation(x0, v0, duration, elapsed, through);
  }

  /**
   * Inertialize a transition between two poses: the target motion plays from the
   * cut, and the source's offset from it decays to zero.
   *
   * At the cut the displayed pose was the source; from then on it is the target
   * plus an offset. Every rotation's offset `q_s q_t^-1` (each joint's
   * articulation and the root's rotation) decays as its rotation vector, per
   * axis, with the angular velocity offset, by {@link inertializeOffset} (Bollo,
   * GDC 2018), and is applied before the target rotation; the root translation
   * decays per axis the same way. Each is therefore continuous in value and
   * velocity at the cut, reaches the target exactly at its own clamped decay time
   * and never overshoots it.
   *
   * A ball joint is blended as a rotation, never per clinical angle: its
   * `[flexion, abduction, twist]` is an Euler chart, and at the chart's gimbal
   * nearly equal rotations have far apart triples, whose per-angle blend swings
   * the bone through poses neither side holds. The blended rotation is lowered to
   * angles through the rig ({@link poseJointCodec}), in the chart its range of
   * motion admits best. A joint with no offset left returns the target's own
   * angles untouched.
   *
   * A hinge or a two-axis joint (`poseJointCodec.ICodec.ball` false) is blended
   * per angle instead, each angle's offset decayed with its rate offset: the
   * rotations its angles span are a lower-dimensional set, and an offset rotation
   * applied to one of them leaves that set, which the lowering would answer with
   * motion on an axis the joint does not have. Its angles have no gimbal inside
   * their range, so the per-angle blend is the faithful one.
   *
   * The result is a pure function of the elapsed time and the target pose at that
   * time, so a caller can evaluate it on any grid. Contact corrections (foot
   * planting, grips) belong after it: an inertialized planted foot would slide in
   * world space (Holden, Dead Blending, 2023).
   *
   * @param source The displayed pose and its velocity at the cut.
   * @param target The target's pose and velocity at the cut.
   * @param duration Requested decay time, seconds; positive.
   * @param through Whether an offset heading to its target faster than the decay
   *   absorbs passes through it and returns, as `inertializeOffset` bounds,
   *   instead of stopping short of it within milliseconds: the "never overshoots"
   *   above is then given up for a bounded acceleration at the cut.
   * @param rig The rig the joints' angles are read through, the one both states'
   *   `spins` were sampled with; the default basis with rest-relative angles when
   *   omitted.
   * @param prepared Optional same-rig codec or lazy getter shared with the actual
   *   source/target rate sampling; the concrete codec retains the existing offset
   *   lifetime.
   * @returns The displayed pose for an elapsed time and the target pose at it.
   */
  export function inertializePose(source: IAutoMoviePoseState, target: IAutoMoviePoseState, duration: number, through?: boolean, rig?: IAutoMoviePoseRig, prepared?: | IAutoMoviePoseJointCodec.ICodec
    | (() => IAutoMoviePoseJointCodec.ICodec)): (elapsed: number, pose: IAutoMoviePose) => IAutoMoviePose {
    return inertializePoseImplementation(source, target, duration, through, rig, prepared);
  }

  /**
   * Return the endpoint-inclusive seconds grid from zero to duration at a
   * positive Hz rate. The window sampler owns grid arithmetic and duplicate-end
   * removal; zero duration returns one instant.
   */
  export function sampleTimes(duration: number, sampleRate: number): number[] {
    return sampleTimesImplementation(duration, sampleRate);
  }

  /**
   * The smaller of two values with the corner where they cross rounded off, so a
   * quantity that follows whichever of two curves is lower changes over from one
   * to the other with a continuous rate.
   *
   * It is the quadratic polynomial smooth minimum: with `h = max(width - |a - b|,
   * 0) / width`, the result is `min(a, b) - h² width / 4`. It equals the plain
   * minimum wherever the two values differ by `width` or more, never exceeds it,
   * and falls below it by at most a quarter of the width, where the two are
   * equal. Its first derivative in either argument is continuous. The larger of
   * two values is the same rule negated: `-smoothMinimum(-a, -b, width)`, which
   * never falls below the plain maximum.
   *
   * @param a The first value.
   * @param b The second value.
   * @param width The difference under which the two blend, in their unit;
   *   positive.
   * @returns The rounded minimum.
   * @throws If a value is not finite or the width is not positive and finite.
   */
  export function smoothMinimum(a: number, b: number, width: number): number {
    return smoothMinimumImplementation(a, b, width);
  }

  /**
   * Sample a finite ordered seconds window at a finite positive Hz rate,
   * retaining both endpoints and coalescing instants that round together. A
   * zero-width window returns one instant; the caller owns the new array.
   */
  export function windowSampleTimes(start: number, end: number, sampleRate: number): number[] {
    return windowSampleTimesImplementation(start, end, sampleRate);
  }

  /**
   * Blend a nonempty list of admitted same-skeleton clinical poses by positive
   * finite weights per non-null axis. Bone order follows first appearance; root
   * is the last owning layer's value, else the last non-null root. The result
   * does not clamp ROM.
   */
  export function blendPoses(layers: IAutoMoviePoseLayer[]): IAutoMoviePose {
    return blendPosesImplementation(layers);
  }

  /**
   * Union a nonempty list of admitted same-skeleton poses by bone with later
   * joints winning. Bone order follows first appearance, root is the last
   * non-null value, and the first pose supplies skeleton identity. Returned
   * joint/root objects are borrowed.
   */
  export function mergePoses(poses: IAutoMoviePose[]): IAutoMoviePose {
    return mergePosesImplementation(poses);
  }
}

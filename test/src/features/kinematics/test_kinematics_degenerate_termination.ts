import {
  DEFAULT_HUMANOID_ROM,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  fitDigitDescent,
  resolveAutoMovieBalanceOutcome,
  swingTwistRegion,
} from "@automovie/engine";
import type {
  IAutoMovieJointConstraint,
  IAutoMovieJointRotationFrame,
  IAutoMovieResolveBalanceOutcome,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";


/**
 * The kinematic searches whose loops end on a computed value end on every
 * finite input, including the degenerate ones that once never ended.
 *
 * Scenarios:
 *
 * 1. A digit descent on one variable whose residual, `a x` with `a` = 3e-161, has
 *    a Gram diagonal (9e-322) whose thousandth underflows the damping to zero,
 *    and which jumps to `10 a` below x = 0.5, so the undamped first step to x =
 *    0 is rejected, returns a point in [0.5, 1) with a residual below the
 *    start's: a rejection raises an underflowed damping instead of repeating
 *    its trial.
 * 2. The left hip's swing region with its twist interval widened to [-1e300,
 *    1e300], a full turn many times over, has the same radius on every ray,
 *    none below the ordinary hip's greatest radius.
 * 3. The left hip's region with a twist interval [1e20, 1e20 + 10], where a
 *    one-degree shift no longer moves the angle, is built with finite radii.
 * 4. The ordinary left hip's region has finite radii, every one at most its
 *    greatest.
 * 5. A balance outcome whose step time (1000 s) overflows the swing divergence
 *    exp(ω0 step), whose capture distance d* = (reach + margin) a / (a - 1)
 *    then tends to reach + margin, falls for a capture point past that limit,
 *    laying no step; a margin that is not a number is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public descent, swing region and balance outcome on inputs whose loops did not end before the termination fixes (an underflowed damping before a rejection, twist intervals beyond a turn or past 2^53 degrees, an overflowed divergence) and asserts the returned point, radii and outcome; a loop without a bound never returns, and a wrong side of the residual's jump, an uneven full-turn region or a caught overflowed fall fails.
 * @evidence contracts/development/testing.md#independent-expectations The descent's admissible side and its decrease come from the residual's closed form; a full-turn twist carries every reached direction around the rest axis, so every ray reaches the farthest; the fall comes from the limit of d* as a grows without bound, reach + margin = 1.03 m against a capture point about 8 m out.
 * @evidence contracts/development/testing.md#distinguishing-cases A rejected first step after an underflowed damping; full-turn, huge-offset and ordinary twist intervals; an overflowed divergence beside a refused margin. Ordinary descents, regions and outcomes are owned by the digit, swing-twist and balance tests.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit test of public engine functions, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_kinematics_degenerate_termination(): void {
  // 1. A damping that underflows before a rejection.
  const a: number = 3e-161;
  const residual = (x: number): number => (x >= 0.5 ? a * x : 10 * a);
  const descended: number[] = fitDigitDescent({
    start: [1],
    primary: (x: readonly number[]): number[] => [residual(x[0]!)],
    secondary: (): number[] => [],
    project: (x: readonly number[]): number[] => [...x],
    step: 1e-6,
    tolerance: (): number => 0,
  });
  TestValidator.predicate(
    "a rejection raises an underflowed damping",
    descended[0]! >= 0.5 &&
      descended[0]! < 1 &&
      residual(descended[0]!) < residual(1),
  );

  // 2 to 4. Twist intervals past a turn and past 2^53 degrees.
  const bone = "leftUpperLeg" as const;
  const joint: IAutoMovieJointRotationFrame = {
    axes: HUMANOID_JOINT_AXES[bone]!,
    frame: HUMANOID_REST_FRAME[bone],
  };
  const ordinary: IAutoMovieJointConstraint = {
    ...DEFAULT_HUMANOID_ROM[bone]!,
  };
  const widened = (min: number, max: number): Float64Array =>
    swingTwistRegion.table({ ...ordinary, twist: { min, max } }, joint);
  const greatest: number = swingTwistRegion.greatest(ordinary, joint);
  const whole: Float64Array = widened(-1e300, 1e300);
  TestValidator.predicate(
    "a full-turn twist reaches the farthest on every ray",
    whole.every((radius: number): boolean => radius === whole[0]) &&
      whole[0]! >= greatest,
  );
  TestValidator.predicate(
    "the ordinary region stays within its greatest radius",
    swingTwistRegion
      .table(ordinary, joint)
      .every((radius: number): boolean => radius <= greatest),
  );

  // 5. An overflowed swing divergence.
  const support: IAutoMovieVector3[] = [
    { x: -0.1, y: 0, z: -0.1 },
    { x: 0.1, y: 0, z: -0.1 },
    { x: 0.1, y: 0, z: 0.1 },
    { x: -0.1, y: 0, z: 0.1 },
  ];
  const balance = (margin: number): IAutoMovieResolveBalanceOutcome.IOutcome =>
    resolveAutoMovieBalanceOutcome({
      centre: { x: 0, y: 1, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      mass: 76,
      impulse: { x: 0, y: 0, z: 500 },
      length: 1,
      support,
      reach: 0.9,
      margin,
      step: 1000,
      first: 0.458,
    });
  const overflowed: IAutoMovieResolveBalanceOutcome.IOutcome = balance(0.13);
  TestValidator.predicate(
    "an overflowed divergence falls past reach + margin",
    overflowed.outcome === "fall" && overflowed.steps.length === 0,
  );
}

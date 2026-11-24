import {
  MotionTrajectoryFailure,
  Quaternion,
  integrateAirborneRotation,
  integrateMotionTrajectory,
  solveAirborneTakeoff,
} from "@automovie/engine";
import type {
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieQuaternion,
  IAutoMovieSolveAirborneTakeoff,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/**
 * Trajectory integration and take-off shooting end on every input, the
 * degenerate ones that once never ended included, and keep their ordinary
 * answers.
 *
 * The body is isotropic, I = 2 kg m² with no relative shape momentum, one
 * second in flight, so one somersault needs Lx = 4 pi (as in
 * test_engine_airborne_takeoff_reuse).
 *
 * Scenarios:
 * 1. A rate whose readings at any two distinct seconds differ by order one
 *    (a hash of the second's bits), under an absolute tolerance of 1e-290
 *    and no relative one, admits only steps near 1e-290 s from time zero,
 *    where the time-resolution guard would let some 4.5e14 such steps pass.
 *    The integration instead refuses after DOPRI5's default of 100000
 *    attempts, so at most 7 * 100001 + 1 rate readings.
 * 2. A fixed step of the least positive double over one second, whose step
 *    count is not a safe integer, is refused before any reading.
 * 3. Shooting refuses a zero, a not-a-number and an infinite tolerance, an
 *    infinite twist request, an infinite flight and, with the fixed seed, a
 *    zero step.
 * 4. Shooting with the least positive tolerance under a zero momentum
 *    ceiling, which no stage can meet and whose resolved share underflows
 *    to zero, ends unmet after a bounded number of stages, each a single
 *    zero-momentum history read: at most the 1075 halvings that take a whole
 *    stage to zero, plus the seed's read.
 * 5. The ordinary request, one somersault with no ceiling at the default
 *    tolerance, is still met at Lx = 4 pi.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public integrator and take-off solver on inputs whose loops did not end before the termination fixes (a tolerance below roundoff, a subnormal fixed step, an underflowing continuation share) and reads their refusals, read counts and solutions; a loop without a bound never returns, and an admission that refuses an ordinary request or accepts a degenerate one fails.
 * @evidence contracts/development/testing.md#independent-expectations The attempt bound is DOPRI5's default nmax (100000) times its six new stages plus the first reading; the stage bound is binary64's 1074 halvings of a whole stage to zero plus one; Lx = 4 pi is I omega = L for an isotropic 2 kg m² body turning once in a second.
 * @evidence contracts/development/testing.md#distinguishing-cases A rejected and an admitted tolerance, each refused input beside the ordinary met request, a tolerance whose share underflows; ordinary integration accuracy is owned by test_engine_motion_trajectory and shooting reuse by test_engine_airborne_takeoff_reuse.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit test of public engine functions with owned callback counters, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the body, the bounds and the five scenarios.
 */
export function test_motion_engine_trajectory_termination(): void {
  // 1. A tolerance below the arithmetic's roundoff.
  const bits: Float64Array = new Float64Array(1);
  const words: Uint32Array = new Uint32Array(bits.buffer);
  const noise = (t: number): number => {
    bits[0] = t;
    let h: number = Math.imul(words[0]! ^ 0x9e3779b9, 0x85ebca6b);
    h = Math.imul(h ^ words[1]! ^ (h >>> 13), 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  let readings: number = 0;
  const rough: IAutoMovieIntegrateMotionTrajectory.IProps = {
    f: (t: number): IAutoMovieIntegrateMotionTrajectory.IRate => {
      readings++;
      return { dx: [noise(t)] };
    },
    x0: [0],
    t0: 0,
    t1: 1,
    tolerance: { relative: 0, absolute: 1e-290 },
  };
  TestValidator.predicate(
    "a tolerance below roundoff ends at DOPRI5's step maximum",
    throwsError((): unknown => integrateMotionTrajectory(rough), "100000") &&
      readings <= 7 * 100001 + 1,
  );

  // 2. A fixed step too fine to count.
  let fixedReadings: number = 0;
  TestValidator.predicate(
    "a subnormal fixed step is refused before reading",
    throwsError(
      (): unknown =>
        integrateMotionTrajectory({
          f: (): IAutoMovieIntegrateMotionTrajectory.IRate => {
            fixedReadings++;
            return { dx: [1] };
          },
          x0: [0],
          t0: 0,
          t1: 1,
          h: Number.MIN_VALUE,
        }),
      "safe-integer",
    ) && fixedReadings === 0,
  );

  // 3. Shooting admissions.
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let starts: number = 0;
  const history: IAutoMovieIntegrateAirborneRotation.IHistory = (
    seconds: number,
  ): IAutoMovieIntegrateAirborneRotation.IInstant => {
    if (seconds === 0) starts++;
    return {
      inertia: { moments: { x: 2, y: 2, z: 2 }, rotation: identity },
      relative: origin,
    };
  };
  const shoot = (
    change: Partial<IAutoMovieSolveAirborneTakeoff.IProps>,
  ): IAutoMovieSolveAirborneTakeoff.ISolution =>
    solveAirborneTakeoff({
      history,
      t0: 0,
      t1: 1,
      q0: identity,
      somersault: 1,
      twist: 0,
      h: 1 / 60,
      ...change,
    });
  for (const [name, change] of [
    ["a zero tolerance", { tolerance: 0 }],
    ["a zero fixed step", { h: 0 }],
  ] as const)
    TestValidator.predicate(
      `shooting refuses ${name}`,
      throwsError((): unknown => shoot(change)),
    );

  for (const scope of [undefined, Symbol("integrator")]) {
    let foreign: unknown;
    try {
      integrateMotionTrajectory({
        f: () => ({ dx: [1] }),
        x0: [0],
        t0: 1,
        t1: 2,
        h: Number.MIN_VALUE,
        tolerance: { absolute: 1e-9, relative: 0 },
        errorScope: scope,
      });
    } catch (error) {
      foreign = error;
    }
    if (!(foreign instanceof MotionTrajectoryFailure))
      throw new Error("expected the inner time-resolution failure");
    const before = Object.getOwnPropertyDescriptors(foreign);
    let reads = 0;
    for (const outer of [undefined, Symbol("airborne")]) {
      let result: unknown;
      try {
        integrateAirborneRotation({
          history: () => {
            ++reads;
            throw foreign;
          },
          t0: 0,
          t1: 1,
          q0: identity,
          momentum: { x: 1, y: 0, z: 0 },
          tolerance: { absolute: 1e-6, relative: 0 },
          errorScope: outer,
        });
      } catch (error) {
        result = error;
      }
      TestValidator.predicate(
        "a nested trajectory keeps its own failure",
        result === foreign,
      );
    }
    TestValidator.equals(
      "foreign failure descriptors remain unchanged",
      Object.getOwnPropertyDescriptors(foreign),
      before,
    );
    TestValidator.equals(
      "unmodified history fails on its first read",
      reads,
      2,
    );
  } // 4. A share that underflows.
  starts = 0;
  const unmet: IAutoMovieSolveAirborneTakeoff.ISolution = shoot({
    tolerance: Number.MIN_VALUE,
    maximum: 0,
  });
  TestValidator.predicate(
    "an underflowing share ends unmet within the halvings to zero",
    unmet.met === false && starts > 0 && starts <= 1075 + 1,
  );

  // 5. The ordinary request.
  const met: IAutoMovieSolveAirborneTakeoff.ISolution = shoot({});
  TestValidator.predicate(
    "one somersault is still met at 4 pi",
    met.met &&
      Math.abs(met.momentum.x - 4 * Math.PI) <=
        2 * solveAirborneTakeoff.TOLERANCE,
  );
}

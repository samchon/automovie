import {
  AutoMovieEngineMotionTrajectoryFailure,
  AutoMovieEngineQuaternion,
  AutoMovieEngineMotionAirborneRotation,
  AutoMovieEngineMotionTrajectory,
} from "@automovie/engine";
import type {
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { dopri5Reference } from "../../internal/dopri5Reference";
import { nclose } from "../../internal/nclose";
import { rotationLogarithm } from "../../internal/rotationLogarithm";
import { throwsError } from "../../internal/throwsError";

/** The fixed step is fourth order: its global error on these flows at 1/60 s. */
const FIXED_STEP_ERROR: number = 1e-8;

/** The adaptive tolerance asked of the controlled integration. */
const TOLERANCE: IAutoMovieIntegrateMotionTrajectory.ITolerance = {
  relative: 1e-10,
  absolute: 1e-10,
};

/** Error budget of the controlled run, summed over its steps. */
const CONTROLLED_ERROR: number = 1e-7;

/**
 * One DOPRI5 step of the decay is tied to its published coefficients within 64
 * roundings.
 */
const DOPRI5_ROUNDING: number = 64 * Number.EPSILON;

/** The finite-difference offset of the knot body-rate stencil, in seconds. */
const OFFSET: number = 1e-5;

/** Agreement of a stencil body rate with the prescribed one, in rad/s. */
const STENCIL: number = 1e-6;

/** Agreement of a dense read with its closed form. */
const DENSE: number = 1e-8;

/** The top's body rate against its closed form, in rad/s. */
const TOP_RATE: number = 1e-6;

/** The orientation's distance from the unit sphere. */
const UNIT_NORM: number = 1e-12;

/** The torque-free symmetric top: I1 = 1, I3 = 2, axial rate 3. */
const TOP: IAutoMovieIntegrateMotionTrajectory.IProps["f"] = (
  _t: number,
  w: readonly number[],
): IAutoMovieIntegrateMotionTrajectory.IRate => ({
  dx: [-w[1]! * w[2]!, w[0]! * w[2]!, 0],
  w: { x: w[0]!, y: w[1]!, z: w[2]! },
});

/** The rate of x' = -x, whose solution is e^-t. */
const decay: IAutoMovieIntegrateMotionTrajectory.IProps["f"] = (
  _t: number,
  x: readonly number[],
): IAutoMovieIntegrateMotionTrajectory.IRate => ({ dx: [-x[0]!] });

/** The refusal message of one run, or null when it runs. */
const refusal: (
  props: Partial<IAutoMovieIntegrateMotionTrajectory.IProps>,
) => boolean = (
  props: Partial<IAutoMovieIntegrateMotionTrajectory.IProps>,
): boolean =>
  throwsError(() =>
    AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({ f: decay, x0: [1], t0: 0, t1: 1, ...props }),
  );

/**
 * `integrateMotionTrajectory` solves x' = f(t, x) and reads the solution at any
 * time.
 *
 * Scenarios:
 *
 * 1. A constant rate x' = 1 from 0 is x = t: 2 at t = 2.
 * 2. X' = -x from 1 is e^-t: e^-1 at t = 1, within the fixed step's error.
 * 3. The oscillator x' = v, v' = -x from (1, 0) is (cos t, -sin t): at t = 1 it is
 *    (cos 1, -sin 1).
 * 4. Under an adaptive tolerance the decay reaches e^-2 at t = 2 on fewer knots
 *    than the fixed grid.
 * 5. The torque-free symmetric top (I1 = 1, I3 = 2, axial rate 3) has body rate
 *    (0.5 cos 3t, 0.5 sin 3t), precessing at (I3 - I1) / I1 times its axial
 *    rate, and its orientation stays a unit quaternion and turns.
 * 6. Halving the step from 0.2 to 0.1 to 0.05 changes the value at 2 by 16 times
 *    as much the first time: the ratio lies between 12 and 20, a fourth order
 *    method.
 * 7. A pulse of width 0.02 s at t = 1 draws steps under a tenth of the shortest
 *    step away from it.
 * 8. One step of 0.4 s or 0.2 s, read at its end and its middle, equals the
 *    published DOPRI5 step and dense output within 64 roundings, and the
 *    observed orders of the halving are 6 at the end and 5 at the middle.
 * 9. Dense reads are owned: x' = v, v' = 6t from (2, -3) is (2 - 3u + u^3, -3 +
 *    3u^2) at u = t clamped to [0, 1], and editing a returned state changes no
 *    later read.
 * 10. The orientation with body rate (2 cos 3t, 3, 2 sin 3t) keeps that rate on
 *     both sides of each interior knot, read by one-sided stencils of offset
 *     1e-5 s.
 * 11. A matrix state `X' = t^5 E01` from the identity is `I + T^6 E01 / 6`.
 *     The test checks its off-diagonal entry at scales 1, 1e-3, and 1e3 using
 *     a relative integration tolerance of 1e-10. Error blocks must partition
 *     the state.
 * 12. A tolerance of 1e-290 against a rate that differs at every second is refused
 *     after the step maximum, and a fixed step of the least positive double
 *     over one second is refused before any reading.
 * 13. A failure of the inner integration (a time-resolution failure, under any
 *     error scope) thrown through a history read of an outer airborne
 *     integration under any outer scope reaches the caller as the same failure
 *     object with its descriptors unchanged, after the two reads.
 * 14. An interval that does not run forward, a non-positive step, a rate of the
 *     wrong length and a zero tolerance are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed, adaptive, and dense integrator cases, their analytic signals, state ownership, and failure behavior.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `integrateMotionTrajectory` with typed rate functions, then examines state, orientation, step grids, and dense reads. It tests malformed inputs, bounded work for sub-resolution requests, and identity preservation when a nested integration failure propagates through airborne integration.
 * @evidence contracts/development/testing.md#independent-expectations The ramp, exponential decay, oscillator, polynomial dense state, and t⁵ matrix entry have analytic results. Halving the fixed step should give an error ratio near 16, while the published DOPRI5 step and dense polynomials predict local orders 6 and 5. Pulse and quaternion stencil checks constrain step placement and continuity separately.
 */
export function test_engine_motion_integrate_motion_trajectory(): void {
  const ramp: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({
      f: (): IAutoMovieIntegrateMotionTrajectory.IRate => ({ dx: [1] }),
      x0: [0],
      t0: 0,
      t1: 2,
    });
  TestValidator.predicate(
    "a ramp",
    nclose(ramp.at(2).x[0]!, 2, FIXED_STEP_ERROR),
  );
  const fixed: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({ f: decay, x0: [1], t0: 0, t1: 2 });
  TestValidator.predicate(
    "decay",
    nclose(fixed.at(1).x[0]!, Math.exp(-1), FIXED_STEP_ERROR),
  );
  const spring: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({
      f: (
        _t: number,
        x: readonly number[],
      ): IAutoMovieIntegrateMotionTrajectory.IRate => ({
        dx: [x[1]!, -x[0]!],
      }),
      x0: [1, 0],
      t0: 0,
      t1: 2,
    });
  const state: number[] = spring.at(1).x;
  TestValidator.predicate(
    "the oscillator",
    nclose(state[0]!, Math.cos(1), FIXED_STEP_ERROR) &&
      nclose(state[1]!, -Math.sin(1), FIXED_STEP_ERROR),
  );
  const controlled: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({
      f: decay,
      x0: [1],
      t0: 0,
      t1: 2,
      tolerance: TOLERANCE,
    });
  TestValidator.predicate(
    "an adaptive run",
    nclose(controlled.at(2).x[0]!, Math.exp(-2), CONTROLLED_ERROR) &&
      controlled.knots < fixed.knots,
  );
  TestValidator.predicate("backward interval", refusal({ t0: 1, t1: 0 }));
  TestValidator.predicate("a zero step", refusal({ h: 0 }));
  TestValidator.predicate(
    "a rate of the wrong length",
    refusal({
      f: (): IAutoMovieIntegrateMotionTrajectory.IRate => ({ dx: [0, 0] }),
    }),
  );
  TestValidator.predicate(
    "a zero tolerance",
    refusal({ tolerance: { relative: 0, absolute: 0 } }),
  );
  const top: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({
      f: TOP,
      x0: [0.5, 0, 3],
      q0: { x: 0, y: 0, z: 0, w: 1 },
      t0: 0,
      t1: 2,
    });
  let topAgrees: boolean = true;
  for (let step: number = 0; step <= 20; ++step) {
    const t: number = step / 10;
    const state: IAutoMovieIntegrateMotionTrajectory.IState = top.at(t);
    topAgrees &&=
      nclose(state.x[0]!, 0.5 * Math.cos(3 * t), TOP_RATE) &&
      nclose(state.x[1]!, 0.5 * Math.sin(3 * t), TOP_RATE) &&
      nclose(
        Math.hypot(state.q!.x, state.q!.y, state.q!.z, state.q!.w),
        1,
        UNIT_NORM,
      );
  }
  TestValidator.predicate(
    "the top precesses and stays unit",
    topAgrees && AutoMovieEngineQuaternion.angle(top.at(0).q!, top.at(2).q!) > 0,
  );
  const at2: (h: number) => number = (h: number): number =>
    AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({ f: decay, x0: [1], t0: 0, t1: 2, h }).at(2)
      .x[0]!;
  const ratio: number = (at2(0.2) - at2(0.1)) / (at2(0.1) - at2(0.05));
  TestValidator.predicate("fourth order", ratio > 12 && ratio < 20);
  const pulsed: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({
      f: (
        t: number,
        x: readonly number[],
      ): IAutoMovieIntegrateMotionTrajectory.IRate => ({
        dx: [-x[0]! + 50 * Math.exp(-(((t - 1) / 0.02) ** 2))],
      }),
      x0: [1],
      t0: 0,
      t1: 2,
      tolerance: { relative: 1e-8, absolute: 1e-8 },
    });
  const spans: [number, number][] = pulsed.times
    .slice(1)
    .map((t: number, index: number): [number, number] => [
      pulsed.times[index]!,
      t - pulsed.times[index]!,
    ]);
  const near: number = Math.min(
    ...spans
      .filter(
        ([start]: [number, number]): boolean => Math.abs(start - 1) < 0.05,
      )
      .map(([, span]: [number, number]): number => span),
  );
  const far: number = Math.min(
    ...spans
      .filter(
        ([start]: [number, number]): boolean => start < 0.5 || start > 1.5,
      )
      .map(([, span]: [number, number]): number => span)
      .slice(1, -1),
  );
  TestValidator.predicate("steps follow the pulse", near < far / 10);
  const once: (h: number) => IAutoMovieIntegrateMotionTrajectory.ITrajectory = (
    h: number,
  ): IAutoMovieIntegrateMotionTrajectory.ITrajectory =>
    AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({
      f: decay,
      x0: [1],
      t0: 0,
      t1: h,
      h,
      tolerance: { relative: 0, absolute: 1 },
    });
  let published: boolean = once(0.4).knots === 2;
  for (const h of [0.4, 0.2])
    for (const theta of [1, 0.5])
      published &&= nclose(
        once(h).at(theta * h).x[0]!,
        dopri5Reference(h, theta),
        DOPRI5_ROUNDING,
      );
  TestValidator.predicate("the published DOPRI5 step", published);
  const order: (theta: number) => number = (theta: number): number =>
    Math.round(
      Math.log2(
        Math.abs(once(0.4).at(0.4 * theta).x[0]! - Math.exp(-0.4 * theta)) /
          Math.abs(once(0.2).at(0.2 * theta).x[0]! - Math.exp(-0.2 * theta)),
      ),
    );
  TestValidator.equals("observed orders", [order(1), order(0.5)], [6, 5]);
  const dense: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({
      f: (
        t: number,
        x: readonly number[],
      ): IAutoMovieIntegrateMotionTrajectory.IRate => ({ dx: [x[1]!, 6 * t] }),
      x0: [2, -3],
      t0: 0,
      t1: 1,
      h: 0.2,
    });
  let owned: boolean = true;
  for (const t of [1.2, 0.375, -1, 0.375]) {
    const u: number = Math.max(0, Math.min(1, t));
    dense.at(t).x[0] = Infinity;
    const read: IAutoMovieIntegrateMotionTrajectory.IState = dense.at(t);
    owned &&=
      nclose(read.x[0]!, 2 - 3 * u + u ** 3, DENSE) &&
      nclose(read.x[1]!, -3 + 3 * u * u, DENSE);
  }
  TestValidator.predicate("owned dense reads", owned);
  const spin: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({
      f: (seconds: number): IAutoMovieIntegrateMotionTrajectory.IRate => ({
        dx: [],
        w: {
          x: 2 * Math.cos(3 * seconds),
          y: 3,
          z: 2 * Math.sin(3 * seconds),
        },
      }),
      x0: [],
      q0: { x: 0, y: 0, z: 0, w: 1 },
      t0: 0,
      t1: 1,
      h: 0.25,
    });
  const quaternionAt: (seconds: number) => IAutoMovieQuaternion = (
    seconds: number,
  ): IAutoMovieQuaternion => spin.at(seconds).q!;
  let stencilHolds: boolean = spin.times.length > 2;
  for (let index: number = 1; index + 1 < spin.times.length; ++index) {
    const knot: number = spin.times[index]!;
    const origin: IAutoMovieQuaternion = quaternionAt(knot);
    for (const direction of [-1, 1]) {
      const near: IAutoMovieVector3 = rotationLogarithm(
        origin,
        quaternionAt(knot + direction * OFFSET),
      );
      const far: IAutoMovieVector3 = rotationLogarithm(
        origin,
        quaternionAt(knot + direction * 2 * OFFSET),
      );
      stencilHolds &&=
        nclose(
          (direction * (4 * near.x - far.x)) / (2 * OFFSET),
          2 * Math.cos(3 * knot),
          STENCIL,
        ) &&
        nclose((direction * (4 * near.y - far.y)) / (2 * OFFSET), 3, STENCIL) &&
        nclose(
          (direction * (4 * near.z - far.z)) / (2 * OFFSET),
          2 * Math.sin(3 * knot),
          STENCIL,
        );
    }
  }
  TestValidator.predicate("body rate on both sides of each knot", stencilHolds);
  let matrixHolds: boolean = true;
  for (const scale of [1, 1e-3, 1e3]) {
    const matrix: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
      AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({
        f: (t: number): IAutoMovieIntegrateMotionTrajectory.IRate => ({
          dx: [0, scale * t ** 5, 0, 0, 0, 0, 0, 0, 0],
        }),
        x0: [scale, 0, 0, 0, scale, 0, 0, 0, scale],
        t0: 0,
        t1: 1,
        tolerance: { relative: 1e-10, absolute: 0, blocks: [9] },
      });
    matrixHolds &&= nclose(matrix.at(1).x[1]! / scale, 1 / 6, TOP_RATE);
  }
  TestValidator.predicate("a matrix state at any scale", matrixHolds);
  TestValidator.predicate(
    "error blocks that do not partition the state",
    [[0], [1.5], [8], []].every((blocks: number[]): boolean =>
      refusal({
        x0: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        tolerance: { relative: 1e-10, absolute: 0, blocks },
      }),
    ),
  );
  let readings: number = 0;
  const bits: Float64Array = new Float64Array(1);
  const words: Uint32Array = new Uint32Array(bits.buffer);
  const noise: (t: number) => number = (t: number): number => {
    bits[0] = t;
    let hash: number = Math.imul(words[0]! ^ 0x9e3779b9, 0x85ebca6b);
    hash = Math.imul(hash ^ words[1]! ^ (hash >>> 13), 0xc2b2ae35);
    hash ^= hash >>> 16;
    return (hash >>> 0) / 4294967296;
  };
  TestValidator.predicate(
    "a tolerance below roundoff ends at the step maximum",
    refusal({
      f: (t: number): IAutoMovieIntegrateMotionTrajectory.IRate => {
        ++readings;
        return { dx: [noise(t)] };
      },
      x0: [0],
      tolerance: { relative: 0, absolute: 1e-290 },
    }) && readings <= 7 * 100001 + 1,
  );
  let fixedReadings: number = 0;
  TestValidator.predicate(
    "a subnormal step is refused before reading",
    refusal({
      f: (): IAutoMovieIntegrateMotionTrajectory.IRate => {
        ++fixedReadings;
        return { dx: [1] };
      },
      h: Number.MIN_VALUE,
    }) && fixedReadings === 0,
  );
  for (const scope of [undefined, Symbol("integrator")]) {
    let foreign: unknown;
    try {
      AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({
        f: (): IAutoMovieIntegrateMotionTrajectory.IRate => ({ dx: [1] }),
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
    if (!(foreign instanceof AutoMovieEngineMotionTrajectoryFailure))
      throw new Error("expected the inner time-resolution failure");
    const before: ReturnType<
      typeof Object.getOwnPropertyDescriptors<AutoMovieEngineMotionTrajectoryFailure>
    > = Object.getOwnPropertyDescriptors(foreign);
    let reads: number = 0;
    let kept: boolean = true;
    for (const outer of [undefined, Symbol("airborne")]) {
      let result: unknown;
      try {
        AutoMovieEngineMotionAirborneRotation.integrate({
          history: (): never => {
            ++reads;
            throw foreign;
          },
          t0: 0,
          t1: 1,
          q0: AutoMovieEngineQuaternion.identity(),
          momentum: { x: 1, y: 0, z: 0 },
          tolerance: { absolute: 1e-6, relative: 0 },
          errorScope: outer,
        });
      } catch (error) {
        result = error;
      }
      kept &&= result === foreign;
    }
    TestValidator.predicate("a nested failure is kept", kept && reads === 2);
    TestValidator.equals(
      "its descriptors are unchanged",
      Object.getOwnPropertyDescriptors(foreign),
      before,
    );
  }
}

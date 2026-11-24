import { integrateMotionTrajectory } from "@automovie/engine";
import type {
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qunit } from "../internal/qunit";

/**
 * A noncommuting orientation's public curve meets its prescribed body rate on
 * both sides of each integration knot.
 *
 * The exact motion q(t)=Rx(2t) Ry(3t) has body angular velocity (2 cos(3t), 3,
 * 2 sin(3t)) radians per second: conjugating the first X rate by Ry(-3t) gives
 * its XZ components. Its changing rate does not commute with the step's
 * accumulated turn. A constant-axis trajectory cannot expose that distinction.
 *
 * At a public knot tau, r(s)=log(q(tau)^-1 q(tau+s)) is a rotation vector
 * expressed in that actual orientation's frame. Its derivative at zero is the
 * prescribed body rate even when the integrated attitude has global error. The
 * one-sided formulas (-4r(-e)+r(-2e))/(2e) and (4r(e)-r(2e))/(2e) cancel the
 * quadratic term. With e=1e-5 s their cubic truncation is O(e squared); the
 * existing trajectory rate bound is 1e-6 rad/s. Relative quaternions and their
 * logarithms are formed here from observed components, without reading
 * integration coefficients or stages.
 *
 * Scenarios:
 *
 * 1. Fixed RK4 and adaptive DP read the same prescribed noncommuting rate. A 0.25
 *    s initial step and a deliberately coarse adaptive local budget expose knot
 *    consistency; global attitude accuracy is not asserted here.
 * 2. Both one-sided rates and their difference satisfy the existing rate bound. An
 *    absent interior knot, nonfinite value, nonunit quaternion or difference
 *    stencil crossing a neighboring knot is an explicit failure.
 * 3. An orientation-only state still returns an owned empty vector. Adding an
 *    element to it changes neither another read nor any array borrowed by the
 *    completed callback; playback makes no new callback calls.
 *
 * This deferred unit does not change either representative sample, its input,
 * its physical tolerance or its execution selection.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the exact noncommuting motion, body frame, independently differentiated rate, one-sided observer, seconds/radian units, unchanged numerical rate bound, stencil precondition and empty-state ownership.
 * @evidence contracts/development/testing.md#behavioral-verification Reads actual public fixed/adaptive orientations at their published knots and nearby instants, then observes body derivatives, C1 agreement, finite/unit values and empty-vector replay after caller mutation.
 * @evidence contracts/development/testing.md#independent-expectations Differentiating Rx(2t) Ry(3t) supplies the body rate. Direct relative-quaternion components and second-order one-sided logarithmic differences observe the curve without its stage rates, dense polynomial, inverse differential or another integrator as oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Changing noncommuting rates distinguish a dense endpoint differential from a commuting constant-axis control; both integration modes, both knot sides, positive interior coverage, explicit observability checks and an orientation-only output distinguish continuity and ownership failures.
 * @evidence contracts/development/testing.md#execution-ownership One deferred CPU unit owns a pure prescribed ODE, callback observations and returned-vector mutation. It starts no runner, compiler, renderer or host and replaces no foreign method.
 */
export function test_motion_engine_trajectory_sampling(): void {
  for (const adaptive of [false, true]) {
    const x0 = [2, -3];
    const issued: IRateWitness[] = [];
    const q0 = { x: 0, y: 0, z: 0, w: 1 };
    const initial: IAutoMovieIntegrateMotionTrajectory.IProps = {
      x0,
      q0,
      t0: 0,
      t1: 1,
      h: 0.2,
      tolerance: adaptive ? { absolute: 1e-10, relative: 1e-10 } : undefined,
      f: (t, x) => {
        const rate: IAutoMovieIntegrateMotionTrajectory.IRate = {
          dx: [x[1]!, 6 * t],
          w: { x: 0, y: 0, z: 0.4 },
        };
        issued.push({ rate, dx: x[1]!, dy: 6 * t });
        return rate;
      },
    };
    const trajectory = integrateMotionTrajectory(initial);
    const independent = integrateMotionTrajectory({ ...initial, x0: [5, 7] });
    const planned = issued.length;
    x0[0] = 100;
    q0.w = 0;
    for (const t of [1.2, 0.375, -1, 0.375]) {
      const u = Math.max(0, Math.min(1, t));
      const held = trajectory.at(t);
      const broken = trajectory.at(t);
      broken.x[0] = Infinity;
      if (broken.q !== null) broken.q.w = Infinity;
      const after = trajectory.at(t);
      const other = independent.at(t);
      TestValidator.predicate(
        "owned position, derivative and body rotation across dense and held reads",
        [after, held].every(
          (s) =>
            Math.abs(s.x[0]! - (2 - 3 * u + u ** 3)) <= 1e-8 &&
            Math.abs(s.x[1]! - (-3 + 3 * u * u)) <= 1e-8 &&
            s.q !== null &&
            Math.abs(s.q.z - Math.sin(0.2 * u)) <= 1e-12 &&
            Math.abs(s.q.w - Math.cos(0.2 * u)) <= 1e-12,
        ) && Math.abs(other.x[0]! - (5 + 7 * u + u ** 3)) <= 1e-8,
      );
    }
    TestValidator.predicate(
      "playback consumes no rates and preserves callback-owned rate records",
      issued.length === planned &&
        issued.every(
          (v) =>
            v.rate.dx[0] === v.dx &&
            v.rate.dx[1] === v.dy &&
            v.rate.w?.z === 0.4,
        ),
    );
  }
  const findings: string[] = [];
  const epsilon: number = 1e-5;
  const limit: number = 1e-6;

  /** Read a local rotation vector from two actual unit orientations. */
  function logarithm(
    at: IAutoMovieQuaternion,
    later: IAutoMovieQuaternion,
  ): IAutoMovieVector3 {
    // Conjugate(at) * later has the same rotation as inverse(at) * later.
    // Its uniform norm factor cancels in atan2 and the axis normalization.
    const x: number =
      at.w * later.x - at.x * later.w - at.y * later.z + at.z * later.y;
    const y: number =
      at.w * later.y + at.x * later.z - at.y * later.w - at.z * later.x;
    const z: number =
      at.w * later.z - at.x * later.y + at.y * later.x - at.z * later.w;
    const w: number =
      at.w * later.w + at.x * later.x + at.y * later.y + at.z * later.z;
    const sine: number = Math.hypot(x, y, z);
    const factor: number =
      (w < 0 ? -1 : 1) *
      (sine === 0 ? 2 : (2 * Math.atan2(sine, Math.abs(w))) / sine);
    return { x: factor * x, y: factor * y, z: factor * z };
  }

  for (const adaptive of [false, true]) {
    const mode: string = adaptive ? "adaptive" : "fixed";
    const borrowed: (readonly number[])[] = [];
    let calls: number = 0;
    const path: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
      integrateMotionTrajectory({
        f: (
          seconds: number,
          state: readonly number[],
        ): IAutoMovieIntegrateMotionTrajectory.IRate => {
          calls++;
          borrowed.push(state);
          if (state.length !== 0)
            findings.push(
              `${mode}: oriented-only callback received vector state`,
            );
          return {
            dx: [],
            w: {
              x: 2 * Math.cos(3 * seconds),
              y: 3,
              z: 2 * Math.sin(3 * seconds),
            },
          };
        },
        x0: [],
        q0: { x: 0, y: 0, z: 0, w: 1 },
        t0: 0,
        t1: 1,
        h: 0.25,
        ...(adaptive ? { tolerance: { relative: 0, absolute: 1e6 } } : {}),
      });
    const plannedCalls: number = calls;

    /** Admit each observed public state before logarithms can hide NaN. */
    function read(seconds: number): IAutoMovieQuaternion | null {
      const state: IAutoMovieIntegrateMotionTrajectory.IState =
        path.at(seconds);
      if (state.x.length !== 0 || state.q === null || !qunit(state.q, 1e-12)) {
        findings.push(`${mode}: invalid orientation-only state at ${seconds}`);
        return null;
      }
      return state.q;
    }

    const interior: readonly number[] = path.times.slice(1, -1);
    if (interior.length === 0)
      findings.push(`${mode}: no interior knot was observed`);
    for (const [index, seconds] of interior.entries()) {
      const before: number = path.times[index]!;
      const after: number = path.times[index + 2]!;
      if (!(seconds - 2 * epsilon > before && seconds + 2 * epsilon < after)) {
        findings.push(`${mode}: unobservable knot stencil at ${seconds}`);
        continue;
      }
      const origin: IAutoMovieQuaternion | null = read(seconds);
      if (origin === null) continue;
      const expected: IAutoMovieVector3 = {
        x: 2 * Math.cos(3 * seconds),
        y: 3,
        z: 2 * Math.sin(3 * seconds),
      };
      const rates: IAutoMovieVector3[] = [];
      for (const direction of [-1, 1]) {
        const near: IAutoMovieQuaternion | null = read(
          seconds + direction * epsilon,
        );
        const far: IAutoMovieQuaternion | null = read(
          seconds + direction * 2 * epsilon,
        );
        if (near === null || far === null) continue;
        const a: IAutoMovieVector3 = logarithm(origin, near);
        const b: IAutoMovieVector3 = logarithm(origin, far);
        const rate: IAutoMovieVector3 = {
          x: (direction * (4 * a.x - b.x)) / (2 * epsilon),
          y: (direction * (4 * a.y - b.y)) / (2 * epsilon),
          z: (direction * (4 * a.z - b.z)) / (2 * epsilon),
        };
        rates.push(rate);
        const error: number = Math.hypot(
          rate.x - expected.x,
          rate.y - expected.y,
          rate.z - expected.z,
        );
        if (!(error <= limit))
          findings.push(
            `${mode}: body rate error ${error} at ${seconds}, side ${direction}`,
          );
      }
      if (rates.length !== 2)
        findings.push(
          `${mode}: both knot sides were not observed at ${seconds}`,
        );
      else {
        const jump: number = Math.hypot(
          rates[0]!.x - rates[1]!.x,
          rates[0]!.y - rates[1]!.y,
          rates[0]!.z - rates[1]!.z,
        );
        if (!(jump <= limit))
          findings.push(`${mode}: body rate jumps ${jump} at ${seconds}`);
      }
    }

    const owned: IAutoMovieIntegrateMotionTrajectory.IState = path.at(0.37);
    owned.x.push(17);
    read(0.37);
    if (
      borrowed.some((state: readonly number[]): boolean => state.length !== 0)
    )
      findings.push(`${mode}: returned empty vector aliases a borrowed state`);
    if (calls !== plannedCalls)
      findings.push(`${mode}: completed playback reevaluated its callback`);
  }
  TestValidator.equals(
    "noncommuting orientation curves retain their knot body rates",
    findings,
    [],
  );
}

interface IRateWitness {
  rate: IAutoMovieIntegrateMotionTrajectory.IRate;
  dx: number;
  dy: number;
}

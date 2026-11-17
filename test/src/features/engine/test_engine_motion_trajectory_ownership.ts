import { integrateMotionTrajectory } from "@automovie/engine";
import type {
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { qunit } from "../internal/qunit";

/**
 * A planned trajectory owns completed numeric data, and a mutable state
 * returned to a caller cannot change another read or another trajectory.
 *
 * For elapsed u=t-2, position'=velocity, velocity'=6u and initial
 * (position,velocity)=(2,-3) give (2-3u+u³,-3+3u²). The state coupling
 * exercises actual stage inputs instead of a rate that ignores them.
 * A constant body rate 0.4 Z gives
 * q=Ry(37 degrees) Rz(0.4u radians). The explicit quaternion below is
 * (sin(18.5 degrees) sin(0.2u), sin(18.5 degrees) cos(0.2u),
 *  cos(18.5 degrees) sin(0.2u), cos(18.5 degrees) cos(0.2u)).
 * The noncommuting initial orientation distinguishes body from world rate.
 *
 * Scenarios:
 * 1. Fixed RK4 and adaptive DP5(4) read this same polynomial and rotation
 *    at endpoints, interior instants and held ends, including a shortened
 *    final fixed step. The existing trajectory suite's 1e-8 vector bound,
 *    qclose 1e-12 and finite/unit checks apply independently of ownership.
 * 2. Constructing a second trajectory, changing caller-owned x0/q0 after
 *    construction and reading in shuffled order leave the first unchanged.
 *    Playback never invokes either completed right-hand side again.
 * 3. Poison each returned mutable x/q and read again. Previously returned
 *    states, later reads and the other trajectory retain their own values;
 *    zero-turn knots and directly held endpoints must obey the same rule.
 * 4. Every rate record created by the owned callback retains its original
 *    numeric derivative and body velocity after planning and playback.
 *    A solver's scratch reuse must not write into that readonly input.
 *    The caller then changes its own rate arrays and velocities; completed
 *    curves retain the values they captured instead of borrowing those records.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the analytic vector/rotation solution, frames, existing precision bounds and ownership boundaries, including zero-turn and held-end branches.
 * @evidence contracts/development/testing.md#behavioral-verification Calls only the public integrator, reads actual fixed/adaptive states, modifies only caller-owned inputs/outputs and callback rate records, and observes replay, separate-plan isolation and readonly rate preservation before their deliberate mutation.
 * @evidence contracts/development/testing.md#independent-expectations Polynomial integration and right multiplication by a constant body-axis exponential determine every expected component directly; no second integrator, dense polynomial or output snapshot supplies a physical expectation.
 * @evidence contracts/development/testing.md#distinguishing-cases Fixed/adaptive paths, nonzero start time, shortened final step, noncommuting initial orientation, exact/interior/held queries, caller input and output mutation, independent trajectories and zero playback callback calls distinguish branch and scratch ownership.
 * @evidence contracts/development/testing.md#execution-ownership A deferred CPU unit owns analytic ODE inputs, callback counters and mutation probes; it starts no runner or host and replaces no global or foreign method.
 */
export function test_engine_motion_trajectory_ownership(): void {
  const findings: string[] = [];
  const first: number = 2;
  const last: number = 3.05;
  const sine: number = Math.sin((18.5 * Math.PI) / 180);
  const cosine: number = Math.cos((18.5 * Math.PI) / 180);
  const queries: readonly number[] = [
    first - 0.2,
    first,
    first + 0.13,
    first + 0.2,
    first + 0.57,
    last,
    last + 0.2,
  ];

  for (const adaptive of [false, true]) {
    const mode: string = adaptive ? "adaptive" : "fixed";
    let calls: number = 0;
    const rates: {
      seconds: number;
      value: IAutoMovieIntegrateMotionTrajectory.IRate;
      owned: number[];
      original: readonly [number, number];
    }[] = [];
    const x0: number[] = [2, -3];
    const q0: IAutoMovieQuaternion = { x: 0, y: sine, z: 0, w: cosine };
    const props: IAutoMovieIntegrateMotionTrajectory.IProps = {
      f: (
        seconds: number,
        state: readonly number[],
      ): IAutoMovieIntegrateMotionTrajectory.IRate => {
        calls++;
        const elapsed: number = seconds - first;
        const owned: number[] = [state[1]!, 6 * elapsed];
        const value: IAutoMovieIntegrateMotionTrajectory.IRate = {
          dx: owned,
          w: { x: 0, y: 0, z: 0.4 },
        };
        rates.push({
          seconds,
          value,
          owned,
          original: [value.dx[0]!, value.dx[1]!],
        });
        return value;
      },
      x0,
      q0,
      t0: first,
      t1: last,
      h: 0.2,
      ...(adaptive ? { tolerance: { relative: 1e-10, absolute: 1e-10 } } : {}),
    };
    const path: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
      integrateMotionTrajectory(props);
    const other: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
      integrateMotionTrajectory({
        ...props,
        x0: [5, 7],
        q0: { x: 0, y: 0, z: 0, w: 1 },
      });
    const plannedCalls: number = calls;
    const check: (
      label: string,
      state: IAutoMovieIntegrateMotionTrajectory.IState,
      seconds: number,
      second: boolean,
    ) => void = (
      label: string,
      state: IAutoMovieIntegrateMotionTrajectory.IState,
      seconds: number,
      second: boolean,
    ): void => {
      const elapsed: number = Math.max(
        0,
        Math.min(last - first, seconds - first),
      );
      const a: number = Math.sin(0.2 * elapsed);
      const b: number = Math.cos(0.2 * elapsed);
      const expected: IAutoMovieQuaternion = second
        ? { x: 0, y: 0, z: a, w: b }
        : { x: sine * a, y: sine * b, z: cosine * a, w: cosine * b };
      if (
        !(
          state.x.length === 2 &&
          nclose(
            state.x[0]!,
            (second ? 5 : 2) +
              (second ? 7 : -3) * elapsed +
              elapsed * elapsed * elapsed,
            1e-8,
          ) &&
          nclose(state.x[1]!, (second ? 7 : -3) + 3 * elapsed * elapsed, 1e-8)
        )
      )
        findings.push(
          `${mode} ${label}: vector state at ${seconds} is ${state.x}`,
        );
      if (
        !(
          state.q !== null &&
          qunit(state.q) &&
          qclose(state.q, expected, 1e-12)
        )
      )
        findings.push(
          `${mode} ${label}: body rotation at ${seconds} is ${JSON.stringify(state.q)}`,
        );
    };
    const retained: {
      seconds: number;
      state: IAutoMovieIntegrateMotionTrajectory.IState;
    }[] = [];
    for (const seconds of queries) {
      const state: IAutoMovieIntegrateMotionTrajectory.IState = path.at(seconds);
      check("planned", state, seconds, false);
      retained.push({ seconds, state });
      check("other planned", other.at(seconds), seconds, true);
    }

    x0[0] = 99;
    x0[1] = -101;
    q0.x = 17;
    q0.y = 19;
    q0.z = 23;
    q0.w = 29;
    for (const index of [6, 2, 5, 0, 4, 1, 3]) {
      const seconds: number = queries[index]!;
      check("after input mutation", path.at(seconds), seconds, false);
      const state: IAutoMovieIntegrateMotionTrajectory.IState = path.at(seconds);
      state.x[0] = 1000 + index;
      state.x[1] = -1000 - index;
      state.x.push(NaN);
      if (state.q !== null) {
        state.q.x = 31;
        state.q.y = 37;
        state.q.z = 41;
        state.q.w = 43;
      }
      check("after returned-state mutation", path.at(seconds), seconds, false);
      check(
        "other after returned-state mutation",
        other.at(seconds),
        seconds,
        true,
      );
      for (const previous of retained)
        check("retained result", previous.state, previous.seconds, false);
    }
    for (const produced of rates) {
      const value: IAutoMovieIntegrateMotionTrajectory.IRate = produced.value;
      if (
        !(
          value.dx.length === 2 &&
          nclose(value.dx[0]!, produced.original[0], 0) &&
          nclose(value.dx[1]!, produced.original[1], 0) &&
          value.w !== undefined &&
          nclose(value.w.x, 0, 0) &&
          nclose(value.w.y, 0, 0) &&
          nclose(value.w.z, 0.4, 0)
        )
      )
        findings.push(
          `${mode}: an owned callback rate was mutated after ${produced.seconds}`,
        );
    }
    for (const produced of rates) {
      produced.owned[0] = NaN;
      produced.owned[1] = Infinity;
      if (produced.value.w !== undefined) {
        produced.value.w.x = 47;
        produced.value.w.y = 53;
        produced.value.w.z = 59;
      }
    }
    for (const seconds of queries) {
      check("after caller rate mutation", path.at(seconds), seconds, false);
      check(
        "other after caller rate mutation",
        other.at(seconds),
        seconds,
        true,
      );
    }
    if (calls !== plannedCalls)
      findings.push(`${mode}: completed playback reevaluated its ODE`);
  }
  TestValidator.equals(
    "completed trajectories isolate caller-owned numeric state",
    findings,
    [],
  );
}

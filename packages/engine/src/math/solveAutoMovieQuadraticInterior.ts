/*
 * Copyright 2022 University of Oxford Control Group
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modified for AutoMovie: TypeScript specialization for diagonal PSD QPs
 * with zero/nonnegative cones and engine-owned numerical workspaces.
 * Adapted from Clarabel.rs 0.11.1, revision
 * 25540f559592068d0c8a80e46ded1b21760212a1.
 * Original source: src/solver/core/solver.rs; src/solver/implementations/default/variables.rs; src/solver/implementations/default/info.rs
 * License: ../../vendor/clarabel/licenses/clarabel-0.11.1/LICENSE.md
 */
import { IAutoMovieQuadraticConicProgram } from "./IAutoMovieQuadraticConicProgram";
import { IAutoMovieQuadraticState } from "./IAutoMovieQuadraticState";
import { addAutoMovieQuadraticProduct } from "./addAutoMovieQuadraticProduct";
import { createAutoMovieQuadraticFactor } from "./createAutoMovieQuadraticFactor";
import { measureAutoMovieQuadraticState } from "./measureAutoMovieQuadraticState";
import type { solveAutoMovieQuadraticKernel } from "./solveAutoMovieQuadraticKernel";
import { solveAutoMovieQuadraticStep } from "./solveAutoMovieQuadraticStep";

/**
 * Engine-owned homogeneous predictor-corrector for diagonal convex QPs with
 * equality/nonnegative cones, following Goulart and Chen (2024), sections 2-3.
 * Every solve is cold. It has no clock, random source, runtime module, process
 * or external numerical service. The supplied workspace holds its iterate and
 * results copy out before the synchronous borrow ends.
 *
 * Full termination retains 1e-9 primal/dual feasibility and absolute-or-relative
 * gap. Certificate, reduced-accuracy, iteration and progress criteria retain
 * Clarabel 0.11.1 meanings; reduced accuracy is status 4, never status 1.
 * Finite arithmetic can refuse ill-conditioned inputs. Caller-specific physical
 * acceptance and subsequent transformations remain independent obligations.
 *
 * @evidence contracts/development/implementation.md#principled-implementation A homogeneous quadratic embedding, orthant predictor-corrector, cone-interior fraction-to-boundary steps and sparse refined KKT solves produce either original-coordinate KKT convergence or checked primal/dual infeasibility certificates. Status 1 requires the inherited 1e-9 gap/feasibility criteria; finite-iteration and reduced-accuracy results remain distinct.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This owner sequences initialization, measurements, factors, directions and status extraction; separate owners retain their equations and the public adapter retains independent original-row residuals.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No objective ridge, relaxed constraint, small-coefficient deletion, fixture dispatch, last-iterate success or external fallback exists. Optional initial state is ignored consistently with the preceding cold solver.
 * @evidence contracts/development/common.md#meaningful-documentation States method/source, cone scope, deterministic host independence, workspace ownership, convergence/status meaning and physical acceptance limits.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most 200 Newton iterations reuse one sparse symbolic factor; each adds one numeric factorization, three refined solves and O(n+m+nnz) vector/residual work. Storage follows actual sparse factor fill plus O(n+m+nnz) arrays rather than a dense variable square.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One iteration shares numeric factors and the constant RHS between both directions; each problem rebuilds from current immutable coefficients with no warm cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources All factors, previous/current iterates and directions belong to this synchronous call; only copied primal/dual values and scalar diagnostics escape, and no instance or handle remains globally retained.
 */
export function solveAutoMovieQuadraticInterior(
  data: IAutoMovieQuadraticConicProgram,
  workspace: Float64Array,
  originalCount: number,
): ReturnType<typeof solveAutoMovieQuadraticKernel> {
  const state: IAutoMovieQuadraticState = {
    x: workspace.subarray(0, data.n),
    s: workspace.subarray(data.n, data.n + data.m),
    z: workspace.subarray(data.n + data.m, data.n + 2 * data.m),
    tau: 1,
    kappa: 1,
  };
  const factor: ReturnType<typeof createAutoMovieQuadraticFactor> =
    createAutoMovieQuadraticFactor(data);
  const h: Float64Array = new Float64Array(data.m);
  const applied: Float64Array = new Float64Array(2);
  h.fill(1, data.equalities);
  const constantRhs: Float64Array = new Float64Array(data.n + data.m);
  for (let column: number = 0; column < data.n; column++)
    constantRhs[column] = -data.q[column]!;
  constantRhs.set(data.b, data.n);
  const initial: Float64Array | undefined = factor.update(h)
    ? factor.solve(constantRhs)
    : undefined;
  if (initial === undefined)
    return {
      status: 9,
      iterations: 0,
      primalResidual: NaN,
      dualResidual: NaN,
      objective: NaN,
      dualObjective: NaN,
      primal: new Array<number>(data.n).fill(NaN),
      dual: new Array<number>(originalCount).fill(NaN),
    };
  let status: number = 0;
  state.x.set(initial.subarray(0, data.n));
  state.z.set(initial.subarray(data.n));
  for (let row: number = data.equalities; row < data.m; row++)
    state.s[row] = -state.z[row]!;
  shiftInterior(state.s, data.equalities);
  shiftInterior(state.z, data.equalities);
  let iterations: number = 0;
  let reading: ReturnType<typeof measureAutoMovieQuadraticState> =
    measureAutoMovieQuadraticState(data, state);
  let previous: IAutoMovieQuadraticState | undefined;
  let prior: typeof reading | undefined;
  while (status === 0) {
    reading = measureAutoMovieQuadraticState(data, state);
    status = convergence(reading, false);
    if (status !== 0) break;
    if (
      prior !== undefined &&
      previous !== undefined &&
      iterations > 1 &&
      (reading.dualResidual > prior.dualResidual ||
        reading.primalResidual > prior.primalResidual) &&
      ((reading.ratio < 100 * Number.EPSILON &&
        (prior.gap < 1e-9 || prior.relativeGap < 1e-9)) ||
        (reading.ratio < 1 &&
          ((reading.dualResidual > 1e-7 &&
            reading.dualResidual > 100 * prior.dualResidual) ||
            (reading.primalResidual > 1e-7 &&
              reading.primalResidual > 100 * prior.primalResidual))))
    ) {
      state.x.set(previous.x);
      state.s.set(previous.s);
      state.z.set(previous.z);
      state.tau = previous.tau;
      state.kappa = previous.kappa;
      reading = measureAutoMovieQuadraticState(data, state);
      status = 10;
      break;
    }
    if (iterations === 200) {
      status = 7;
      break;
    }
    for (let row: number = data.equalities; row < data.m; row++)
      h[row] = state.s[row]! / state.z[row]!;
    iterations++;
    const constant: Float64Array | undefined = factor.update(h)
      ? factor.solve(constantRhs)
      : undefined;
    if (constant === undefined) {
      status = 9;
      break;
    }
    const mu: number =
      (reading.sz + state.tau * state.kappa) / (data.m - data.equalities + 1);
    const affine: IAutoMovieQuadraticState | undefined =
      solveAutoMovieQuadraticStep(
        data,
        state,
        reading,
        factor,
        constant,
        0,
        mu,
        1,
      );
    if (affine === undefined) {
      status = 9;
      break;
    }
    const affineLength: number = stepLength(state, affine, data.equalities);
    const sigma: number = (1 - affineLength) ** 3;
    const combined: IAutoMovieQuadraticState | undefined =
      solveAutoMovieQuadraticStep(
        data,
        state,
        reading,
        factor,
        constant,
        sigma,
        mu,
        iterations === 1 ? affineLength : 1,
        affine,
      );
    if (combined === undefined) {
      status = 9;
      break;
    }
    const length: number = 0.99 * stepLength(state, combined, data.equalities);
    if (length <= 1e-4) {
      status = 10;
      break;
    }
    previous = {
      x: state.x.slice(),
      s: state.s.slice(),
      z: state.z.slice(),
      tau: state.tau,
      kappa: state.kappa,
    };
    prior = reading;
    advance(state.x, combined.x, length, applied);
    advance(state.s, combined.s, length, applied);
    advance(state.z, combined.z, length, applied);
    applied[0] = state.tau;
    applied[1] = 0;
    addAutoMovieQuadraticProduct(applied, 0, length, combined.tau);
    state.tau = applied[0]! + applied[1]!;
    applied[0] = state.kappa;
    applied[1] = 0;
    addAutoMovieQuadraticProduct(applied, 0, length, combined.kappa);
    state.kappa = applied[0]! + applied[1]!;
  }
  if (status === 7 || status === 9 || status === 10)
    status = convergence(reading, true) || status;
  const infeasible: boolean =
    status === 2 || status === 3 || status === 5 || status === 6;
  const divisor: number = infeasible ? state.kappa : state.tau;
  const primal: number[] = Array.from(
    state.x,
    (value: number, column: number): number =>
      (value * data.d[column]!) / divisor,
  );
  const dualSums: Float64Array = new Float64Array(2 * originalCount);
  for (let row: number = 0; row < data.m; row++)
    addAutoMovieQuadraticProduct(
      dualSums,
      data.originalRows[row]!,
      (state.z[row]! * data.e[row]!) / divisor / data.c,
      data.signs[row]!,
    );
  const dual: number[] = Array.from(
    { length: originalCount },
    (_: unknown, at: number): number =>
      dualSums[2 * at]! + dualSums[2 * at + 1]!,
  );
  return {
    status,
    iterations,
    primal,
    dual,
    primalResidual: reading.primalResidual,
    dualResidual: reading.dualResidual,
    objective: infeasible ? NaN : reading.objective,
    dualObjective: infeasible ? NaN : reading.dualObjective,
  };
}

/** Preserve product error through the iterate addition before storing binary64 state. */
function advance(
  values: Float64Array,
  direction: Float64Array,
  length: number,
  pair: Float64Array,
): void {
  for (let at: number = 0; at < values.length; at++) {
    pair[0] = values[at]!;
    pair[1] = 0;
    addAutoMovieQuadraticProduct(pair, 0, length, direction[at]!);
    values[at] = pair[0]! + pair[1]!;
  }
}

/** Shift each orthant block in two stages, preserving large-value positivity. */
function shiftInterior(values: Float64Array, start: number): void {
  if (start === values.length) return;
  let minimum: number = Infinity;
  let positive: number = 0;
  for (let at: number = start; at < values.length; at++) {
    minimum = Math.min(minimum, values[at]!);
    positive += Math.max(0, values[at]!);
  }
  const target: number = Math.max(
    1,
    (0.1 * positive) / (values.length - start),
  );
  if (minimum <= 0) {
    for (let at: number = start; at < values.length; at++)
      values[at] -= minimum;
    for (let at: number = start; at < values.length; at++) values[at] += target;
  } else if (minimum < target)
    for (let at: number = start; at < values.length; at++)
      values[at] += target - minimum;
}

/** Largest unit-bounded step keeping both scalar and orthant pairs nonnegative. */
function stepLength(
  state: IAutoMovieQuadraticState,
  step: IAutoMovieQuadraticState,
  equalities: number,
): number {
  let length: number = 1;
  if (step.tau < 0) length = Math.min(length, -state.tau / step.tau);
  if (step.kappa < 0) length = Math.min(length, -state.kappa / step.kappa);
  for (let row: number = equalities; row < state.z.length; row++) {
    if (step.z[row]! < 0)
      length = Math.min(length, -state.z[row]! / step.z[row]!);
    if (step.s[row]! < 0)
      length = Math.min(length, -state.s[row]! / step.s[row]!);
  }
  return length;
}

/** Full and reduced thresholds keep feasible optima separate from certificates. */
function convergence(
  reading: ReturnType<typeof measureAutoMovieQuadraticState>,
  reduced: boolean,
): number {
  const gap: number = reduced ? 5e-5 : 1e-9;
  const feas: number = reduced ? 1e-4 : 1e-9;
  if (
    reading.ratio <= 1 &&
    (reading.gap < gap || reading.relativeGap < gap) &&
    reading.primalResidual < feas &&
    reading.dualResidual < feas
  )
    return reduced ? 4 : 1;
  if (reading.ratio > (reduced ? 1e7 : 1e9)) {
    const absolute: number = reduced ? 5e-12 : 1e-8;
    const relative: number = reduced ? 5e-5 : 1e-8;
    if (
      reading.bz < -absolute &&
      reading.primalInfeasibility < -relative * reading.bz
    )
      return reduced ? 5 : 2;
    if (
      reading.qx < -absolute &&
      reading.dualInfeasibility < -relative * reading.qx
    )
      return reduced ? 6 : 3;
  }
  return 0;
}

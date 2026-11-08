/*
 * Copyright 2022 University of Oxford Control Group
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modified for AutoMovie: TypeScript specialization for diagonal PSD QPs
 * with zero/nonnegative cones and engine-owned numerical workspaces.
 * Adapted from Clarabel.rs 0.11.1, revision
 * 25540f559592068d0c8a80e46ded1b21760212a1.
 * Original source: src/solver/implementations/default/residuals.rs; src/solver/implementations/default/info.rs
 * License: ../../vendor/clarabel/licenses/clarabel-0.11.1/LICENSE.md
 */
import { IAutoMovieQuadraticConicProgram } from "./IAutoMovieQuadraticConicProgram";
import { IAutoMovieQuadraticState } from "./IAutoMovieQuadraticState";
import { addAutoMovieQuadraticProduct } from "./addAutoMovieQuadraticProduct";

/**
 * Measure homogeneous equations and original-coordinate termination quantities.
 * Residual signs are rx=-Px-A'z-q*tau and rz=Ax+s-b*tau. Costs divide by tau
 * and undo objective scaling; infeasibility quantities remain homogeneous.
 * Stable Euclidean norms retain the preceding solver's residual definitions.
 * Product/addition corrections remain through sparse residuals and costs; the
 * gap is formed before the two reported costs round to individual numbers.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Evaluates the unchanged quadratic homogeneous embedding and Goulart/Chen optimality/certificate residuals, undoing D/E/c scaling before normalized primal/dual norms and objective gaps are formed.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This owner supplies both Newton residuals and honest diagnostic scalars; iteration owns decisions and the public adapter independently measures original interval feasibility and stationarity.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Residuals use every original expanded coefficient and no tolerance, clipping or regularization changes them; infeasible objectives are marked separately during extraction.
 * @evidence contracts/development/common.md#meaningful-documentation States residual signs, coordinate reversal, costs, homogeneous certificate meaning and norm convention.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each measurement costs O(n+m+nnz) with n+m residual storage; stable norm accumulation avoids overflow without dense products.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each sparse matrix traversal supplies both equation and infeasibility residuals, and dot products serve cost, embedding and barrier calculations.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned residual vectors belong to the current iteration and no history or global cache is retained.
 */
export function measureAutoMovieQuadraticState(
  data: IAutoMovieQuadraticConicProgram,
  state: IAutoMovieQuadraticState,
): {
  rx: Float64Array;
  rz: Float64Array;
  rt: number;
  qx: number;
  bz: number;
  sz: number;
  xpx: number;
  objective: number;
  dualObjective: number;
  primalResidual: number;
  dualResidual: number;
  primalInfeasibility: number;
  dualInfeasibility: number;
  gap: number;
  relativeGap: number;
  ratio: number;
} {
  const gradient: Float64Array = new Float64Array(2 * data.n);
  const constraints: Float64Array = new Float64Array(2 * data.m);
  for (let row: number = 0; row < data.m; row++)
    constraints[2 * row] = state.s[row]!;
  for (let column: number = 0; column < data.n; column++)
    for (
      let at: number = data.columns[column]!;
      at < data.columns[column + 1]!;
      at++
    ) {
      const row: number = data.rows[at]!;
      addAutoMovieQuadraticProduct(
        gradient,
        column,
        -data.values[at]!,
        state.z[row]!,
      );
      addAutoMovieQuadraticProduct(
        constraints,
        row,
        data.values[at]!,
        state.x[column]!,
      );
    }
  const dots: Float64Array = new Float64Array(8);
  for (let column: number = 0; column < data.n; column++) {
    addAutoMovieQuadraticProduct(dots, 0, data.q[column]!, state.x[column]!);
    addAutoMovieQuadraticProduct(
      dots,
      3,
      data.p[column]! * state.x[column]!,
      state.x[column]!,
    );
  }
  for (let row: number = 0; row < data.m; row++) {
    addAutoMovieQuadraticProduct(dots, 1, data.b[row]!, state.z[row]!);
    addAutoMovieQuadraticProduct(dots, 2, state.s[row]!, state.z[row]!);
  }
  const rx: Float64Array = rounded(gradient, data.n);
  const rz: Float64Array = rounded(constraints, data.m);
  const nx: number = scaledNorm(state.x, data.d, false);
  const nz: number = scaledNorm(state.z, data.e, false) / data.c;
  const ns: number = scaledNorm(state.s, data.e, true);
  const primalInfeasibility: number =
    scaledNorm(rx, data.d, true) / data.c / Math.max(1, nz);
  const px: Float64Array = Float64Array.from(
    state.x,
    (value: number, column: number): number => data.p[column]! * value,
  );
  const dualInfeasibility: number = Math.max(
    scaledNorm(px, data.d, true) / Math.max(1, nx),
    scaledNorm(rz, data.e, true) / Math.max(1, nx + ns),
  );
  for (let column: number = 0; column < data.n; column++) {
    addAutoMovieQuadraticProduct(
      gradient,
      column,
      -data.p[column]!,
      state.x[column]!,
    );
    addAutoMovieQuadraticProduct(gradient, column, -data.q[column]!, state.tau);
    rx[column] = gradient[2 * column]! + gradient[2 * column + 1]!;
  }
  for (let row: number = 0; row < data.m; row++) {
    addAutoMovieQuadraticProduct(constraints, row, -data.b[row]!, state.tau);
    rz[row] = constraints[2 * row]! + constraints[2 * row + 1]!;
  }

  // Keep low parts through cancellation, not merely through each isolated dot product.
  const metrics: Float64Array = new Float64Array(8);
  for (let part: number = 0; part < 2; part++) {
    const quadratic: number = dots[6 + part]! / state.tau / state.tau / 2;
    addAutoMovieQuadraticProduct(metrics, 0, dots[part]! / state.tau, 1);
    addAutoMovieQuadraticProduct(metrics, 0, quadratic, 1);
    addAutoMovieQuadraticProduct(metrics, 1, -dots[2 + part]! / state.tau, 1);
    addAutoMovieQuadraticProduct(metrics, 1, -quadratic, 1);
    addAutoMovieQuadraticProduct(metrics, 2, dots[part]!, 1);
    addAutoMovieQuadraticProduct(metrics, 2, dots[2 + part]!, 1);
    addAutoMovieQuadraticProduct(metrics, 2, dots[6 + part]! / state.tau, 1);
  }
  addAutoMovieQuadraticProduct(metrics, 2, state.kappa, 1);
  for (let part: number = 0; part < 2; part++) {
    addAutoMovieQuadraticProduct(metrics, 3, metrics[part]!, 1);
    addAutoMovieQuadraticProduct(metrics, 3, -metrics[2 + part]!, 1);
  }
  const objective: number = (metrics[0]! + metrics[1]!) / data.c;
  const dualObjective: number = (metrics[2]! + metrics[3]!) / data.c;
  const gap: number = Math.abs(metrics[6]! + metrics[7]!) / data.c;
  return {
    rx,
    rz,
    rt: metrics[4]! + metrics[5]!,
    qx: dots[0]! + dots[1]!,
    bz: dots[2]! + dots[3]!,
    sz: dots[4]! + dots[5]!,
    xpx: dots[6]! + dots[7]!,
    objective,
    dualObjective,
    primalResidual:
      scaledNorm(rz, data.e, true) /
      state.tau /
      Math.max(1, data.normb + (nx + ns) / state.tau),
    dualResidual:
      scaledNorm(rx, data.d, true) /
      state.tau /
      data.c /
      Math.max(1, data.normq + (nx + nz) / state.tau),
    primalInfeasibility,
    dualInfeasibility,
    gap,
    relativeGap:
      gap / Math.max(1, Math.min(Math.abs(objective), Math.abs(dualObjective))),
    ratio: state.kappa / state.tau,
  };
}

/** Round each twofold component only where the vector API needs one binary64 value. */
function rounded(values: Float64Array, count: number): Float64Array {
  return Float64Array.from(
    { length: count },
    (_: unknown, at: number): number => values[2 * at]! + values[2 * at + 1]!,
  );
}

/** Scaled sum-of-squares keeps finite Euclidean norms away from overflow. */
function scaledNorm(
  values: Float64Array,
  scales: Float64Array,
  inverse: boolean,
): number {
  let largest: number = 0;
  let sum: number = 0;
  for (let at: number = 0; at < values.length; at++) {
    const value: number = Math.abs(
      inverse ? values[at]! / scales[at]! : values[at]! * scales[at]!,
    );
    if (!Number.isFinite(value)) return value;
    if (value === 0) continue;
    if (value > largest) {
      sum = 1 + sum * (largest / value) ** 2;
      largest = value;
    } else sum += (value / largest) ** 2;
  }
  return largest * Math.sqrt(sum);
}

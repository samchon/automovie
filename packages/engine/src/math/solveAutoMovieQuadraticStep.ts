/*
 * Copyright 2022 University of Oxford Control Group
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modified for AutoMovie: TypeScript specialization for diagonal PSD QPs
 * with zero/nonnegative cones and engine-owned numerical workspaces.
 * Adapted from Clarabel.rs 0.11.1, revision
 * 25540f559592068d0c8a80e46ded1b21760212a1.
 * Original source: src/solver/implementations/default/kktsystem.rs; src/solver/implementations/default/variables.rs; src/solver/core/cones/nonnegativecone.rs
 * License: ../../vendor/clarabel/licenses/clarabel-0.11.1/LICENSE.md
 */
import { IAutoMovieQuadraticConicProgram } from "./IAutoMovieQuadraticConicProgram";
import { IAutoMovieQuadraticState } from "./IAutoMovieQuadraticState";
import { addAutoMovieQuadraticProduct } from "./addAutoMovieQuadraticProduct";
import type { createAutoMovieQuadraticFactor } from "./createAutoMovieQuadraticFactor";
import type { measureAutoMovieQuadraticState } from "./measureAutoMovieQuadraticState";

/**
 * Compute an affine or combined homogeneous Newton direction using one already
 * factored sparse KKT and its constant RHS solution K^-1[-q;b]. The scalar
 * Schur complement retains x'Px/tau, so PSD/zero curvature needs no epigraph
 * or added objective ridge. Orthant centrality is s*z and H=s/z; zero-cone
 * rows have H=0 and a zero slack direction.
 *
 * Goulart and Chen (2024), sections 3.2-3.3, derive this condensed solve.
 * The combined RHS includes Mehrotra's affine product correction and uses
 * the first-iteration damping of the preceding Clarabel configuration.
 * Twofold sums retain cancellation in the scalar Schur equation and direction
 * reconstruction. Expanding P*(xi-ci)^2-P*ci^2 removes cancelling ci squares.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Eliminates slack and homogeneous scalar equations to the symmetric KKT, then reconstructs delta tau/x/z/s/kappa. The orthant corrector is (s*z + damping*ds_aff*dz_aff - sigma*mu)/z and all equality slacks remain zero.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This owner evaluates one direction; factorization and residuals are supplied by their owners, while iteration selects centering and admissible step length.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The authored PSD diagonal stays unchanged and neither small coefficients nor unsolved factors are repaired into a successful direction; nonfinite reconstruction refuses.
 * @evidence contracts/development/common.md#meaningful-documentation States the matrix reuse, scalar Schur complement, zero/orthant distinction, source derivation and affine-product correction.
 * @evidence contracts/development/implementation.md#efficient-algorithms Direction assembly/reconstruction costs O(n+m) plus one sparse refined solve; constant K^-1[-q;b] and numeric factors are shared by affine and combined directions of the iteration.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Receives the common constant solution rather than solving it again; affine direction supplies its product correction to the combined direction.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources RHS, offsets and returned direction contain O(n+m) doubles and remain within the current synchronous iteration; no cross-call state is retained.
 */
export function solveAutoMovieQuadraticStep(
  data: IAutoMovieQuadraticConicProgram,
  state: IAutoMovieQuadraticState,
  reading: ReturnType<typeof measureAutoMovieQuadraticState>,
  factor: ReturnType<typeof createAutoMovieQuadraticFactor>,
  constant: Float64Array,
  sigma: number,
  mu: number,
  damping: number,
  affine?: IAutoMovieQuadraticState,
): IAutoMovieQuadraticState | undefined {
  const rhs: Float64Array = new Float64Array(data.n + data.m);
  const offset: Float64Array = new Float64Array(data.m);
  const pair: Float64Array = new Float64Array(2);
  const contraction: number = 1 - sigma;
  for (let column: number = 0; column < data.n; column++)
    rhs[column] = contraction * reading.rx[column]!;
  for (let row: number = 0; row < data.m; row++) {
    if (row >= data.equalities) {
      if (affine === undefined) offset[row] = state.s[row]!;
      else {
        pair.fill(0);
        addAutoMovieQuadraticProduct(pair, 0, state.s[row]!, state.z[row]!);
        addAutoMovieQuadraticProduct(
          pair,
          0,
          damping * affine.s[row]!,
          affine.z[row]!,
        );
        addAutoMovieQuadraticProduct(pair, 0, -sigma, mu);
        offset[row] = (pair[0]! + pair[1]!) / state.z[row]!;
      }
    }
    pair[0] = offset[row]!;
    pair[1] = 0;
    addAutoMovieQuadraticProduct(pair, 0, -contraction, reading.rz[row]!);
    rhs[data.n + row] = pair[0]! + pair[1]!;
  }
  const variable: Float64Array | undefined = factor.solve(rhs);
  if (variable === undefined) return undefined;
  pair.fill(0);
  addAutoMovieQuadraticProduct(pair, 0, state.tau, state.kappa);
  addAutoMovieQuadraticProduct(pair, 0, -sigma, mu);
  if (affine !== undefined)
    addAutoMovieQuadraticProduct(pair, 0, damping * affine.tau, affine.kappa);
  const rk: number = pair[0]! + pair[1]!;
  const scalars: Float64Array = new Float64Array(4);
  addAutoMovieQuadraticProduct(scalars, 0, contraction, reading.rt);
  addAutoMovieQuadraticProduct(scalars, 0, -rk / state.tau, 1);
  addAutoMovieQuadraticProduct(scalars, 1, state.kappa / state.tau, 1);
  for (let column: number = 0; column < data.n; column++) {
    const xi: number = state.x[column]! / state.tau;
    const ci: number = constant[column]!;
    addAutoMovieQuadraticProduct(
      scalars,
      0,
      data.q[column]!,
      variable[column]!,
    );
    addAutoMovieQuadraticProduct(
      scalars,
      0,
      2 * data.p[column]! * xi,
      variable[column]!,
    );
    addAutoMovieQuadraticProduct(scalars, 1, -data.q[column]!, ci);
    addAutoMovieQuadraticProduct(scalars, 1, data.p[column]! * xi, xi);
    addAutoMovieQuadraticProduct(scalars, 1, -2 * data.p[column]! * xi, ci);
  }
  for (let row: number = 0; row < data.m; row++) {
    addAutoMovieQuadraticProduct(
      scalars,
      0,
      data.b[row]!,
      variable[data.n + row]!,
    );
    addAutoMovieQuadraticProduct(
      scalars,
      1,
      -data.b[row]!,
      constant[data.n + row]!,
    );
  }
  const tau: number = (scalars[0]! + scalars[1]!) / (scalars[2]! + scalars[3]!);
  pair[0] = rk;
  pair[1] = 0;
  addAutoMovieQuadraticProduct(pair, 0, state.kappa, tau);
  const kappa: number = -(pair[0]! + pair[1]!) / state.tau;
  const x: Float64Array = new Float64Array(data.n);
  const z: Float64Array = new Float64Array(data.m);
  const s: Float64Array = new Float64Array(data.m);
  for (let column: number = 0; column < data.n; column++) {
    pair[0] = variable[column]!;
    pair[1] = 0;
    addAutoMovieQuadraticProduct(pair, 0, tau, constant[column]!);
    x[column] = pair[0]! + pair[1]!;
  }
  for (let row: number = 0; row < data.m; row++) {
    pair[0] = variable[data.n + row]!;
    pair[1] = 0;
    addAutoMovieQuadraticProduct(pair, 0, tau, constant[data.n + row]!);
    z[row] = pair[0]! + pair[1]!;
    if (row >= data.equalities) {
      pair[0] = -offset[row]!;
      pair[1] = 0;
      addAutoMovieQuadraticProduct(
        pair,
        0,
        -state.s[row]! / state.z[row]!,
        z[row]!,
      );
      s[row] = pair[0]! + pair[1]!;
    }
  }
  if (
    ![tau, kappa].every(Number.isFinite) ||
    !x.every(Number.isFinite) ||
    !z.every(Number.isFinite) ||
    !s.every(Number.isFinite)
  )
    return undefined;
  return { x, z, s, tau, kappa };
}

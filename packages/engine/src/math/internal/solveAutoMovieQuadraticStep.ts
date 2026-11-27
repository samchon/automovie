import type {
  IAutoMovieCreateQuadraticFactor,
  IAutoMovieMeasureQuadraticState,
  IAutoMovieQuadraticConicProgram,
  IAutoMovieQuadraticState,
} from "@automovie/interface";

import { addAutoMovieQuadraticProduct } from "./addAutoMovieQuadraticProduct";

/**
 * Compute an affine or combined homogeneous Newton direction using one already
 * factored sparse KKT and its constant RHS solution K^-1[-q;b]. The scalar
 * Schur complement retains x'Px/tau, so PSD/zero curvature needs no epigraph or
 * added objective ridge. Orthant centrality is s*z and H=s/z; zero-cone rows
 * have H=0 and a zero slack direction.
 *
 * Goulart and Chen (2024), sections 3.2-3.3, derive this condensed solve. The
 * combined RHS includes Mehrotra's affine product correction and uses the
 * first-iteration damping of the preceding Clarabel configuration. Twofold sums
 * retain cancellation in the scalar Schur equation and direction
 * reconstruction. Expanding P*(xi-ci)^2-P*ci^2 removes cancelling ci squares.
 * @see {@link https://github.com/oxfordcontrol/Clarabel.rs/blob/25540f559592068d0c8a80e46ded1b21760212a1/src/solver/implementations/default/kktsystem.rs}
 * @see {@link https://github.com/oxfordcontrol/Clarabel.rs/blob/25540f559592068d0c8a80e46ded1b21760212a1/src/solver/implementations/default/variables.rs}
 * @see {@link https://github.com/oxfordcontrol/Clarabel.rs/blob/25540f559592068d0c8a80e46ded1b21760212a1/src/solver/core/cones/nonnegativecone.rs}
 * @see {@link https://github.com/oxfordcontrol/Clarabel.rs/blob/25540f559592068d0c8a80e46ded1b21760212a1/src/solver/implementations/default/settings.rs}
 */
export function solveAutoMovieQuadraticStep(
  data: IAutoMovieQuadraticConicProgram,
  state: IAutoMovieQuadraticState,
  reading: IAutoMovieMeasureQuadraticState.IResult,
  factor: IAutoMovieCreateQuadraticFactor.IResult,
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

  return { x, z, s, tau, kappa };
}

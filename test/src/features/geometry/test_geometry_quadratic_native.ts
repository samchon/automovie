import { solveAutoMovieQuadraticProgram } from "@automovie/engine";
import { addAutoMovieQuadraticProduct } from "@automovie/engine/math/addAutoMovieQuadraticProduct";
import { assembleAutoMovieQuadraticProgram } from "@automovie/engine/math/assembleAutoMovieQuadraticProgram";
import { createAutoMovieQuadraticConicProgram } from "@automovie/engine/math/createAutoMovieQuadraticConicProgram";
import { createAutoMovieQuadraticFactor } from "@automovie/engine/math/createAutoMovieQuadraticFactor";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Native TypeScript ownership preserves sparse scaling and actual infeasibility
 * witnesses, beyond the preexisting small analytic optima and degenerate corner.
 *
 * Scenarios:
 * 1. A 2048-variable bounded chain has analytic optimum x=2 everywhere. Its KKT
 *    graph is a tree, so minimum-degree factorization retains linear storage.
 * 2. Contradictory lower/upper bounds return a signed Farkas multiplier with
 *    A'y=0 and the appropriate negative endpoint pairing.
 * 3. An unbounded zero-curvature linear objective returns a nonzero feasible
 *    descent ray, with negative q'x, rather than an unavailable zero vector.
 * 4. The binomial product (1+2^-27)*(1-2^-27)-1 is exactly -2^-54;
 *    rounded products alone lose it. Reciprocal exponent scaling retains one.
 *
 * @evidence contracts/testing.md#behavioral-verification Observes compensated product cancellation, exponent transfer and a retained subnormal, then solves a large sparse connected QP through the real public API and checks every independent coordinate optimum, original residuals, objective and gap. It observes actual symbolic factor nonzeros under a tree-graph bound, then checks returned primal/dual infeasibility vectors against their mathematical witness equations.
 * @evidence contracts/testing.md#independent-expectations The binomial identity gives (1+2^-27)*(1-2^-27)-1=-2^-54 exactly; reciprocal powers multiply to one, and MIN_VALUE*1 is unchanged. Completing (x-2)^2/2 gives x=2, objective -2N, and every equality/bound admits that point. The bipartite chain with two bound leaves per variable is a tree with 4N-2 edges and degree-one elimination adds no fill, giving an independent linear factor bound. For x>=2 and x<=1, signed y=(-a,a), a>0, has A'y=0 and b'y=-a<0; for min -x with P=0 and no rows any positive ray certifies dual infeasibility. Numerical witness tolerances do not prove arbitrary ill-conditioned convergence.
 * @evidence contracts/testing.md#distinguishing-cases Adds product-cancellation and exponent/subnormal boundaries, connected large sparse storage and nonzero mathematical certificates missing from the prior status-only refusal checks. Existing program/refusal/degeneracy/feasible-direction tests retain all small optima, admission, PSD, coefficient and nearly parallel boundaries; this test introduces no fixture-specific solver branches.
 * @evidence contracts/testing.md#execution-ownership The discoverable named portable unit entry invokes engine-owned TypeScript assembly, sparse factors and public solving without native artifacts, installation, process, browser or GPU; it owns all cases locally.
 */
export function test_geometry_quadratic_native(): void {
  const sum: Float64Array = new Float64Array(2);
  addAutoMovieQuadraticProduct(sum, 0, 1 + 2 ** -27, 1 - 2 ** -27);
  addAutoMovieQuadraticProduct(sum, 0, -1, 1);
  TestValidator.predicate("product cancellation keeps the independent binomial remainder",
    nclose(sum[0]! + sum[1]!, -(2 ** -54), 0));
  sum.fill(0);
  addAutoMovieQuadraticProduct(sum, 0, 2 ** 1000, 2 ** -1000);
  TestValidator.predicate("splitter exponent transfer preserves a finite product",
    nclose(sum[0]! + sum[1]!, 1, 0));
  sum.fill(0);
  addAutoMovieQuadraticProduct(sum, 0, Number.MIN_VALUE, 1);
  TestValidator.predicate("a representable subnormal product is retained",
    nclose(sum[0]! + sum[1]!, Number.MIN_VALUE, 0));

  const size: number = 2048;
  const input: Parameters<typeof solveAutoMovieQuadraticProgram>[0] = {
    diagonal: new Array<number>(size).fill(1),
    linear: new Array<number>(size).fill(-2),
    rows: [
      ...Array.from({ length: size - 1 }, (_: unknown, index: number): Parameters<typeof solveAutoMovieQuadraticProgram>[0]["rows"][number] => ({
        indices: [index, index + 1], weights: [1, -1], lower: 0, upper: 0,
      })),
      ...Array.from({ length: size }, (_: unknown, index: number): Parameters<typeof solveAutoMovieQuadraticProgram>[0]["rows"][number] => ({
        indices: [index], weights: [1], lower: -10, upper: 10,
      })),
    ],
  };
  const factor: ReturnType<typeof createAutoMovieQuadraticFactor> = createAutoMovieQuadraticFactor(createAutoMovieQuadraticConicProgram(assembleAutoMovieQuadraticProgram(input)));
  TestValidator.predicate("tree KKT retains linear sparse factor storage", factor.nonzeros <= 4 * size);
  const result: ReturnType<typeof solveAutoMovieQuadraticProgram> = solveAutoMovieQuadraticProgram(input);
  TestValidator.predicate("large sparse analytic optimum and original certificate", result.status === 1 &&
    result.primal.length === size && result.primal.every((value: number): boolean => nclose(value, 2, 1e-7) && Math.abs(value - 2) < 1e-7) &&
    result.maximumViolation < 1e-7 && result.stationarityResidual < 1e-7 &&
    Math.abs(result.objective + 2 * size) < 1e-7 && Math.abs(result.objective - result.dualObjective) < 1e-5);
  const infeasible: ReturnType<typeof solveAutoMovieQuadraticProgram> = solveAutoMovieQuadraticProgram({
    diagonal: [1], linear: [0], rows: [
      { indices: [0], weights: [1], lower: 2, upper: null },
      { indices: [0], weights: [1], lower: null, upper: 1 },
    ],
  });
  TestValidator.predicate("primal infeasibility carries a signed Farkas witness", infeasible.status === 2 &&
    infeasible.dual.length === 2 && infeasible.dual.every(Number.isFinite) &&
    infeasible.dual[0]! < -0.1 && infeasible.dual[1]! > 0.1 &&
    Math.abs(infeasible.dual[0]! + infeasible.dual[1]!) < 1e-7 &&
    2 * infeasible.dual[0]! + infeasible.dual[1]! < -0.1 &&
    Number.isNaN(infeasible.objective) && Number.isNaN(infeasible.dualObjective));
  const unbounded: ReturnType<typeof solveAutoMovieQuadraticProgram> = solveAutoMovieQuadraticProgram({ diagonal: [0], linear: [-1], rows: [] });
  TestValidator.predicate("dual infeasibility carries a genuine descent ray", unbounded.status === 3 &&
    unbounded.primal.length === 1 && Number.isFinite(unbounded.primal[0]) && unbounded.primal[0]! > 0.1 &&
    Number.isNaN(unbounded.objective) && Number.isNaN(unbounded.dualObjective));
}

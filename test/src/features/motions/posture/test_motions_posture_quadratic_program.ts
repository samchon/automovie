import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";
import {
  HumanQuadraticProgram
} from "../../../../../packages/motions/src/posture/internal/HumanQuadraticProgram";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Agreement with a closed-form minimiser: OSQP's relative residual tolerance
 * (`HumanQuadraticProgram.TOLERANCE`, 1e-3) on unit-scale data, tightened by
 * the polish of the active rows.
 */
const AGREEMENT: number = 1e-3;

/**
 * `HumanQuadraticProgram` minimises `½ xᵀPx + qᵀx` over hard and soft rows
 * (OSQP, Stellato et al. 2020), the curvature stored as its band (`p[i][j]` the
 * entry `(i, i + j)`).
 *
 * Scenarios:
 *
 * 1. Free: P = diag(2, 4), q = (−2, −8); the minimiser is −P⁻¹q = (1, 2) and the
 *    value there `½(2 + 16) − 18` = −9.
 * 2. One hard row: P = I, q = (−2, −2) under x₀ + x₁ ≤ 2; the free minimiser (2,
 *    2) is projected onto the row: (1, 1), the row's multiplier read by its
 *    key; the interior-point method finds the same point.
 * 3. A hard equality x₀ = ½ with P = I, q = 0: x = (½, 0).
 * 4. Rows x₀ ≥ 1 and x₀ ≤ 0 together are infeasible.
 * 5. A soft row x ≥ 1 of weight ½ with P = 1, q = 0: below the row the merit is
 *    `½x² + ½(1 − x)`, least at x = ½, and its value there 0.375.
 */
export function test_motions_posture_quadratic_program(): void {
  const band = (
    diagonal: readonly number[],
  ): IAutoMovieMotionHumanQuadraticProgram.IProblem["p"] =>
    diagonal.map((d: number): Float64Array => Float64Array.from([d, 0]));
  const free: IAutoMovieMotionHumanQuadraticProgram.IRow = {
    index: [0, 1],
    coef: [1, 1],
    l: -Infinity,
    u: Infinity,
  };

  // 1. Free.
  const plain: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
    n: 2,
    band: 1,
    p: band([2, 4]),
    q: Float64Array.from([-2, -8]),
    rows: [free],
  };
  const unbound: IAutoMovieMotionHumanQuadraticProgram.IState =
    HumanQuadraticProgram.solve(plain);
  TestValidator.predicate(
    "the free minimiser and its value",
    nclose(unbound.x[0]!, 1, AGREEMENT) &&
      nclose(unbound.x[1]!, 2, AGREEMENT) &&
      nclose(
        HumanQuadraticProgram.value(plain, Float64Array.from([1, 2])),
        -9,
        1e-12,
      ),
  );

  // 2. One hard row.
  const capped: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
    n: 2,
    band: 1,
    p: band([1, 1]),
    q: Float64Array.from([-2, -2]),
    rows: [{ key: "cap", index: [0, 1], coef: [1, 1], l: -Infinity, u: 2 }],
  };
  const projected: IAutoMovieMotionHumanQuadraticProgram.IState =
    HumanQuadraticProgram.solve(capped);
  const interior: IAutoMovieMotionHumanQuadraticProgram.IState | undefined =
    HumanQuadraticProgram.interior(capped);
  TestValidator.predicate(
    "a hard row projects the minimiser",
    nclose(projected.x[0]!, 1, AGREEMENT) &&
      nclose(projected.x[1]!, 1, AGREEMENT) &&
      HumanQuadraticProgram.multipliers(capped, projected).has("cap") &&
      interior !== undefined &&
      nclose(interior.x[0]!, 1, AGREEMENT) &&
      nclose(interior.x[1]!, 1, AGREEMENT),
  );

  // 3. An equality.
  const pinned: IAutoMovieMotionHumanQuadraticProgram.IState =
    HumanQuadraticProgram.solve({
      n: 2,
      band: 1,
      p: band([1, 1]),
      q: Float64Array.from([0, 0]),
      rows: [{ index: [0], coef: [1], l: 0.5, u: 0.5 }],
    });
  TestValidator.predicate(
    "an equality holds",
    nclose(pinned.x[0]!, 0.5, AGREEMENT) && nclose(pinned.x[1]!, 0, AGREEMENT),
  );

  // 4. Infeasible rows.
  TestValidator.equals(
    "contradicting rows are infeasible",
    HumanQuadraticProgram.solve({
      n: 1,
      band: 0,
      p: [Float64Array.from([1])],
      q: Float64Array.from([0]),
      rows: [
        { index: [0], coef: [1], l: 1, u: Infinity },
        { index: [0], coef: [1], l: -Infinity, u: 0 },
      ],
    }).status,
    "infeasible",
  );

  // 5. A soft row.
  const soft: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
    n: 1,
    band: 0,
    p: [Float64Array.from([1])],
    q: Float64Array.from([0]),
    rows: [{ index: [0], coef: [1], l: 1, u: Infinity, weight: 0.5 }],
  };
  TestValidator.predicate(
    "a soft row trades its penalty against the curvature",
    nclose(HumanQuadraticProgram.solve(soft).x[0]!, 0.5, AGREEMENT) &&
      nclose(
        HumanQuadraticProgram.value(soft, Float64Array.from([0.5])),
        0.375,
        1e-12,
      ),
  );
}

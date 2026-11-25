import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";
import { HumanArmTrajectoryKnots } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `HumanArmTrajectoryKnots.reduce` carries a subproblem in the frame grid's
 * steps onto the knots' position, velocity and acceleration steps by the
 * quintic weights `W`: `P_k = W' P W`, `q_k = W' q` and each row times `W`,
 * banded because a frame reads only its segment's two knots.
 *
 * Three knots at 0, 0.5 and 1 s with the middle one moving (its velocity and
 * acceleration as `span v` and `span² a`, span 0.5 s), one coordinate, and a
 * grid at quarter seconds: the inner frames at 0.25, 0.5 and 0.75 s read the
 * middle knot by `(0.5, −0.15625, 0.015625)`, `(1, 0, 0)` and `(0.5, 0.15625,
 * 0.015625)` (the quintic basis at its middle). The grid's curvature is the
 * identity, its linear term `(1, 2, 3)`, and one row holds the middle frame.
 *
 * Scenarios:
 *
 * 1. `q_k = W' q = (4, 0.3125, 0.0625)`.
 * 2. `P_k = W' W`: 1.5, 0 and 0.015625 on the position's row, 0.048828125 and 0 on
 *    the velocity's, 0.00048828125 on the acceleration's; its band is one
 *    knot's three values.
 * 3. The row on the middle frame reads the middle knot's position alone.
 */
export function test_motions_posture_arm_knot_reduce(): void {
  const knots: number[] = [0, 0.5, 1];
  const grid: number[] = [0, 0.25, 0.5, 0.75, 1];
  const model: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
    n: 3,
    band: 0,
    p: [0, 1, 2].map((): Float64Array => Float64Array.from([1])),
    q: Float64Array.from([1, 2, 3]),
    rows: [{ index: [1], coef: [1], l: 0, u: 0, key: "held" }],
  };
  const reduced: IAutoMovieMotionHumanQuadraticProgram.IProblem =
    HumanArmTrajectoryKnots.reduce(
      { width: 1, n: 3, open: false },
      HumanArmTrajectoryKnots.weights(knots, grid),
      model,
    );
  TestValidator.predicate(
    "the linear term",
    reduced.n === 3 &&
      nclose(reduced.q[0]!, 4, 1e-12) &&
      nclose(reduced.q[1]!, 0.3125, 1e-12) &&
      nclose(reduced.q[2]!, 0.0625, 1e-12),
  );
  const at = (i: number, j: number): number => reduced.p[i]![j - i] ?? 0;
  TestValidator.predicate(
    "the curvature and its band",
    reduced.band <= 2 &&
      nclose(at(0, 0), 1.5, 1e-12) &&
      nclose(at(0, 1), 0, 1e-12) &&
      nclose(at(0, 2), 0.015625, 1e-12) &&
      nclose(at(1, 1), 0.048828125, 1e-12) &&
      nclose(at(1, 2), 0, 1e-12) &&
      nclose(at(2, 2), 0.00048828125, 1e-12),
  );
  TestValidator.equals(
    "the held frame's row",
    [reduced.rows[0]!.index, reduced.rows[0]!.coef],
    [[0], [1]],
  );
}

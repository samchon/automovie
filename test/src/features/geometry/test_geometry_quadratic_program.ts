import { solveAutoMovieQuadraticProgram } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * Joint displacement is the constrained convex minimum, not independent clamps.
 * The two-variable optima follow from elementary Lagrange multipliers and the
 * one-variable cases from completing a square. No sampled portrait or stored
 * solver output supplies the expected answer.
 *
 * Scenarios:
 * 1. Equal masses split a required sum equally; a fourfold mass moves one fifth
 *    as far. A cap redirects travel to the other variable without losing contact.
 * 2. Linear terms move an unconstrained square's centre. A zero diagonal reduces
 *    a bounded problem to a linear minimum, and a zero row leaves it unchanged.
 * 3. Contradictory rows retain native infeasibility instead of claiming success.
 * 4. Repeated calls, a warm start and returned-buffer mutation cannot alter the
 *    input or leak state into a later solve. Both original residuals are small.
 */
export const test_geometry_quadratic_program = (): void => {
  const solve = solveAutoMovieQuadraticProgram;
  const row = (
    indices: number[],
    weights: number[],
    lower: number | null,
    upper: number | null,
  ) => ({ indices, weights, lower, upper });
  const check = (result: ReturnType<typeof solve>, expected: number[]) => {
    TestValidator.equals("native solved status", result.status, 1);
    TestValidator.predicate(
      "independent optimum",
      result.primal.every((v, i) => Math.abs(v - expected[i]) < 1e-6),
    );
    TestValidator.predicate(
      "original constraint residual",
      result.maximumViolation < 1e-7,
    );
    TestValidator.predicate(
      "original stationarity residual",
      result.stationarityResidual < 1e-7,
    );
  };
  const sum = row([0, 1], [1, 1], 1, null);
  check(solve({ diagonal: [1, 1], linear: [0, 0], rows: [sum] }), [0.5, 0.5]);
  const input = {
    diagonal: [1, 4],
    linear: [0, 0],
    rows: [sum],
    initial: [1, 1],
  };
  const original = structuredClone(input);
  const first = solve(input);
  check(first, [0.8, 0.2]);
  const second = solve(input);
  TestValidator.equals("deterministic native replay", second, first);
  first.primal[0] = 999;
  first.dual[0] = 999;
  check(solve(input), [0.8, 0.2]);
  TestValidator.equals("caller data unchanged", input, original);
  check(solve({ ...input, rows: [sum, row([0], [1], 0, 0.6)] }), [0.6, 0.4]);
  check(solve({ diagonal: [2, 8], linear: [-6, 16], rows: [] }), [3, -2]);
  check(
    solve({
      diagonal: [0],
      linear: [-1],
      rows: [
        row([0], [1], 0, 2),
        row([], [], null, null),
        row([0], [0], -1, 1),
      ],
    }),
    [2],
  );
  check(
    solve({ diagonal: [1], linear: [0], rows: [row([0], [1], 2, 2)] }),
    [2],
  );
  check(
    solve({ diagonal: [1], linear: [2], rows: [row([0], [1], null, 10)] }),
    [-2],
  );
  const infeasible = solve({
    diagonal: [1],
    linear: [0],
    rows: [row([0], [1], 2, null), row([0], [1], null, 1)],
  });
  TestValidator.equals(
    "contradictory constraints are infeasible",
    infeasible.status,
    3,
  );
  check(solve({ diagonal: [1], linear: [0], rows: [] }), [0]);
};

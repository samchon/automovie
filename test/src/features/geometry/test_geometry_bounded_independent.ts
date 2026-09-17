/**
 * A selected affine system splits the positive diagonal displacement objective
 * into participating variables and independent zero minima. These scenarios
 * exercise that exact decomposition through the actual contact scheduler, not
 * a copied presolver or a named portrait.
 */
import { solveAutoMovieBoundedDisplacement } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Pins elimination without losing later contacts or small genuine couplings.
 *
 * Scenarios:
 * 1. Only the middle coordinate participates; the other two have exact zero
 *    minima under their positive masses and caps, including an explicit zero term.
 * 2. A tiny nonzero coefficient retains its variable and forces its unit cap;
 *    the row tolerance is expressed in that small coefficient's units.
 * 3. An unsatisfied constant row is infeasible, while its adjacent zero lower
 *    bound is satisfied and needs no numerical iteration.
 */
export const test_geometry_bounded_independent = (): void => {
  const solve = solveAutoMovieBoundedDisplacement;
  const base: Parameters<typeof solve>[0] = {
    mass: [1, 4, 2],
    upper: [1, 1, 1],
    constraints: [
      {
        row: { indices: [0, 1], weights: [0, 1], lower: 1, upper: null },
        group: 0,
      },
    ],
    tolerance: 1e-7,
    maximumRounds: 40,
  };
  const original = structuredClone(base);
  const result = solve(base);
  TestValidator.equals(
    "independent variables are exact zeros",
    [result.travel[0], result.travel[2]],
    [0, 0],
  );
  TestValidator.predicate(
    "participating variable reaches cap",
    Math.abs(result.travel[1] - 1) < 1e-7,
  );
  TestValidator.equals("caller problem remains unchanged", base, original);
  const coupled = solve({
    ...base,
    tolerance: 1e-13,
    constraints: [
      {
        row: {
          indices: [1],
          weights: [1e-8],
          lower: 1e-8,
          upper: null,
        },
        group: 0,
      },
    ],
  });
  TestValidator.predicate(
    "tiny nonzero coupling is preserved",
    Math.abs(coupled.travel[1] - 1) < 1e-7,
  );
  for (const [indices, weights] of [
    [[], []],
    [[0], [0]],
  ]) {
    const constant = {
      ...base,
      constraints: [
        { row: { indices, weights, lower: 1, upper: null }, group: 0 },
      ],
    };
    TestValidator.predicate(
      "inconsistent constant refuses",
      throwsError(() => solve(constant), "constant rows"),
    );
    constant.constraints[0].row.lower = 0;
    TestValidator.equals(
      "adjacent constant admits exact zero",
      solve(constant).travel,
      [0, 0, 0],
    );
  }
};

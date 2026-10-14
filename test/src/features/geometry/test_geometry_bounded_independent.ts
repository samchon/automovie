import {
  type IAutoMovieQuadraticRow,
  solveAutoMovieBoundedDisplacement,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * Pins elimination without losing later contacts or small genuine couplings.
 * The positive diagonal objective leaves independent coordinates at zero;
 * the actual scheduler must preserve every genuinely coupled coordinate.
 *
 * Scenarios:
 * 1. Only the middle coordinate participates; the other two have exact zero
 *    minima under their positive masses and caps, including an explicit zero term.
 * 2. A tiny nonzero coefficient retains its variable and forces its unit cap;
 *    the row tolerance is expressed in that small coefficient's units.
 * 3. An unsatisfied constant row is infeasible, while its adjacent zero lower
 *    bound is satisfied and needs no numerical iteration.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the real bounded scheduler, checking exact zero minima for absent/zero-weight variables, the participating cap, unchanged input, preservation of a tiny genuine coupling, and refusal of an inconsistent constant beside an admitted zero constant.
 * @evidence contracts/testing.md#independent-expectations A positive diagonal objective minimizes unconstrained coordinates at zero; the middle lower bound equals its unit cap, and the 1e-8 coefficient with the same lower bound still requires unit travel. Constant zero cannot meet lower bound one but meets zero. These analytic minima are independent of presolver output; participating travel retains its 1e-7 numerical tolerance.
 * @evidence contracts/testing.md#distinguishing-cases Preserves explicit zero terms versus tiny nonzero coupling, untouched caller data, empty versus zero-weight constant rows and each adjacent zero lower bound. Group scheduling, general malformed problems and round exhaustion remain in bounded-displacement.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry reaches actual scheduler and pinned Clarabel WebAssembly source for active problems, so it is CPU/WebAssembly integration rather than a pure TypeScript solver test. It uses the existing inputs without consumer installation, native build, process, browser, GPU or dynamically registered cases.
 */
export function test_geometry_bounded_independent(): void {
  const solve: (input: {
    mass: readonly number[];
    upper: readonly number[];
    constraints: readonly { row: IAutoMovieQuadraticRow; group: number }[];
    tolerance: number;
    maximumRounds: number;
  }) => {
    travel: number[];
    violation: number;
    rounds: number;
    status: number | null;
  } = solveAutoMovieBoundedDisplacement;
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
  const original: {
    mass: readonly number[];
    upper: readonly number[];
    constraints: readonly { row: IAutoMovieQuadraticRow; group: number }[];
    tolerance: number;
    maximumRounds: number;
  } = structuredClone(base);
  const result: {
    travel: number[];
    violation: number;
    rounds: number;
    status: number | null;
  } = solve(base);
  TestValidator.predicate(
    "independent variables are exact zeros",
    equalGeometryTestValues([result.travel[0], result.travel[2]], [0, 0]),
  );
  TestValidator.predicate(
    "participating variable reaches cap",
    nclose(result.travel[1] - 1, 0, 1e-7) &&
      Math.abs(result.travel[1] - 1) < 1e-7,
  );
  TestValidator.predicate(
    "caller problem remains unchanged",
    equalGeometryTestValues(base, original),
  );
  const coupled: {
    travel: number[];
    violation: number;
    rounds: number;
    status: number | null;
  } = solve({
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
    nclose(coupled.travel[1] - 1, 0, 1e-7) &&
      Math.abs(coupled.travel[1] - 1) < 1e-7,
  );
  for (const [indices, weights] of [
    [[], []],
    [[0], [0]],
  ]) {
    const constant: {
      constraints: {
        row: {
          indices: number[];
          weights: number[];
          lower: number;
          upper: null;
        };
        group: number;
      }[];
      mass: readonly number[];
      upper: readonly number[];
      tolerance: number;
      maximumRounds: number;
    } = {
      ...base,
      constraints: [
        { row: { indices, weights, lower: 1, upper: null }, group: 0 },
      ],
    };
    TestValidator.predicate(
      "inconsistent constant refuses",
      throwsError(
        (): {
          travel: number[];
          violation: number;
          rounds: number;
          status: number | null;
        } => solve(constant),
        "constant rows",
      ),
    );
    constant.constraints[0].row.lower = 0;
    TestValidator.predicate(
      "adjacent constant admits exact zero",
      equalGeometryTestValues(solve(constant).travel, [0, 0, 0]),
    );
  }
}

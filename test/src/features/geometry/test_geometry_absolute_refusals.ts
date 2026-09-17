import { solveAutoMovieAbsoluteDisplacement } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * L1 admission and post-solve checks refuse invalid or unfinished geometry.
 * Invalid inputs are adjacent to the same independently known x=1 solution;
 * a successful retry ensures no numerical workspace survives a failed call.
 *
 * Scenarios:
 * 1. Nonpositive/nonfinite tolerances, weights, malformed fixed masks and invalid
 *    original rows refuse before reduction can hide their invalid coefficients.
 * 2. Both signs of an inconsistent constant refuse, including fixed variables.
 *    Contradictory intervals and native infeasibility remain failures.
 * 3. An inconsistent sub-tolerance native problem still fails its stricter
 *    original-row requirement; an overstrict objective gap refuses separately.
 */
export const test_geometry_absolute_refusals = (): void => {
  const solve = solveAutoMovieAbsoluteDisplacement;
  const base: Parameters<typeof solve>[0] = {
    weights: [1],
    fixed: [false],
    rows: [{ indices: [0], weights: [1], lower: 1, upper: null }],
    tolerance: 1e-7,
    relativeGap: 1e-7,
  };
  const refuse = (patch: Partial<typeof base>, message: string) => {
    TestValidator.predicate(
      message,
      throwsError(() => solve({ ...base, ...patch }), message),
    );
    TestValidator.predicate(
      "adjacent valid recovery",
      Math.abs(solve(base).travel[0] - 1) < 1e-7,
    );
  };
  for (const value of [0, -1, NaN, Infinity]) {
    refuse({ tolerance: value }, "tolerances");
    refuse({ relativeGap: value }, "tolerances");
  }
  for (const weights of [[0], [-1]]) refuse({ weights }, "positive weights");
  for (const weights of [[NaN], [Infinity]]) refuse({ weights }, "finite");
  refuse({ fixed: [] }, "fixed flags");
  refuse({ fixed: new Array<boolean>(1) }, "fixed flags");
  refuse({ weights: [], fixed: [], rows: [] }, "positive int32");
  refuse(
    {
      fixed: [true],
      rows: [{ indices: [0], weights: [NaN], lower: 0, upper: 0 }],
    },
    "finite",
  );
  refuse(
    { rows: [{ indices: [1], weights: [1], lower: 0, upper: 1 }] },
    "indices",
  );
  refuse({ fixed: [true] }, "constant rows");
  refuse(
    { rows: [{ indices: [0], weights: [0], lower: null, upper: -1 }] },
    "constant rows",
  );
  refuse(
    {
      rows: [
        ...base.rows,
        { indices: [0], weights: [1], lower: null, upper: 0 },
      ],
    },
    "ordered",
  );
  refuse(
    {
      rows: [
        ...base.rows,
        { indices: [0], weights: [-1], lower: 0, upper: null },
      ],
    },
    "status 2",
  );
  refuse(
    {
      tolerance: 1e-15,
      rows: [
        { indices: [0], weights: [1], lower: 1e-12, upper: null },
        { indices: [0], weights: [-1], lower: 0, upper: null },
      ],
    },
    "original-row tolerance",
  );
  refuse({ relativeGap: 1e-30 }, "objective-gap tolerance");
};

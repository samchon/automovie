import { solveAutoMovieAbsoluteDisplacement } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * Signed L1 travel preserves exact seam coordinates and coupled affine bounds.
 * The optima follow from elementary weighted absolute values, independently of
 * a face, cached solver result or the epigraph's implementation.
 *
 * Scenarios:
 * 1. Under x+y=3, weights (1,4) spend all positive travel on x. Fixing x moves
 *    all travel to y, and fixing every coordinate admits only a clear system.
 * 2. A negative bound produces negative travel. Exact-zero terms and duplicate
 *    left sides with different order retain the strongest interval endpoints.
 * 3. A tiny nonzero coefficient still forces its coordinate, including when
 *    other variables are fixed. Unconstrained coordinates minimize at zero.
 * 4. Input buffers remain unchanged and repeated solves return the same result.
 */
export const test_geometry_absolute_displacement = (): void => {
  const solve = solveAutoMovieAbsoluteDisplacement;
  const base: Parameters<typeof solve>[0] = {
    weights: [1, 4],
    fixed: [false, false],
    rows: [{ indices: [0, 1], weights: [1, 1], lower: 3, upper: 3 }],
    tolerance: 1e-7,
    relativeGap: 1e-7,
  };
  const check = (input: typeof base, expected: number[], objective: number) => {
    const result = solve(input);
    TestValidator.predicate(
      "independent L1 minimizer",
      result.travel.every((v, i) => Math.abs(v - expected[i]) < 1e-7),
    );
    TestValidator.predicate(
      "independent absolute objective",
      Math.abs(result.objective - objective) < 1e-7,
    );
    TestValidator.predicate(
      "complete original rows",
      result.maximumViolation <= input.tolerance,
    );
    return result;
  };
  const original = structuredClone(base),
    first = check(base, [3, 0], 3);
  TestValidator.equals("deterministic replay", solve(base), first);
  first.travel[0] = 123;
  check(base, [3, 0], 3);
  TestValidator.equals("caller data unchanged", base, original);
  const fixed = check({ ...base, fixed: [true, false] }, [0, 3], 12);
  TestValidator.equals("fixed is exact zero", fixed.travel[0], 0);
  const zero = check(
    {
      ...base,
      fixed: [true, true],
      rows: [
        { indices: [], weights: [], lower: null, upper: null },
        { indices: [0, 1], weights: [0, 1], lower: 0, upper: 0 },
      ],
    },
    [0, 0],
    0,
  );
  TestValidator.equals("all-fixed needs no kernel", zero.status, null);
  check(
    {
      ...base,
      rows: [
        { indices: [1, 0], weights: [0, 1], lower: -3, upper: null },
        { indices: [0], weights: [1], lower: -2, upper: -1 },
        { indices: [0], weights: [1], lower: -4, upper: -0.5 },
        { indices: [0], weights: [1], lower: null, upper: -1.5 },
        { indices: [], weights: [], lower: 0, upper: null },
      ],
    },
    [-1.5, 0],
    1.5,
  );
  check(
    {
      ...base,
      fixed: [true, false],
      rows: [{ indices: [1], weights: [1e-8], lower: 1e-8, upper: 1e-8 }],
    },
    [0, 1],
    4,
  );
  check({ ...base, rows: [] }, [0, 0], 0);
};

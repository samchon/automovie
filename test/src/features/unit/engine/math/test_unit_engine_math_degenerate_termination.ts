import {
  assignAutoMovieMinimumCost,
  bracketedBisection,
  polishAutoMovieQuadraticProgram,
  solveAutoMovieQuadraticProgram,
} from "@automovie/engine";
import type { IAutoMovieSolveQuadraticProgram } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * The math searches whose loops end on a computed value end on every finite
 * input, including the degenerate ones that once never ended.
 *
 * Scenarios:
 *
 * 1. Bisection of `x < 1 + 2^-52` between the adjacent doubles 1 and `1 + 2^-52`
 *    to a tolerance of 1e-30, below their spacing, returns `1 + 2^-52` without
 *    a reading: no double lies between the ends.
 * 2. Bisection of `x * x < 2` on [0, 2] to 1e-300 stops at the adjacent doubles
 *    around the square root of two: the result squares to at least 2, lies
 *    within one spacing (2^-52) of it, and the readings stay within the 2099
 *    halvings the double range allows (about 52 here).
 * 3. Bisection of `x < 1.5e308` on [1e308, 1.7e308], whose ends' sum overflows, to
 *    1e292 returns a point within 1e292 above 1.5e308.
 * 4. The ordinary bisection of scenario 2 to 1e-12 keeps its 41 readings.
 * 5. Two rows `[-1e308, 1e308]`, finite but with reduced costs that overflow
 *    binary64, are refused with the overflow error; the table `[[4, 1], [2,
 *    3]]` still assigns row 0 to column 1 and row 1 to 0.
 * 6. Polishing with a zero budget still returns the native primal unaccepted.
 *
 */
export function test_unit_engine_math_degenerate_termination(): void {
  // 1. Adjacent ends.
  const next: number = 1 + 2 ** -52;
  let adjacentReads: number = 0;
  TestValidator.equals(
    "adjacent ends return the failing end",
    bracketedBisection(
      (x: number): boolean => {
        adjacentReads++;
        return x < next;
      },
      1,
      next,
      1e-30,
    ),
    next,
  );
  TestValidator.equals("adjacent ends read nothing", adjacentReads, 0);

  // 2. A tolerance below the spacing at the boundary.
  let fineReads: number = 0;
  const fine: number = bracketedBisection(
    (x: number): boolean => {
      fineReads++;
      return x * x < 2;
    },
    0,
    2,
    1e-300,
  );
  TestValidator.predicate(
    "a sub-ulp tolerance stops at the adjacent doubles",
    fine * fine >= 2 && fine - Math.SQRT2 <= 2 ** -52 && fineReads <= 2099,
  );

  // 3. Ends whose sum overflows.
  const huge: number = bracketedBisection(
    (x: number): boolean => x < 1.5e308,
    1e308,
    1.7e308,
    1e292,
  );
  TestValidator.predicate(
    "an overflowing midpoint is halved first",
    huge >= 1.5e308 && huge - 1.5e308 <= 1e292,
  );

  // 4. The ordinary count stays.
  let ordinaryReads: number = 0;
  bracketedBisection(
    (x: number): boolean => {
      ordinaryReads++;
      return x * x < 2;
    },
    0,
    2,
    1e-12,
  );
  TestValidator.equals("ordinary halvings", ordinaryReads, 41);

  // 5. Potentials that overflow.
  TestValidator.predicate(
    "overflowing reduced costs are refused",
    throwsError(
      (): unknown =>
        assignAutoMovieMinimumCost([
          [-1e308, 1e308],
          [-1e308, 1e308],
        ]),
      "overflow",
    ),
  );
  TestValidator.equals(
    "an ordinary table keeps its optimum",
    assignAutoMovieMinimumCost([
      [4, 1],
      [2, 3],
    ]),
    [1, 0],
  );

  // 6. Polishing budgets.
  const input: IAutoMovieSolveQuadraticProgram.IInput = {
    diagonal: [1],
    linear: [-1],
    rows: [],
  };
  const native: IAutoMovieSolveQuadraticProgram.IResult =
    solveAutoMovieQuadraticProgram(input);
  const polish = (
    maximumRefinements: number,
  ): ReturnType<typeof polishAutoMovieQuadraticProgram> =>
    polishAutoMovieQuadraticProgram(
      input,
      native,
      { tolerance: 1e-9, maximumRefinements },
      [],
      (): number => 0,
      (primal: readonly number[]): number[] => primal.map((): number => 0),
      (): number => 0,
      true,
    );
  TestValidator.predicate(
    "a zero budget returns the native primal unaccepted",
    polish(0).accepted === false,
  );
}

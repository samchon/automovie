import type {
  AutoMovieVector2Tuple,
  IAutoMovieCompactCurveApproximation,
  IAutoMoviePiecewisePlanarCurveSource,
} from "@automovie/interface";
import { AutoMovieRecoveryCompactApproximation as C, AutoMovieRecoveryConicApproximation as Q } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `approximateRecoveryCompactCurves` merges source pieces into the
 * fewest polynomial pieces that meet the tolerance.
 *
 * Scenarios:
 *
 * 1. An affine image of the cubic y = t^2 + 0.1 t^3 cut at fifteen interior
 *    knots collapses to one complete cubic piece that reproduces the source to
 *    1e-9 at 138 nodes.
 * 2. The quintic (t, t^5) fits one complete quintic piece at degree five, and a
 *    cubic held to one piece cannot meet the tolerance, so it is refused.
 * 3. An invalid query budget or nonfinite knot is refused before sampling.
 */
export function test_recovery_curves_approximate_compact_curves(): void {
  const options: IAutoMovieCompactCurveApproximation.IOptions = {
    toleranceMm: 1e-4,
    degree: 3,
    maximumPieces: 128,
    maximumDepth: 12,
    maximumQueries: 100000,
  };
  const knots: number[] = Array.from(
    { length: 15 },
    (_v: unknown, i: number): number => (i + 1) / 16,
  );
  const cubic: IAutoMoviePiecewisePlanarCurveSource = {
    domain: { start: 0, end: 1 },
    knots,
    breaks: [],
    closed: false,
    evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => {
      const y: number = t * t + 0.1 * t ** 3;
      return [250 + 3 * t + 2 * y, -400 - t + 4 * y];
    },
    derivative: (
      t: number,
      order: 1 | 2 | 3 | 4 | 5,
    ): Readonly<AutoMovieVector2Tuple> => {
      const y: number =
        order === 1
          ? 2 * t + 0.3 * t * t
          : order === 2
            ? 2 + 0.6 * t
            : order === 3
              ? 0.6
              : 0;
      return [
        3 * (order === 1 ? 1 : 0) + 2 * y,
        -(order === 1 ? 1 : 0) + 4 * y,
      ];
    },
  };
  const fitted: IAutoMovieCompactCurveApproximation.IResult = C.approximate(
    cubic,
    options,
  );
  for (const maximumQueries of [NaN, Infinity, 1.5]) {
    const refusal: IAutoMovieCompactCurveApproximation.IResult = C.approximate(
      cubic,
      { ...options, maximumQueries },
    );
    TestValidator.predicate(
      `invalid query budget ${maximumQueries} refuses before sampling`,
      refusal.status === "refused" && refusal.queries === 0,
    );
  }
  const invalidKnot: IAutoMovieCompactCurveApproximation.IResult = C.approximate(
    { ...cubic, knots: [NaN] },
    options,
  );
  TestValidator.predicate(
    "a nonfinite source knot refuses before sampling",
    invalidKnot.status === "refused" && invalidKnot.queries === 0,
  );
  TestValidator.equals("cubic complete", fitted.status, "complete");
  TestValidator.equals("sixteen pieces become one", fitted.pieces.length, 1);
  for (let i: number = 0; i <= 137; ++i)
    TestValidator.predicate(
      "the cubic is reproduced",
      Q.distance(C.evaluate(fitted.pieces[0]!, i / 137), cubic.evaluate(i / 137)) <
        1e-9,
    );

  const quintic: IAutoMoviePiecewisePlanarCurveSource = {
    domain: { start: 0, end: 1 },
    knots,
    breaks: [],
    closed: false,
    evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [t, t ** 5],
    derivative: (
      t: number,
      order: 1 | 2 | 3 | 4 | 5,
    ): Readonly<AutoMovieVector2Tuple> => [
      order === 1 ? 1 : 0,
      [0, 5, 20, 60, 120, 120][order]! * t ** (5 - order),
    ],
  };
  const high: IAutoMovieCompactCurveApproximation.IResult = C.approximate(
    quintic,
    { ...options, degree: 5 },
  );
  TestValidator.equals("one quintic piece", high.pieces.length, 1);
  TestValidator.equals("quintic complete", high.status, "complete");
  TestValidator.equals(
    "a one-piece cubic cannot meet the tolerance",
    C.approximate(quintic, { ...options, maximumPieces: 1 }).status,
    "refused",
  );
}

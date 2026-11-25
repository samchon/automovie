import type {
  AutoMovieVector2Tuple,
  IAutoMovieConicApproximation,
  IAutoMoviePlanarCurveSource,
  IAutoMovieRegisteredConicArc,
} from "@automovie/interface";
import { approximateAutoMovieRecoveryConicsAhn as approximate } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { RecoveryConicSources } from "../../internal/RecoveryConicSources";
import { evaluateRecoveryConicArc } from "../../internal/evaluateRecoveryConicArc";
import { measureRecoveryCurveNearest } from "../../internal/measureRecoveryCurveNearest";
import { nclose } from "../../internal/nclose";

/**
 * A near-flat stretch between two close inflections far from the origin, which
 * bends by less than its coordinates' roundoff, is covered by the Ahn
 * adaptation as the collinear primitive within the tolerance.
 *
 * Scenarios:
 *
 * 1. The stretch is covered without a gap and its middle is the collinear
 *    primitive.
 * 2. A stretch beyond the tolerance of its chord is not drawn straight.
 */
export function test_recovery_curves_approximate_conics_ahn_near_flat(): void {
  const options: IAutoMovieConicApproximation.IOptions =
    RecoveryConicSources.options();

  // A near-flat stretch between two close inflections, far from the origin. y = c (t^4 / 12 - d^2 t^2 / 2) has y'' = c (t^2 - d^2):
  // inflections at -d and d, supplied as breaks, and between them a bend whose sagitta, about 5 c d^4 / 24 = 2e-13, lies under the
  // roundoff of coordinates near 1e6 (an ulp of 1.2e-10), while its end tangents differ by 4 c d^3 / 3 = 1.3e-9 rad, far above roundoff.
  // Its samples then fall either side of its chord by roundoff and no control triangle holds them at any depth. It lies within the
  // tolerance of its chord, so it is converted, as the contract's collinear primitive, and the whole chart is covered.
  const c: number = 1,
    d: number = 1e-3;
  const shallow: IAutoMoviePlanarCurveSource = {
    domain: [-0.5, 0.5],
    breaks: [-d, d],
    closed: false,
    evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [
      1e6 + t,
      -1e6 + c * (t ** 4 / 12 - (d * d * t * t) / 2),
    ],
    derivative: (
      t: number,
      order: 1 | 2 | 3 | 4 | 5,
    ): Readonly<AutoMovieVector2Tuple> =>
      order === 1
        ? [1, c * (t ** 3 / 3 - d * d * t)]
        : order === 2
          ? [0, c * (t * t - d * d)]
          : order === 3
            ? [0, 2 * c * t]
            : order === 4
              ? [0, 2 * c]
              : [0, 0],
  };
  const flat: IAutoMovieConicApproximation.IResult = approximate(
    shallow,
    options,
  );
  TestValidator.equals("near-flat stretch complete", flat.status, "complete");
  let reached: number = shallow.domain[0];
  for (const arc of flat.arcs) {
    TestValidator.predicate(
      "near-flat no source gap",
      nclose(arc.domain[0], reached, 0),
    );
    for (let i: number = 0; i <= 97; ++i) {
      const t: number =
        arc.domain[0] + ((arc.domain[1] - arc.domain[0]) * i) / 97;
      TestValidator.predicate(
        "near-flat held-out source to primitive",
        measureRecoveryCurveNearest(
          shallow.evaluate(t),
          (u: number): Readonly<AutoMovieVector2Tuple> =>
            evaluateRecoveryConicArc(arc, u),
          0,
          1,
        ) <= options.toleranceMm,
      );
    }
    reached = arc.domain[1];
  }
  TestValidator.predicate(
    "near-flat reaches final endpoint",
    nclose(reached, shallow.domain[1], 0),
  );
  const middle: IAutoMovieRegisteredConicArc | undefined = flat.arcs.find(
    (arc: IAutoMovieRegisteredConicArc): boolean => arc.domain[0] === -d,
  );
  TestValidator.predicate(
    "near-flat middle is the collinear primitive",
    middle !== undefined && middle.domain[1] === d && middle.weight === 1,
  );
  // A curved stretch whose chord leaves its samples farther than the tolerance is still subdivided, not drawn straight: the same chart
  // at a tolerance under its middle's sagitta measured at unit scale.
  const unshifted: IAutoMovieConicApproximation.IResult = approximate(
    {
      ...shallow,
      evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [
        t,
        c * (t ** 4 / 12 - (d * d * t * t) / 2),
      ],
    },
    { ...options, toleranceMm: 1e-14 },
  );
  TestValidator.predicate(
    "curved stretch under a tighter tolerance is not a line",
    unshifted.arcs
      .filter(
        (arc: IAutoMovieRegisteredConicArc): boolean =>
          arc.domain[0] >= -d && arc.domain[1] <= d,
      )
      .every(
        (arc: IAutoMovieRegisteredConicArc): boolean =>
          arc.maximumSampleErrorMm <= 1e-14,
      ),
  );
}

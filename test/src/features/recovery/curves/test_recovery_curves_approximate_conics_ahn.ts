import type {
  AutoMovieVector2Tuple,
  IAutoMovieConicApproximation,
  IAutoMoviePlanarCurveSource,
  IAutoMovieRegisteredConicArc,
} from "@automovie/interface";
import { AutoMovieRecoveryConicApproximation } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { RecoveryConicSources } from "../../internal/RecoveryConicSources";
import { evaluateRecoveryConicArc } from "../../internal/evaluateRecoveryConicArc";
import { nclose } from "../../internal/nclose";

/**
 * Verify the declared sampled Ahn adaptation against analytic planar curves.
 *
 * Scenarios:
 *
 * 1. Quarter circles and ellipses reproduce their exact conic and analytic locus.
 * 2. A parabola has weight one; a straight source admits a collinear primitive.
 * 3. Reused source tuples cannot alter saved coefficients.
 */
export function test_recovery_curves_approximate_conics_ahn(): void {
  const options: IAutoMovieConicApproximation.IOptions =
    RecoveryConicSources.options();

  // The geometric oracle follows the analytic ellipse rather than comparing
  // the fitter with samples or coefficients copied from its own output.
  for (const [a, b] of [
    [1, 1],
    [12, 3],
  ] as const) {
    const ellipse: IAutoMoviePlanarCurveSource = {
      domain: [0, Math.PI / 2],
      breaks: [],
      closed: false,
      evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [
        a * Math.cos(t),
        b * Math.sin(t),
      ],
      derivative: (
        t: number,
        order: 1 | 2 | 3 | 4 | 5,
      ): Readonly<AutoMovieVector2Tuple> => [
        a * Math.cos(t + (order * Math.PI) / 2),
        b * Math.sin(t + (order * Math.PI) / 2),
      ],
    };
    const result: IAutoMovieConicApproximation.IResult = AutoMovieRecoveryConicApproximation.approximateAhn(
      ellipse,
      options,
    );
    TestValidator.equals("ellipse complete", result.status, "complete");
    TestValidator.equals("ellipse single conic", result.arcs.length, 1);
    TestValidator.equals(
      "sample evidence is not a certificate",
      result.certified,
      false,
    );
    const arc: IAutoMovieRegisteredConicArc = result.arcs[0]!;
    TestValidator.predicate(
      "ellipse fullness",
      nclose(arc.weight, Math.SQRT1_2, 1e-11),
    );
    for (let i: number = 0; i <= 97; ++i) {
      const q: Readonly<AutoMovieVector2Tuple> = evaluateRecoveryConicArc(
        arc,
        i / 97,
      );
      TestValidator.predicate(
        "ellipse analytic locus",
        nclose((q[0] / a) ** 2 + (q[1] / b) ** 2, 1, 1e-11),
      );
    }
  }
  const parabola: IAutoMoviePlanarCurveSource = {
    domain: [-1, 1],
    breaks: [],
    closed: false,
    evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [t, t * t],
    derivative: (
      t: number,
      order: 1 | 2 | 3 | 4 | 5,
    ): Readonly<AutoMovieVector2Tuple> =>
      order === 1 ? [1, 2 * t] : order === 2 ? [0, 2] : [0, 0],
  };
  const parabolic: IAutoMovieConicApproximation.IResult = AutoMovieRecoveryConicApproximation.approximateAhn(
    parabola,
    options,
  );
  TestValidator.equals("parabola complete", parabolic.status, "complete");
  TestValidator.equals("parabola single conic", parabolic.arcs.length, 1);
  TestValidator.predicate(
    "parabola weight",
    nclose(parabolic.arcs[0]!.weight, 1, 1e-12),
  );
  for (let i: number = 0; i <= 97; ++i) {
    const q: Readonly<AutoMovieVector2Tuple> = evaluateRecoveryConicArc(
      parabolic.arcs[0]!,
      i / 97,
    );
    TestValidator.predicate(
      "parabola analytic locus",
      nclose(q[1], q[0] * q[0], 1e-11),
    );
  }
  const line: IAutoMoviePlanarCurveSource = RecoveryConicSources.line;
  const linear: IAutoMovieConicApproximation.IResult = AutoMovieRecoveryConicApproximation.approximateAhn(
    line,
    options,
  );
  TestValidator.equals("line complete", linear.status, "complete");
  TestValidator.equals("line single primitive", linear.arcs.length, 1);
  TestValidator.predicate(
    "line unit weight",
    nclose(linear.arcs[0]!.weight, 1, 0),
  );
  const scratch: [number, number] = [0, 0];
  const borrowed: IAutoMovieConicApproximation.IResult = AutoMovieRecoveryConicApproximation.approximateAhn(
    {
      domain: [0, 1],
      breaks: [],
      closed: false,
      evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => {
        scratch[0] = 2 * t;
        scratch[1] = 3 * t;
        return scratch;
      },
      derivative: (
        _t: number,
        order: 1 | 2 | 3 | 4 | 5,
      ): Readonly<AutoMovieVector2Tuple> => (order === 1 ? [2, 3] : [0, 0]),
    },
    options,
  );
  scratch[0] = 999;
  scratch[1] = 999;
  TestValidator.equals(
    "scratch tuple line complete",
    borrowed.status,
    "complete",
  );
  TestValidator.predicate(
    "returned controls own their coordinates",
    nclose(borrowed.arcs[0]!.controls[0][0], 0, 0) &&
      nclose(borrowed.arcs[0]!.controls[2][1], 3, 0),
  );
}

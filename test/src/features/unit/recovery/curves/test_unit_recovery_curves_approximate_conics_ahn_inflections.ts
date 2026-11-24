import type {
  AutoMovieVector2Tuple,
  IAutoMovieConicApproximation,
  IAutoMoviePlanarCurveSource,
  IAutoMovieRegisteredConicArc,
} from "@automovie/interface";
import { approximateAutoMovieRecoveryConicsAhn as approximate } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { RecoveryConicSources } from "../../../internal/RecoveryConicSources";
import { evaluateRecoveryConicArc } from "../../../internal/evaluateRecoveryConicArc";
import { measureRecoveryCurveNearest } from "../../../internal/measureRecoveryCurveNearest";
import { nclose } from "../../../internal/nclose";

/**
 * The Ahn adaptation splits at a supplied inflection and fits a nonconic within
 * its tolerance.
 *
 * Scenarios:
 *
 * 1. A cubic inflection splits at its supplied boundary without crossing it.
 * 2. A nonconic cubic meets a separate dense bidirectional distance check.
 */
export function test_unit_recovery_curves_approximate_conics_ahn_inflections(): void {
  const options: IAutoMovieConicApproximation.IOptions =
    RecoveryConicSources.options();

  const cubic: IAutoMoviePlanarCurveSource = RecoveryConicSources.cubic;
  const inflected: IAutoMovieConicApproximation.IResult = approximate(
    cubic,
    options,
  );
  TestValidator.equals("inflection complete", inflected.status, "complete");
  TestValidator.predicate(
    "inflection separated",
    inflected.arcs.length >= 2 &&
      inflected.arcs.every(
        (arc: IAutoMovieRegisteredConicArc): boolean =>
          arc.domain[1] <= 0 || arc.domain[0] >= 0,
      ),
  );
  TestValidator.predicate(
    "full inflection coverage",
    nclose(inflected.arcs[0]!.domain[0], -1, 0) &&
      nclose(inflected.arcs.at(-1)!.domain[1], 1, 0),
  );
  const convex: IAutoMoviePlanarCurveSource = RecoveryConicSources.convex;
  const fitted: IAutoMovieConicApproximation.IResult = approximate(
    convex,
    options,
  );
  TestValidator.equals("nonconic complete", fitted.status, "complete");
  let previous: number = convex.domain[0];
  for (const arc of fitted.arcs) {
    TestValidator.predicate(
      "nonconic no source gap",
      nclose(arc.domain[0], previous, 0),
    );
    for (let i: number = 0; i <= 97; ++i) {
      const t: number =
        arc.domain[0] + ((arc.domain[1] - arc.domain[0]) * i) / 97;
      const source: Readonly<AutoMovieVector2Tuple> = convex.evaluate(t);
      const conic: Readonly<AutoMovieVector2Tuple> = evaluateRecoveryConicArc(
        arc,
        i / 97,
      );
      TestValidator.predicate(
        "held-out source to conic",
        measureRecoveryCurveNearest(
          source,
          (u: number): Readonly<AutoMovieVector2Tuple> =>
            evaluateRecoveryConicArc(arc, u),
          0,
          1,
        ) <= options.toleranceMm,
      );
      TestValidator.predicate(
        "held-out conic to source",
        measureRecoveryCurveNearest(
          conic,
          convex.evaluate,
          arc.domain[0],
          arc.domain[1],
        ) <= options.toleranceMm,
      );
    }
    previous = arc.domain[1];
  }
  TestValidator.predicate(
    "nonconic reaches final endpoint",
    nclose(previous, convex.domain[1], 0),
  );
}

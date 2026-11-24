import type {
  AutoMovieVector2Tuple,
  IAutoMovieConicApproximation,
  IAutoMoviePlanarCurveSource,
} from "@automovie/interface";
import { approximateAutoMovieRecoveryConicsAhn as approximate } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { RecoveryConicSources } from "../../../internal/RecoveryConicSources";
import { nclose } from "../../../internal/nclose";

/**
 * The Ahn adaptation keeps a translated chart and exact one-sided corner jets.
 *
 * Scenarios:
 *
 * 1. A straight chart translated a million millimetres keeps one primitive and its
 *    source endpoints.
 * 2. A corner at a supplied break gives two exact primitives that keep each side's
 *    tangent, asking for both one-sided second-order jets.
 */
export function test_unit_recovery_curves_approximate_conics_ahn_corners(): void {
  const options: IAutoMovieConicApproximation.IOptions =
    RecoveryConicSources.options();

  const line: IAutoMoviePlanarCurveSource = RecoveryConicSources.line;
  const translated: IAutoMovieConicApproximation.IResult = approximate(
    {
      ...line,
      domain: [0, 1],
      evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [
        1e6 + 2 * t,
        -1e6 + 3 * t,
      ],
      derivative: (
        _t: number,
        order: 1 | 2 | 3 | 4 | 5,
      ): Readonly<AutoMovieVector2Tuple> => (order === 1 ? [2, 3] : [0, 0]),
    },
    options,
  );
  TestValidator.equals(
    "translated line complete",
    translated.status,
    "complete",
  );
  TestValidator.equals(
    "translated line same primitive count",
    translated.arcs.length,
    1,
  );
  TestValidator.predicate(
    "translated line source endpoints",
    nclose(translated.arcs[0]!.controls[0][0], 1e6, 0) &&
      nclose(translated.arcs[0]!.controls[2][1], -1e6 + 3, 0),
  );
  const leftSecondJets: string[] = [];
  const corner: IAutoMoviePlanarCurveSource = {
    domain: [-1, 1],
    breaks: [0],
    closed: false,
    evaluate: (t: number): Readonly<AutoMovieVector2Tuple> =>
      t <= 0 ? [t, t * t] : [t, -t],
    derivative: (
      t: number,
      order: 1 | 2 | 3 | 4 | 5,
      side?: "left" | "right",
    ): Readonly<AutoMovieVector2Tuple> => {
      const left: boolean = t < 0 || (t === 0 && side === "left");
      if (t === 0 && order === 2) leftSecondJets.push(side ?? "none");
      return order === 1
        ? left
          ? [1, 2 * t]
          : [1, -1]
        : order === 2 && left
          ? [0, 2]
          : [0, 0];
    },
  };
  const cornered: IAutoMovieConicApproximation.IResult = approximate(
    corner,
    options,
  );
  TestValidator.equals("corner complete", cornered.status, "complete");
  TestValidator.equals("corner exact primitives", cornered.arcs.length, 2);
  TestValidator.predicate(
    "corner left tangent preserved",
    nclose(cornered.arcs[0]!.controls[1][1], 0, 1e-12),
  );
  TestValidator.predicate(
    "corner right tangent preserved",
    nclose(cornered.arcs[1]!.controls[1][1], -0.5, 1e-12),
  );
  TestValidator.predicate(
    "corner second-order incident jets",
    leftSecondJets.includes("left") && leftSecondJets.includes("right"),
  );
}

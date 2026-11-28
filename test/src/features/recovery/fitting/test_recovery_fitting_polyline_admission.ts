import type { IAutoMoviePolylineFitInput } from "@automovie/interface";
import { AutoMovieRecoveryBezierFit } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * Checks ordered polyline admission before the Bezier fitter reads a corner or
 * emits a span.
 *
 * Scenarios:
 *
 * 1. A two-point, three-millimetre segment uses the one allowed span.
 * 2. Malformed tolerances, span counts, corner indices and coordinates fail with
 *    their own admission diagnostics and emit no correspondence.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the shortest valid open polyline and each invalid numeric boundary.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the package fitter with one typed segment and single-field variations and observes its returned span, diagnostic and correspondence callback.
 * @evidence contracts/development/testing.md#independent-expectations The endpoint separation is three millimetres and requires one span. Safe-integer bounds reject fractional, nonfinite and unsafe counts regardless of the observed fit.
 */
export function test_recovery_fitting_polyline_admission(): void {
  const source: IAutoMoviePolylineFitInput = {
    name: "three-mm-line",
    pointsMm: [
      [0, 0, 0],
      [3, 0, 0],
    ],
    closed: false,
    corners: [],
    toleranceMm: 0.1,
    maxSpans: 1,
    parameterization: "chord",
  };
  const fitted = AutoMovieRecoveryBezierFit.fit(source);
  TestValidator.equals("one span", fitted.curve.spans.length, 1);
  TestValidator.predicate(
    "three-millimetre physical phase",
    nclose(fitted.curve.phaseIntervals[0]!, 3),
  );

  const cases: [Partial<IAutoMoviePolylineFitInput>, string][] = [
    [{ toleranceMm: Infinity }, "positive finite tolerance"],
    [{ maxSpans: NaN }, "positive safe-integer span budget"],
    [{ maxSpans: 1.5 }, "positive safe-integer span budget"],
    [{ maxSpans: Infinity }, "positive safe-integer span budget"],
    [
      { maxSpans: Number.MAX_SAFE_INTEGER + 1 },
      "positive safe-integer span budget",
    ],
    [{ corners: [0.5] }, "Corner index does not address an observation"],
    [{ corners: [NaN] }, "Corner index does not address an observation"],
    [
      {
        pointsMm: [
          [0, 0, 0],
          [3, Infinity, 0],
        ],
      },
      "finite ordered physical observations",
    ],
  ];
  let observations: number = 0;
  const missed: string[] = [];
  for (const [override, diagnostic] of cases) {
    if (
      !throwsError(
        (): unknown =>
          AutoMovieRecoveryBezierFit.fit({ ...source, ...override }, () => {
            observations++;
          }),
        diagnostic,
      )
    )
      missed.push(`${Object.keys(override)[0]}: ${diagnostic}`);
  }
  TestValidator.equals("all invalid inputs fail at admission", missed, []);
  TestValidator.equals(
    "admission publishes no correspondence",
    observations,
    0,
  );
}

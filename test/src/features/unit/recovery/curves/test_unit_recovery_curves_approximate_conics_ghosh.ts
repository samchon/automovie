import type {
  AutoMovieVector2Tuple,
  IAutoMovieConicApproximation,
  IAutoMoviePlanarCurveSource,
  IAutoMovieRegisteredConicArc,
} from "@automovie/interface";
import {
  AutoMovieRecoveryConicApproximation as C,
  approximateAutoMovieRecoveryConicsGhosh as approximate,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `approximateAutoMovieRecoveryConicsGhosh` returns the endpoint-bitangent
 * conic of a smooth planar chart, never crossing a source break, and refuses
 * to call a chart complete when its arc budget is zero.
 *
 * Scenarios:
 *
 * 1. A quarter ellipse 40 by 20 and a reversed quarter circle of radius 25 each
 *    give one complete, uncertified arc of weight cos(pi / 4), whose points
 *    satisfy (x / rx)^2 + (y / ry)^2 = 1.
 * 2. The graph y = exp(t) over [0, 0.8], broken at 0.3, is complete and no arc
 *    spans the break, and the source's break list is not changed.
 * 3. A zero arc budget is not complete.
 */
export function test_unit_recovery_curves_approximate_conics_ghosh(): void {
  const options: IAutoMovieConicApproximation.IOptions = {
    toleranceMm: 0.0001,
    maximumArcs: 128,
    maximumDepth: 14,
  };
  for (const direction of [1, -1]) {
    const rx: number = direction === 1 ? 40 : 25;
    const ry: number = direction === 1 ? 20 : 25;
    const ellipse: IAutoMoviePlanarCurveSource = {
      domain: [0, Math.PI / 2],
      breaks: [],
      closed: false,
      evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [
        rx * Math.cos(t),
        direction * ry * Math.sin(t),
      ],
      derivative: (
        t: number,
        order: 1 | 2 | 3 | 4 | 5,
      ): Readonly<AutoMovieVector2Tuple> => [
        rx * Math.cos(t + (order * Math.PI) / 2),
        direction * ry * Math.sin(t + (order * Math.PI) / 2),
      ],
    };
    const result: IAutoMovieConicApproximation.IResult = approximate(
      ellipse,
      options,
    );
    TestValidator.equals("ellipse complete", result.status, "complete");
    TestValidator.equals("one bitangent conic", result.arcs.length, 1);
    TestValidator.equals("sampled, not certified", result.certified, false);
    const arc: IAutoMovieRegisteredConicArc = result.arcs[0]!;
    TestValidator.predicate(
      "quarter-conic weight",
      nclose(arc.weight, Math.SQRT1_2, 1e-6),
    );
    for (let i: number = 0; i <= 97; ++i) {
      const p: Readonly<AutoMovieVector2Tuple> = C.evaluate(arc, i / 97);
      TestValidator.predicate(
        "analytic implicit conic",
        nclose((p[0] / rx) ** 2 + (p[1] / ry) ** 2, 1, 1e-6),
      );
    }
  }

  const exponential: IAutoMoviePlanarCurveSource = {
    domain: [0, 0.8],
    breaks: [0.3],
    closed: false,
    evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [
      t,
      Math.exp(t),
    ],
    derivative: (
      t: number,
      order: 1 | 2 | 3 | 4 | 5,
    ): Readonly<AutoMovieVector2Tuple> => [order === 1 ? 1 : 0, Math.exp(t)],
  };
  const fit: IAutoMovieConicApproximation.IResult = approximate(
    exponential,
    options,
  );
  TestValidator.equals("broken graph complete", fit.status, "complete");
  TestValidator.predicate(
    "no arc spans the break",
    fit.arcs.every(
      (arc: IAutoMovieRegisteredConicArc): boolean =>
        !(arc.domain[0] < 0.3 && arc.domain[1] > 0.3),
    ),
  );
  TestValidator.equals("break list unchanged", exponential.breaks, [0.3]);

  TestValidator.predicate(
    "a zero arc budget is not complete",
    approximate(exponential, { ...options, maximumArcs: 0 }).status !==
      "complete",
  );
}

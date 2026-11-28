import { AutoMovieEngineLoftChain, AutoMovieEngineSplineCurve } from "@automovie/engine";
import type { IAutoMovieLoftChain } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `AutoMovieEngineLoftChain` reads a chain of section layers along its stations: the
 * section coefficients by the Hermite rule (`coefficients`, `derivative`), the
 * principal interval (`bracket`), the plane (`frame`), the central axis
 * (`axis`, the section's control-point mean placed in its plane), plane
 * coordinates of world points (`local`), a ring of world points (`ring`) and
 * one section (`section`).
 *
 * Fixture: two horizontal layers at 0 and 10 mm of an order-4 spline chain, a
 * radius-2 section centred at (1, 3) and the same centred at (2, 3), each layer
 * carrying the slope (difference / 10) that makes the Hermite rule linear.
 *
 * Scenarios:
 *
 * 1. At 2.5 mm the coefficients are a quarter of the way, the derivative the
 *    difference over 10, and the bracket [0, 1]; the top layer also belongs to
 *    [0, 1]; 11 mm is refused.
 * 2. The frame at 2.5 is horizontal through y = 2.5; the axis is (1.25, 2.5, 3).
 * 3. `local` of the world point (4, 2.5, 3) is (4, 3); the ring at phases 0 and pi
 *    lies in y = 2.5; no layer lifts, so `lift` is null.
 * 4. `section` of a spline chain is `AutoMovieEngineSplineCurve.evaluate`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names Hermite coefficients, bracket, world frame, axis, local projection, ring and section results.
 * @evidence contracts/development/testing.md#behavioral-verification Calls each chain reader on two authored horizontal layers and evaluates points in their encoded station coordinates.
 * @evidence contracts/development/testing.md#independent-expectations The given endpoint slopes make the Hermite interpolant linear. At 2.5 mm it is one quarter of the change, so the centre and section frame are known independently.
 */
export function test_engine_geometry_loft_chain_reads(): void {
  const a: number[] = [3, 1, -1, 1, 3, 5, 3, 1];
  const b: number[] = [4, 2, 0, 2, 3, 5, 3, 1];
  const slopes: number[] = a.map(
    (v: number, i: number): number => (b[i]! - v) / 10,
  );
  const chain: IAutoMovieLoftChain = {
    name: "column",
    basis: "spline",
    order: 4,
    rule: "polar",
    samples: 4,
    layers: [
      { y: 0, coefficients: a, slopes },
      { y: 10, coefficients: b, slopes },
    ],
  };
  const near = (
    x: readonly number[],
    y: readonly number[],
    e: number = 1e-12,
  ): boolean =>
    x.every((v: number, i: number): boolean => Math.abs(v - y[i]!) <= e);

  // 1.
  TestValidator.predicate(
    "coefficients",
    near(
      AutoMovieEngineLoftChain.coefficients(chain, 2.5),
      a.map((v: number, i: number): number => v + 0.25 * (b[i]! - v)),
    ),
  );
  TestValidator.predicate(
    "derivative",
    near(AutoMovieEngineLoftChain.derivative(chain, 2.5), slopes),
  );
  TestValidator.equals(
    "bracket",
    [
      AutoMovieEngineLoftChain.bracket(chain, 2.5),
      AutoMovieEngineLoftChain.bracket(chain, 10),
    ],
    [
      [0, 1],
      [0, 1],
    ],
  );
  TestValidator.predicate(
    "outside",
    throwsError((): unknown => AutoMovieEngineLoftChain.coefficients(chain, 11)),
  );

  // 2.
  TestValidator.equals("frame", AutoMovieEngineLoftChain.frame(chain, 2.5), {
    origin: [0, 2.5, 0],
    u: [1, 0, 0],
    v: [0, 0, 1],
  });
  TestValidator.predicate(
    "axis",
    near(AutoMovieEngineLoftChain.axis(chain, 2.5), [1.25, 2.5, 3]),
  );

  // 3.
  TestValidator.predicate(
    "local",
    near(AutoMovieEngineLoftChain.local(chain, 2.5, [[4, 2.5, 3]])[0]!, [4, 3]),
  );
  TestValidator.predicate(
    "ring",
    AutoMovieEngineLoftChain.ring(chain, 2.5, [0, Math.PI]).every(
      (p) => Math.abs(p[1] - 2.5) <= 1e-12,
    ),
  );
  TestValidator.equals("lift", AutoMovieEngineLoftChain.lift(chain, 2.5), null);

  // 4.
  TestValidator.equals(
    "section",
    AutoMovieEngineLoftChain.section(chain, a, 0.7),
    AutoMovieEngineSplineCurve.evaluate(a, 4, 0.7),
  );
}

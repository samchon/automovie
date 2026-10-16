import {
  type IAutoMovieSweep,
  type IAutoMovieSweepSurface,
  compileAutoMovieSweep,
  sampleAutoMovieSurfaceNetwork,
  sampleAutoMovieSweepSection,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { sweepGirthTube } from "../internal/sweepGirthTube";
import { throwsError } from "../internal/throwsError";

/**
 * Radius/scale consumers refuse invalid interpolation instead of returning signed or non-finite geometry, and a finite but unrepresentable girth request fails at the solve.
 *
 * Scenarios:
 *
 * 1. Positive station radii and scale knots with a steep transition cannot return a non-positive queried value; a scalar interpolation method that stays positive is also valid.
 * 2. A periodic radial section follows the same positive-domain rule. A feature whose declared on-course offset exceeds the base radius is refused instead of clamped.
 * 3. A normal constant cylinder remains unchanged; a finite scale and finite radius whose product overflows are refused by both section and radius queries. A finite maximum-size girth request is refused for its non-finite solve step, without losing the measured initial diagonal to residual cancellation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual sweep, section and network producers, checks their public queried values or domain refusals and rejects silent signed/clamped feature output. The large finite constraint must reach a finite-measurement solve refusal instead of corrupting a factor or entering positivity backtracking.
 * @evidence contracts/testing.md#independent-expectations Radii/scales must be positive and finite; positive input samples alone do not ensure that between knots. The feature's -0.2 m offset on a 0.1 m cylinder has a negative on-course radius and must be refused. The positive cylinder's 0.1 m radius and IEEE finite maximum supply independent controls.
 * @evidence contracts/testing.md#distinguishing-cases Covers station, scale, periodic radial and feature domains, a valid neighboring cylinder, radius/scale product overflow and a finite numeric-limit constraint. Existing girth tests own feasible coupled solves and measured limit perimeters; scalar spline tests own signed interpolation and curvature.
 * @evidence contracts/testing.md#execution-ownership A portable synchronous test_geometry_sweep_numeric_admission entry; all cold producers and queries are inside it, with no worker, process, browser or GPU.
 */
export function test_geometry_sweep_numeric_admission(): void {
  const knots: number[] = [0, 0.3, 0.6, 1];
  const values: number[] = [1e-6, 1e-6, 1, 1];
  function circle(radius: number): IAutoMovieSweep.IStation["section"] {
    return {
      type: "superellipse",
      right: radius,
      up: radius,
      left: radius,
      down: radius,
      exponents: [2, 2, 2, 2],
    };
  }
  const base: IAutoMovieSweep = {
    spine: {
      points: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
      normal: { x: 0, y: 0, z: 1 },
    },
    stations: [
      { at: 0, section: circle(0.1) },
      { at: 1, section: circle(0.1) },
    ],
  };
  function positiveOrRefused(query: () => number): boolean {
    try {
      const value: number = query();
      return value > 0 && Number.isFinite(value);
    } catch (error) {
      return (
        error instanceof Error && error.message.includes("positive and finite")
      );
    }
  }
  const shaped: IAutoMovieSweepSurface = compileAutoMovieSweep({
    ...base,
    stations: knots.map(
      (at: number, i: number): IAutoMovieSweep.IStation => ({
        at,
        section: circle(values[i]!),
      }),
    ),
  });
  const scaled: IAutoMovieSweepSurface = compileAutoMovieSweep({
    ...base,
    scale: knots.map(
      (at: number, i: number): IAutoMovieSweep.IKnot => ({
        at,
        value: values[i]!,
      }),
    ),
  });
  TestValidator.predicate(
    "station radius never returns invalid geometry",
    positiveOrRefused((): number => shaped.radius(0.205, 0)),
  );
  TestValidator.predicate(
    "scale never returns invalid geometry",
    positiveOrRefused((): number => scaled.scale(0.205)),
  );
  let radial: boolean;
  try {
    radial = sampleAutoMovieSweepSection({
      section: { type: "radial", radii: values },
      count: 64,
    }).every((value: number): boolean => value > 0 && Number.isFinite(value));
  } catch (error) {
    radial =
      error instanceof Error && error.message.includes("positive and finite");
  }
  TestValidator.predicate(
    "radial sampling stays in its positive domain",
    radial,
  );
  const featured: IAutoMovieSweepSurface = compileAutoMovieSweep({
    ...base,
    features: [
      {
        width: 0.1,
        points: [
          { at: 0.2, angle: 0, offset: -0.2 },
          { at: 0.8, angle: 0, offset: -0.2 },
        ],
      },
    ],
  });
  TestValidator.predicate(
    "a negative on-course feature is refused without clamping",
    throwsError(
      (): unknown => featured.radius(0.5, 0),
      "featured sweep is not positive and finite",
    ),
  );
  TestValidator.predicate(
    "a valid constant radius remains exact",
    nclose(compileAutoMovieSweep(base).radius(0.205, 0), 0.1, 1e-14),
  );
  const overflowing: IAutoMovieSweepSurface = compileAutoMovieSweep({
    ...base,
    scale: [
      { at: 0, value: Number.MAX_VALUE },
      { at: 1, value: Number.MAX_VALUE },
    ],
    stations: [
      { at: 0, section: circle(2) },
      { at: 1, section: circle(2) },
    ],
  });
  TestValidator.predicate(
    "finite scale and radius cannot overflow their product silently",
    throwsError(
      (): unknown => overflowing.radius(0.5, 0),
      "scaled sweep radius is not positive and finite",
    ) &&
      throwsError(
        (): unknown => overflowing.section(0.5, 0),
        "scaled sweep section is not finite",
      ),
  );
  TestValidator.predicate(
    "an unrepresentable solve step fails at its owner",
    throwsError(
      (): unknown =>
        sampleAutoMovieSurfaceNetwork({
          network: sweepGirthTube({ exponent: 2, perimeter: Number.MAX_VALUE }),
          tier: "medium",
        }),
      "solve step is not finite",
    ),
  );
}

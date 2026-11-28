import { AutoMovieEngineNaturalSpline } from "@automovie/engine";
import { AutoMovieHumanPeriodicRailRange } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * A periodic source range admits a known contained curve and retains real
 * overshoot.
 *
 * Scenarios:
 *
 * 1. The three controls [2,3,2] define the C2 periodic spans 2+u+u^2-u^3,
 *    3-2u^2+u^3 and 2-u+u^2 for local u in [0,1]. Their complete range [7/4,3]
 *    and Bernstein hull [5/3,3] lie inside the declared source domain
 *    [3/2,7/2]. A global curvature bound that extends outside that domain must
 *    not cause a refusal.
 * 2. Constant controls retain their exact value and zero-width range, including
 *    wrapped phases.
 * 3. The four controls [1,1,2,2] have independent midpoint values 13/16 and 35/16.
 *    Their range must leave the control-only domain [1,2], so narrowing every
 *    bound to its controls fails.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the existing periodic reader and the real Human rail-range consumer with explicit scalar controls. It collects every case, the independent value checks, domain admission, genuine overshoot and input mutation before one assertion.
 * @evidence contracts/development/testing.md#independent-expectations The three written polynomials agree through two derivatives at all joins and have stationary values 3 and 7/4; converting them to cubic Bernstein coefficients gives the hull [5/3,3]. Solving the four cyclic cubic equations gives 13/16 and 35/16 for the overshoot counterpart. The 4096-epsilon value allowance covers the bounded three/four-control Float64 preparation and phase arithmetic and is far below the quarter-unit source-domain margin. Known-point readings check the fixture; they are not a sampled proof of its whole range. The contained nonconstant curve, exact constant and genuine interior overshoot have distinct scalar outcomes.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the independent piecewise cubic, units shared by controls and bounds, complete-range scope, numeric allowance and the separate overshoot requirement.
 */
export function test_construction_periodic_range(): void {
  const failures: string[] = [];
  const evidence: string[] = [];
  const tolerance: number = 4096 * Number.EPSILON;
  const h: number = (2 * Math.PI) / 3;

  /** One independent phase/value observation, in radians and source units. */
  type Probe = readonly [phase: number, expected: number];

  /** Inspect both real consumers without suppressing later cases on a refusal. */
  const inspect: (
    label: string,
    controls: readonly number[],
    probes: readonly Probe[],
    check: (bounds: readonly [number, number]) => void,
  ) => void = (
    label: string,
    controls: readonly number[],
    probes: readonly Probe[],
    check: (bounds: readonly [number, number]) => void,
  ): void => {
    const before: number[] = [...controls];
    try {
      const read: (phase: number) => number =
        AutoMovieEngineNaturalSpline.periodic(controls);
      for (const [phase, expected] of probes) {
        const actual: number = read(phase);
        if (!nclose(actual, expected, tolerance))
          failures.push(
            label +
              ": independent value differs " +
              JSON.stringify({ phase, actual, expected }),
          );
      }
    } catch (error) {
      failures.push(label + ": source threw " + String(error));
    }

    try {
      const bounds: readonly [number, number] =
        AutoMovieHumanPeriodicRailRange.of(controls);
      evidence.push(JSON.stringify({ label, controls, bounds }));
      if (bounds[0] > bounds[1])
        failures.push(label + ": range is not finite and ordered");
      else check(bounds);
    } catch (error) {
      failures.push(label + ": range threw " + String(error));
    }

    if (
      controls.length !== before.length ||
      !controls.every((value: number, index: number): boolean =>
        Object.is(value, before[index]),
      )
    )
      failures.push(label + ": source controls changed");
  };

  // The independent polynomial has a quarter-unit margin to this domain.
  inspect(
    "contained-three-span-cubic",
    [2, 3, 2],
    [
      [0, 2],
      [h / 2, 21 / 8],
      [h, 3],
      [(3 * h) / 2, 21 / 8],
      [2 * h, 2],
      [(5 * h) / 2, 7 / 4],
      [2 * Math.PI, 2],
      [-h / 2, 7 / 4],
    ],
    (bounds: readonly [number, number]): void => {
      if (!(bounds[0] <= 7 / 4 && bounds[1] >= 3))
        failures.push("contained cubic: independent extrema leave its range");
      if (!(bounds[0] >= 3 / 2 && bounds[1] <= 7 / 2))
        failures.push(
          "contained cubic: a certified local range must fit the owned domain " +
            JSON.stringify({ bounds, domain: [3 / 2, 7 / 2] }),
        );
    },
  );

  inspect(
    "constant-counterpart",
    [2, 2, 2],
    [
      [-Math.PI, 2],
      [0, 2],
      [Math.PI, 2],
      [7 * Math.PI, 2],
    ],
    (bounds: readonly [number, number]): void => {
      if (!nclose(bounds[0], 2, 0) || !nclose(bounds[1], 2, 0))
        failures.push("constant counterpart: an exact constant gained width");
    },
  );

  inspect(
    "actual-overshoot-counterpart",
    [1, 1, 2, 2],
    [
      [Math.PI / 4, 13 / 16],
      [(5 * Math.PI) / 4, 35 / 16],
    ],
    (bounds: readonly [number, number]): void => {
      if (!(bounds[0] <= 13 / 16 && bounds[1] >= 35 / 16))
        failures.push("overshoot counterpart: actual extrema were removed");
      if (bounds[0] >= 1 && bounds[1] <= 2)
        failures.push(
          "overshoot counterpart: a control-only domain was admitted",
        );
    },
  );

  TestValidator.predicate(
    [...failures, ...evidence].join("\n"),
    failures.length === 0,
  );
}

import {
  type AutoMovieLoftViewRead,
  AutoMovieNativeCoordinate,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Original native coordinate inversion retains the selected half and actual point.
 *
 * Scenarios:
 * 1. Both coordinates and both other-coordinate halves of the exact ellipse
 *    x²/a²+z²/b²=1 have independent roots at five interior values and supports.
 *    Three unit scales exercise finite residual and unchanged target meaning.
 * 2. Unreachable, nonfinite, invalid branch and collapsed original inputs
 *    refuse. A source data-getter exception keeps its exact original identity.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public original native query and checks its returned native point, phase/half, signed actual residual and bounded iteration count; failures cannot turn into a successful adjusted point.
 * @evidence contracts/development/testing.md#independent-expectations Elementary ellipse roots are x=half*a*sqrt(1-z²/b²) or z=half*b*sqrt(1-x²/a²). The original polar clock follows atan2; abs1e-10*max(1,scale) covers binary64 root/native inversion without changing the production residual32eps criterion.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both half signs/coordinates, interior and singular support endpoints, three scales, adjacent outside reach, nonfinite target, malformed branch, collapsed extents and getter identity. This Point0 question asserts no inverse physical derivative.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous construction_native_coordinate CPU question uses synthetic source values and starts no Human generation, process, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Both coordinates and both other-coordinate halves of the exact ellipse).
 */
export function test_construction_native_coordinate(): void {
  const failures: string[] = [];
  for (const scale of [0.001, 1, 1000]) {
    const a: number = 3 * scale;
    const b: number = 2 * scale;
    const inputs: AutoMovieLoftViewRead.IValues = {
      extents: [a, b, a, b],
      shoulders: [0, 1, 2, 3].map((): number => Math.SQRT2 - 1),
    };
    for (const component of [0, 1] as const)
      for (const half of [1, -1] as const)
        for (const share of [-1, -0.93, -0.5, 0, 0.31, 0.87, 1]) {
          const target: number = share * (component === 0 ? a : b);
          const result: AutoMovieNativeCoordinate.IResult =
            AutoMovieNativeCoordinate.locate(inputs, component, half, target);
          if ((share === -1 || share === 1) && result.iterations !== 0)
            failures.push(
              "An exact original support reported a bisection point query.",
            );
          const other: number =
            half * (component === 0 ? b : a) * Math.sqrt(1 - share * share);
          const expected: readonly number[] =
            component === 0 ? [target, other] : [other, target];
          const limit: number = 1e-10 * Math.max(1, scale);
          if (
            result.point.some(
              (value: number, index: number): boolean =>
                !nclose(value, expected[index]!, limit),
            )
          )
            failures.push(
              `${scale}/${component}/${half}/${share}: ${result.point}, expected ${expected}`,
            );
          if (
            !nclose(result.point[component] - target, result.residual, limit) ||
            result.iterations < 0 ||
            result.iterations > 64
          )
            failures.push(
              "The returned original point/residual or bounded work disagrees.",
            );
          if (
            Math.hypot(
              result.point[0] -
                Math.hypot(...result.point) * Math.cos(result.phase),
              result.point[1] -
                Math.hypot(...result.point) * Math.sin(result.phase),
            ) > limit
          )
            failures.push(
              "The returned clock no longer addresses its original point.",
            );
        }
    for (const target of [b * (1 + 1e-6), -b * (1 + 1e-6), NaN, Infinity])
      refuse(
        (): unknown => AutoMovieNativeCoordinate.locate(inputs, 1, 1, target),
        failures,
        "outside native target",
      );
  }
  const inputs: AutoMovieLoftViewRead.IValues = {
    extents: [1, 1, 1, 1],
    shoulders: [0.4, 0.4, 0.4, 0.4],
  };
  refuse(
    (): unknown => AutoMovieNativeCoordinate.locate(inputs, 1, 0 as 1, 0),
    failures,
    "invalid half",
  );
  refuse(
    (): unknown =>
      AutoMovieNativeCoordinate.locate(
        { ...inputs, extents: [0, 0, 0, 0] },
        1,
        1,
        0,
      ),
    failures,
    "collapsed native source",
  );
  const marker: Error = new Error("original coordinate datum");
  const owned: number[] = [1, 1, 1, 1];
  Object.defineProperty(owned, 1, {
    get: (): never => {
      throw marker;
    },
  });
  let caught: unknown;
  try {
    AutoMovieNativeCoordinate.locate({ ...inputs, extents: owned }, 1, 1, 0);
  } catch (error: unknown) {
    caught = error;
  }
  if (caught !== marker)
    failures.push("Original native data getter lost its exception identity.");
  TestValidator.predicate(
    failures.join("\n"),
    (): boolean => failures.length === 0,
  );
}

/** Explicit input failure must not manufacture an original point. */
function refuse(job: () => unknown, failures: string[], name: string): void {
  try {
    job();
    failures.push(`${name} was accepted.`);
  } catch (error: unknown) {
    if (!(error instanceof Error))
      failures.push(`${name} has no named failure.`);
  }
}

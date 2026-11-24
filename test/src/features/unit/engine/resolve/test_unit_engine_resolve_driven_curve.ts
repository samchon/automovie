import { resolveDrivers } from "@automovie/engine";
import {
  IAutoMovieChannel,
  IAutoMovieDrivenCurve,
  IAutoMovieDrivenCurvePoint,
  IAutoMovieDrivenDriver,
  type IAutoMovieSampledChannel,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

const ptr: (p: string) => IAutoMovieChannel = (
  p: string,
): IAutoMovieChannel => ({
  kind: "pointer",
  pointer: p,
  valueType: "scalar",
});

const seed: (
  entries: [string, IAutoMovieChannel, number[]][],
) => Map<string, IAutoMovieSampledChannel> = (
  entries: [string, IAutoMovieChannel, number[]][],
): Map<string, IAutoMovieSampledChannel> =>
  new Map(
    entries.map(
      ([k, channel, value]: [string, IAutoMovieChannel, number[]]): [
        string,
        { channel: IAutoMovieChannel; value: number[] },
      ] => [k, { channel, value }],
    ),
  );

const driven: (
  over: Partial<IAutoMovieDrivenDriver>,
) => IAutoMovieDrivenDriver = (
  over: Partial<IAutoMovieDrivenDriver>,
): IAutoMovieDrivenDriver => ({
  type: "driven",
  output: ptr("/out"),
  source: ptr("/in"),
  inRange: [50, 60],
  outRange: [500, 600],
  clamp: true,
  ...over,
});

const curve: (over?: Partial<IAutoMovieDrivenCurve>) => {
  points: IAutoMovieDrivenCurvePoint[];
} = (
  over: Partial<IAutoMovieDrivenCurve> = {},
): { points: IAutoMovieDrivenCurvePoint[] } =>
  ({
    points: [
      { source: 0, output: 0 },
      { source: 7, output: 10 },
      { source: 10, output: 100 },
    ],
    ...over,
  }) satisfies IAutoMovieDrivenCurve;

/** Preserve scalar width while comparing its value numerically. */
function scalarMatches(actual: number[], expected: number): boolean {
  return actual.length === 1 && nclose(actual[0]!, expected, 0);
}

/**
 * A nonlinear driven curve uses named source/output points and its own missing-source default; an empty or non-increasing point list rejects before interpolation.
 *
 * Scenarios:
 *
 * 1. Piecewise interpolation and endpoint holds use curve points, ignoring
 *    `inRange`/`outRange`/`clamp`.
 * 2. With no sampled source, a curve defaults to its first source point rather
 *    than the linear driver's `inRange[0]`.
 * 3. An empty point list and non-increasing source values reject before output.
 */
export function test_unit_engine_resolve_driven_curve(): void {
  const run: (d: IAutoMovieDrivenDriver, src?: number) => number[] = (
    d: IAutoMovieDrivenDriver,
    src?: number,
  ): number[] => {
    const sampled: Map<string, IAutoMovieSampledChannel> =
      src === undefined ? seed([]) : seed([["ptr:/in", ptr("/in"), [src]]]);
    resolveDrivers([d], sampled, new Map());
    return sampled.get("ptr:/out")!.value;
  };

  const curl: IAutoMovieDrivenDriver = driven({ curve: curve() });
  TestValidator.predicate(
    "curve interpolates between named points",
    scalarMatches(run(curl, 8.5), 55),
  );
  TestValidator.predicate(
    "curve holds below first point",
    scalarMatches(run(curl, -3), 0),
  );
  TestValidator.predicate(
    "curve holds above last point",
    scalarMatches(run(curl, 20), 100),
  );
  TestValidator.predicate(
    "curve absent source uses first point",
    scalarMatches(run(curl), 0),
  );

  TestValidator.predicate(
    "null driver curve keeps the declared linear fallback",
    scalarMatches(run(driven({ curve: null }), 55), 550),
  );
  TestValidator.predicate(
    "driven curve rejects empty points",
    throwsError(
      (): number[] => run(driven({ curve: curve({ points: [] }) }), 1),
      ["driven driver curve.points", "at least one"],
    ),
  );
  TestValidator.predicate(
    "driven curve rejects non-increasing source",
    throwsError(
      (): number[] =>
        run(
          driven({
            curve: curve({
              points: [
                { source: 0, output: 0 },
                { source: 0, output: 1 },
              ],
            }),
          }),
          1,
        ),
      ["driven driver curve.points", "strictly increasing", "0"],
    ),
  );
}
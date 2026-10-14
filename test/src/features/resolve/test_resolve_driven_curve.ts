import {
  IAutoMovieChannel,
  IAutoMovieDrivenCurve,
  IAutoMovieDrivenCurvePoint,
  IAutoMovieDrivenDriver,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieSampledChannel, evaluateDrivenCurve, resolveDrivers } from "@automovie/engine";


import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

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
 * A nonlinear driven curve uses named source/output points and its own missing-source default; malformed curve data rejects before interpolation.
 *
 * Scenarios:
 *
 * 1. Piecewise interpolation and endpoint holds use curve points, ignoring
 *    `inRange`/`outRange`/`clamp`.
 * 2. With no sampled source, a curve defaults to its first source point rather
 *    than the linear driver's `inRange[0]`.
 * 3. Malformed curve objects, point lists, point objects, non-finite coordinates,
 *    and non-increasing source values reject before output.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates actual nonlinear driven channels through resolveDrivers; verifies curve interpolation/endpoint/default behavior and authoring refusal including null at the curve object's own boundary.
 * @evidence contracts/testing.md#independent-expectations At source 8.5 the authored (7,10)-(10,100) segment is halfway, so output is 55; source outside 0..10 holds the corresponding endpoint and missing source selects the first point. Strictly increasing finite points are independent curve admission requirements.
 * @evidence contracts/testing.md#distinguishing-cases Covers interior/below/above/missing source, array/primitive/null curve, absent/empty point list, malformed/null point, nonfinite output and duplicate source neighbors; linear range-driven behavior belongs to the separate driven driver test.
 * @evidence contracts/testing.md#execution-ownership The exported test_resolve_driven_curve owns synchronous portable sampled-map cases through the real driver seam, without consumer installation, Human assets, native host or replaced globals.
 */
export function test_resolve_driven_curve(): void {
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
    "driven curve rejects array contract",
    throwsError(
      (): number[] =>
        run(
          driven({
            curve: [
              { source: 0, output: 0 },
              { source: 1, output: 1 },
            ] as unknown as IAutoMovieDrivenCurve,
          }),
          1,
        ),
      ["driven driver curve", "object"],
    ),
  );
  TestValidator.predicate(
    "driven curve rejects primitive contract",
    throwsError(
      (): number[] =>
        run(
          driven({
            curve: "bad" as unknown as IAutoMovieDrivenCurve,
          }),
          1,
        ),
      ["driven driver curve", "object"],
    ),
  );
  TestValidator.predicate(
    "direct curve evaluator rejects null at its object boundary",
    throwsError(
      (): number =>
        evaluateDrivenCurve(1, null as unknown as IAutoMovieDrivenCurve),
      ["driven driver curve", "object"],
    ),
  );
  TestValidator.predicate(
    "null driver curve keeps the declared linear fallback",
    scalarMatches(run(driven({ curve: null }), 55), 550),
  );
  TestValidator.predicate(
    "driven curve rejects missing points",
    throwsError(
      (): number[] =>
        run(
          driven({
            curve: {} as unknown as IAutoMovieDrivenCurve,
          }),
          1,
        ),
      ["driven driver curve.points", "array"],
    ),
  );
  TestValidator.predicate(
    "driven curve rejects empty points",
    throwsError(
      (): number[] => run(driven({ curve: curve({ points: [] }) }), 1),
      ["driven driver curve.points", "at least one"],
    ),
  );
  TestValidator.predicate(
    "driven curve rejects array point",
    throwsError(
      (): number[] =>
        run(
          driven({
            curve: curve({
              points: [
                { source: 0, output: 0 },
                [1, 1] as unknown as IAutoMovieDrivenCurvePoint,
              ],
            }),
          }),
          1,
        ),
      ["driven driver curve.points[1]", "object"],
    ),
  );
  TestValidator.predicate(
    "driven curve rejects primitive point",
    throwsError(
      (): number[] =>
        run(
          driven({
            curve: curve({
              points: [
                { source: 0, output: 0 },
                "bad" as unknown as IAutoMovieDrivenCurvePoint,
              ],
            }),
          }),
          1,
        ),
      ["driven driver curve.points[1]", "object"],
    ),
  );
  TestValidator.predicate(
    "driven curve rejects null point",
    throwsError(
      (): number[] =>
        run(
          driven({
            curve: curve({
              points: [
                { source: 0, output: 0 },
                null as unknown as IAutoMovieDrivenCurvePoint,
              ],
            }),
          }),
          1,
        ),
      ["driven driver curve.points[1]", "object"],
    ),
  );
  TestValidator.predicate(
    "driven curve rejects non-finite output",
    throwsError(
      (): number[] =>
        run(
          driven({
            curve: curve({
              points: [
                { source: 0, output: 0 },
                { source: 1, output: Number.NaN },
              ],
            }),
          }),
          1,
        ),
      ["driven driver curve.points[1].output", "finite", "NaN"],
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

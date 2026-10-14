import { type IAutoMovieDrivenCurve, type IAutoMovieDrivenCurvePoint, type IAutoMovieDrivenDriver, type IAutoMovieDriver } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieSampledChannel } from "../../../../packages/engine/src/resolve/IAutoMovieSampledChannel";
import { resolveDrivers } from "../../../../packages/engine/src/resolve/resolveDrivers";
import { createDrivenDriver as driven } from "./createDrivenDriver";
import { createDriverPointer as ptr } from "./createDriverPointer";
import { createDriverSamples as seed } from "./createDriverSamples";
import { nclose } from "./nclose";
import { throwsError } from "./throwsError";

/**
 * Execute the existing linear/curve scalar-driver cases and malformed-input refusals. Literal interval arithmetic supplies expectations, and scalar array comparisons retain zero tolerance and width checks.
 *
 * Scenarios:
 * 1. A present source remaps 5 from [0,10] to 50 on [0,100].
 * 2. An absent source uses the lower input endpoint and maps to the lower output endpoint.
 * 3. Clamping pins source20 to output100, while omitted clamp permits output200.
 * 4. The degenerate input interval [5,5] selects output3.
 * 5. A curve supersedes linear fields, interpolates source8.5 to55 and holds endpoints below/above its domain.
 * 6. Malformed source arrays, linear range tuples, curve objects/points and nonfinite or non-increasing coordinates reject.
 * 7. A nonboolean clamp flag rejects rather than changing extrapolation through truthiness.
 * 8. Node TRS and nonscalar pointer outputs reject a scalar write.
 */
export function runResolveDriversDrivenScenario(): void {
  const run: (driver: IAutoMovieDrivenDriver, source?: number) => number[] = (
    driver: IAutoMovieDrivenDriver,
    source?: number,
  ): number[] => {
    const sampled: Map<string, IAutoMovieSampledChannel> =
      source === undefined ? seed([]) : seed([["ptr:/in", ptr("/in"), [source]]]);
    resolveDrivers([driver], sampled, new Map());
    return sampled.get("ptr:/out")!.value;
  };
  TestValidator.predicate("present source remaps", sameValues(run(driven({}), 5), [50]));
  TestValidator.predicate(
    "absent source uses inRange[0]",
    sameValues(run(driven({ inRange: [2, 4], outRange: [7, 9] })), [7]),
  );
  TestValidator.predicate(
    "driven driver rejects a node TRS output channel",
    throwsError(
      (): number[] => run(driven({ output: { kind: "node", node: "k", path: "translation" } }), 5),
      ["driven driver output", "scalar", "translation"],
    ),
  );
  TestValidator.predicate(
    "driven driver rejects a non-scalar pointer output channel",
    throwsError(
      (): number[] => run(driven({ output: { kind: "pointer", pointer: "/out", valueType: "vec3" } }), 5),
      ["driven driver output", "scalar", "vec3"],
    ),
  );
  TestValidator.predicate("clamp pins past the range", sameValues(run(driven({ clamp: true }), 20), [100]));
  TestValidator.predicate(
    "driven driver rejects non-boolean clamp flag",
    throwsError(
      (): number[] => run(driven({ clamp: "false" as unknown as boolean }), 20),
      ["driven driver clamp", "boolean", "false"],
    ),
  );
  TestValidator.predicate(
    "degenerate input range maps to outRange[0]",
    sameValues(run(driven({ inRange: [5, 5], outRange: [3, 9] }), 5), [3]),
  );
  const curveOnly: IAutoMovieDrivenDriver = {
    type: "driven",
    output: ptr("/out"),
    source: ptr("/in"),
    curve: { points: [{ source: 0, output: 0 }, { source: 10, output: 100 }] },
  };
  TestValidator.predicate("curve driver resolves with no inRange/outRange/clamp", sameValues(run(curveOnly, 5), [50]));
  const unclamped: IAutoMovieDrivenDriver = {
    type: "driven",
    output: ptr("/out"),
    source: ptr("/in"),
    inRange: [0, 10],
    outRange: [0, 100],
  };
  TestValidator.predicate(
    "linear driver without clamp extrapolates (clamp defaults false)",
    sameValues(run(unclamped, 20), [200]),
  );
  TestValidator.predicate(
    "linear driven driver without inRange rejects",
    throwsError(
      (): number[] => run({ type: "driven", output: ptr("/out"), source: ptr("/in"), outRange: [0, 100] }, 5),
      ["driven driver without a curve requires inRange and outRange"],
    ),
  );
  TestValidator.predicate(
    "linear driven driver without outRange rejects",
    throwsError(
      (): number[] => run({ type: "driven", output: ptr("/out"), source: ptr("/in"), inRange: [0, 10] }, 5),
      ["driven driver without a curve requires inRange and outRange"],
    ),
  );
  const curl: IAutoMovieDrivenDriver = driven({
    curve: { points: [{ source: 0, output: 0 }, { source: 7, output: 10 }, { source: 10, output: 100 }] },
  });
  TestValidator.predicate("curve interpolates within the steep last segment (8.5 → 55)", sameValues(run(curl, 8.5), [55]));
  TestValidator.predicate("curve holds flat below the first point", sameValues(run(curl, -3), [0]));
  TestValidator.predicate("curve holds flat above the last point", sameValues(run(curl, 20), [100]));
  TestValidator.predicate(
    "driven driver rejects NaN source",
    throwsError(
      (): IAutoMovieDriver[] => resolveDrivers([driven({})], seed([["ptr:/in", ptr("/in"), [Number.NaN]]]), new Map()),
      ["driven driver source value", "finite", "NaN"],
    ),
  );
  TestValidator.predicate(
    "driven driver rejects non-array source value",
    throwsError(
      (): IAutoMovieDriver[] => resolveDrivers(
        [driven({})],
        seed([["ptr:/in", ptr("/in"), { 0: 5, length: 1 } as unknown as number[]]]),
        new Map(),
      ),
      ["driven driver source value", "array"],
    ),
  );
  TestValidator.predicate(
    "driven driver rejects empty source value",
    throwsError(
      (): IAutoMovieDriver[] => resolveDrivers([driven({})], seed([["ptr:/in", ptr("/in"), []]]), new Map()),
      ["driven driver source value", "exactly 1", "0"],
    ),
  );
  TestValidator.predicate(
    "driven driver rejects vector source value",
    throwsError(
      (): IAutoMovieDriver[] => resolveDrivers([driven({})], seed([["ptr:/in", ptr("/in"), [5, 99]]]), new Map()),
      ["driven driver source value", "exactly 1", "2"],
    ),
  );
  TestValidator.predicate(
    "driven driver rejects non-array input range",
    throwsError(
      (): number[] => run(driven({ inRange: { 0: 0, 1: 10, length: 2 } as unknown as [number, number] }), 5),
      ["driven driver inRange", "array"],
    ),
  );
  TestValidator.predicate(
    "driven driver rejects wrong-width output range",
    throwsError(
      (): number[] => run(driven({ outRange: [0, 100, 999] as unknown as [number, number] }), 5),
      ["driven driver outRange", "exactly 2", "3"],
    ),
  );
  TestValidator.predicate(
    "driven driver rejects NaN input range",
    throwsError((): number[] => run(driven({ inRange: [Number.NaN, 1] })), ["driven driver inRange[0]", "finite", "NaN"]),
  );
  TestValidator.predicate(
    "driven driver rejects infinite output range",
    throwsError((): number[] => run(driven({ outRange: [0, Infinity] }), 1), ["driven driver outRange[1]", "finite", "Infinity"]),
  );
  TestValidator.predicate(
    "driven driver rejects array curve contract",
    throwsError(
      (): number[] => run(driven({ curve: [{ source: 0, output: 0 }, { source: 1, output: 1 }] as unknown as IAutoMovieDrivenCurve }), 1),
      ["driven driver curve", "object"],
    ),
  );
  TestValidator.predicate(
    "driven driver rejects missing curve points",
    throwsError((): number[] => run(driven({ curve: {} as unknown as IAutoMovieDrivenCurve }), 1), ["driven driver curve.points", "array"]),
  );
  TestValidator.predicate(
    "driven driver rejects non-object curve point",
    throwsError(
      (): number[] => run(driven({ curve: { points: [{ source: 0, output: 0 }, [1, 1] as unknown as IAutoMovieDrivenCurvePoint] } }), 1),
      ["driven driver curve.points[1]", "object"],
    ),
  );
  TestValidator.predicate(
    "driven driver rejects empty curve",
    throwsError((): number[] => run(driven({ curve: { points: [] } }), 1), ["driven driver curve.points", "at least one"]),
  );
  TestValidator.predicate(
    "driven driver rejects non-finite curve coordinate",
    throwsError(
      (): number[] => run(driven({ curve: { points: [{ source: 0, output: 0 }, { source: 1, output: Number.NaN }] } }), 1),
      ["driven driver curve.points[1].output", "finite", "NaN"],
    ),
  );
  TestValidator.predicate(
    "driven driver rejects non-increasing curve source",
    throwsError(
      (): number[] => run(driven({ curve: { points: [{ source: 0, output: 0 }, { source: 0, output: 1 }] } }), 1),
      ["driven driver curve.points", "strictly increasing", "0"],
    ),
  );
}

/** Compare scalar array width and values with the original zero tolerance. */
function sameValues(actual: number[], expected: number[]): boolean {
  return actual.length === expected.length && actual.every((value: number, index: number): boolean => nclose(value, expected[index]!, 0));
}

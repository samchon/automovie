import { AutoMovieEngineResolve } from "@automovie/engine";
import type {
  IAutoMovieAimDriver,
  IAutoMovieDrivenDriver,
  IAutoMovieDriver,
  IAutoMovieSampledChannel,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createDrivenDriver as driven } from "./createDrivenDriver";
import { createDriverPointer as ptr } from "./createDriverPointer";
import { createDriverSamples as seed } from "./createDriverSamples";
import { nclose } from "./nclose";

/** Execute the existing reverse-order chain, shared dependency, and deferred aim cases with literal linear-map expectations. Output values cannot prove how many times a dependency was evaluated. */
export function runResolveDriversOrderScenario(): void {
  const a: IAutoMovieDrivenDriver = driven({
    source: ptr("/x"),
    output: ptr("/y"),
    inRange: [0, 1],
    outRange: [0, 2],
  });
  const b: IAutoMovieDrivenDriver = driven({
    source: ptr("/y"),
    output: ptr("/z"),
    inRange: [0, 2],
    outRange: [0, 4],
  });
  const sampled: Map<string, IAutoMovieSampledChannel> = seed([
    ["ptr:/x", ptr("/x"), [1]],
  ]);
  AutoMovieEngineResolve.resolveDrivers([b, a], sampled, new Map());
  TestValidator.predicate(
    "chain resolves A before B",
    sameValues(sampled.get("ptr:/z")!.value, [4]),
  );
  TestValidator.predicate(
    "intermediate computed",
    sameValues(sampled.get("ptr:/y")!.value, [2]),
  );

  const sa: IAutoMovieDrivenDriver = driven({
    source: ptr("/x"),
    output: ptr("/y"),
    inRange: [0, 1],
    outRange: [0, 5],
  });
  const sb: IAutoMovieDrivenDriver = driven({
    source: ptr("/y"),
    output: ptr("/p"),
    inRange: [0, 5],
    outRange: [0, 1],
  });
  const sc: IAutoMovieDrivenDriver = driven({
    source: ptr("/y"),
    output: ptr("/q"),
    inRange: [0, 5],
    outRange: [0, 2],
  });
  const sampled2: Map<string, IAutoMovieSampledChannel> = seed([
    ["ptr:/x", ptr("/x"), [1]],
  ]);
  const aim: IAutoMovieAimDriver = {
    type: "aim",
    owner: "o",
    target: "t",
    aimAxis: { x: 0, y: 0, z: -1 },
    upAxis: { x: 0, y: 1, z: 0 },
    worldUp: { x: 0, y: 1, z: 0 },
    influence: 1,
  };
  const deferred: IAutoMovieDriver[] = AutoMovieEngineResolve.resolveDrivers(
    [sb, sc, sa, aim],
    sampled2,
    new Map(),
  );
  TestValidator.predicate(
    "dependent B sees shared output",
    sameValues(sampled2.get("ptr:/p")!.value, [1]),
  );
  TestValidator.predicate(
    "dependent C sees shared output",
    sameValues(sampled2.get("ptr:/q")!.value, [2]),
  );
  TestValidator.equals("aim driver deferred", deferred.length, 1);
  TestValidator.equals(
    "aim is the deferred one",
    (deferred[0] as IAutoMovieDriver).type,
    "aim",
  );
}


/** Compare scalar-array width and each component with zero numeric tolerance. */
function sameValues(actual: number[], expected: number[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every((value: number, index: number): boolean =>
      nclose(value, expected[index]!, 0),
    )
  );
}

import {
  type IAutoMovieChannel,
  type IAutoMovieDriver,
  type IAutoMovieNode,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieSampledChannel, resolveDrivers } from "@automovie/engine";

import { createCopyDriver as copy } from "./createCopyDriver";
import { createDriverNode as node } from "./createDriverNode";
import { createDriverSamples as seed } from "./createDriverSamples";
import { indexDriverNodes as byId } from "./indexDriverNodes";
import { namedFacts } from "./namedFacts";
import { nclose } from "./nclose";
import { throwsError } from "./throwsError";

/**
 * Apply the existing copy-driver cases through resolveDrivers, including rest/sample blending and malformed-input refusals. Scalar comparisons preserve zero tolerance for copied translation and scale; quaternion components retain their original tolerance.
 *
 * Scenarios:
 * 1. Full-influence translation, rotation and scale copying reads rest transforms and creates sampled channels.
 * 2. Translation-only half influence blends existing owner/source samples and leaves rotation absent.
 * 3. NaN, negative and above-one influence plus a nonboolean component flag reject.
 * 4. Missing sampled owner/source nodes, short translation, array-like rotation and extra rotation components reject.
 */
export function runResolveDriversCopyScenario(): void {
  const owner: IAutoMovieNode = node("o", {
    translation: { x: 1, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 2, y: 2, z: 2 },
  });
  const s: number = Math.SQRT1_2;
  const source: IAutoMovieNode = node("s", {
    translation: { x: 5, y: 0, z: 0 },
    rotation: { x: 0, y: s, z: 0, w: s },
    scale: { x: 4, y: 4, z: 4 },
  });
  const sampled: Map<string, IAutoMovieSampledChannel> = seed([]);
  const deferred: IAutoMovieDriver[] = resolveDrivers(
    [copy({ translation: true, rotation: true, scale: true })],
    sampled,
    byId(owner, source),
  );
  TestValidator.equals("no deferred drivers", deferred.length, 0);
  TestValidator.predicate(
    "translation copied from rest",
    sameValues(sampled.get("node:o:translation")!.value, [5, 0, 0]),
  );
  TestValidator.predicate(
    "scale copied from rest",
    sameValues(sampled.get("node:o:scale")!.value, [4, 4, 4]),
  );
  const rot: number[] = sampled.get("node:o:rotation")!.value;
  TestValidator.equals(
    "rotation slerped to source rest",
    namedFacts([
      ["ncloseRot1", (): boolean => nclose(rot[1]!, s)],
      ["ncloseRot3", (): boolean => nclose(rot[3]!, s)],
    ]),
    { ncloseRot1: true, ncloseRot3: true },
  );

  const sampled2: Map<string, IAutoMovieSampledChannel> = seed([
    [
      "node:o2:translation",
      { kind: "node", node: "o2", path: "translation" },
      [10, 0, 0],
    ],
    [
      "node:s2:translation",
      { kind: "node", node: "s2", path: "translation" },
      [20, 0, 0],
    ],
  ]);
  resolveDrivers(
    [copy({ owner: "o2", source: "s2", translation: true, influence: 0.5 })],
    sampled2,
    byId(node("o2"), node("s2")),
  );
  TestValidator.predicate(
    "translation blended at 0.5 over existing sample",
    sameValues(sampled2.get("node:o2:translation")!.value, [15, 0, 0]),
  );
  TestValidator.equals(
    "rotation left untouched when disabled",
    sampled2.has("node:o2:rotation"),
    false,
  );

  const validNodes: Map<string, IAutoMovieNode> = byId(node("o"), node("s"));
  TestValidator.predicate(
    "copy driver rejects NaN influence",
    throwsError(
      (): IAutoMovieDriver[] =>
        resolveDrivers(
          [copy({ translation: true, influence: Number.NaN })],
          seed([]),
          validNodes,
        ),
      ["copy driver influence", "finite", "NaN"],
    ),
  );
  TestValidator.predicate(
    "copy driver rejects negative influence",
    throwsError(
      (): IAutoMovieDriver[] =>
        resolveDrivers(
          [copy({ translation: true, influence: -0.1 })],
          seed([]),
          validNodes,
        ),
      ["copy driver influence", "between 0 and 1", "-0.1"],
    ),
  );
  TestValidator.predicate(
    "copy driver rejects influence above one",
    throwsError(
      (): IAutoMovieDriver[] =>
        resolveDrivers(
          [copy({ translation: true, influence: 1.1 })],
          seed([]),
          validNodes,
        ),
      ["copy driver influence", "between 0 and 1", "1.1"],
    ),
  );
  TestValidator.predicate(
    "copy driver rejects non-boolean component flag",
    throwsError(
      (): IAutoMovieDriver[] =>
        resolveDrivers(
          [copy({ translation: "yes" as unknown as boolean })],
          seed([]),
          validNodes,
        ),
      ["copy driver translation", "boolean", "yes"],
    ),
  );
  const ghostTranslation: [string, IAutoMovieChannel, number[]] = [
    "node:ghost:translation",
    { kind: "node", node: "ghost", path: "translation" },
    [7, 0, 0],
  ];
  TestValidator.predicate(
    "copy driver rejects missing sampled owner node",
    throwsError(
      (): IAutoMovieDriver[] =>
        resolveDrivers(
          [copy({ owner: "ghost", source: "s", translation: true })],
          seed([ghostTranslation]),
          byId(node("s")),
        ),
      'copy driver owner node "ghost" was not provided',
    ),
  );
  TestValidator.predicate(
    "copy driver rejects missing sampled source node",
    throwsError(
      (): IAutoMovieDriver[] =>
        resolveDrivers(
          [copy({ owner: "o", source: "ghost", translation: true })],
          seed([ghostTranslation]),
          byId(node("o")),
        ),
      'copy driver source node "ghost" was not provided',
    ),
  );
  TestValidator.predicate(
    "copy driver rejects short sampled source translation",
    throwsError(
      (): IAutoMovieDriver[] =>
        resolveDrivers(
          [copy({ translation: true })],
          seed([
            [
              "node:s:translation",
              { kind: "node", node: "s", path: "translation" },
              [5, 0],
            ],
          ]),
          validNodes,
        ),
      ["copy driver source translation value", "exactly 3", "2"],
    ),
  );
  TestValidator.predicate(
    "copy driver rejects array-like sampled owner rotation",
    throwsError(
      (): IAutoMovieDriver[] =>
        resolveDrivers(
          [copy({ rotation: true })],
          seed([
            [
              "node:o:rotation",
              { kind: "node", node: "o", path: "rotation" },
              { 0: 0, 1: 0, 2: 0, 3: 1, length: 4 } as unknown as number[],
            ],
          ]),
          validNodes,
        ),
      ["copy driver owner rotation value", "array"],
    ),
  );
  TestValidator.predicate(
    "copy driver rejects extra sampled source rotation component",
    throwsError(
      (): IAutoMovieDriver[] =>
        resolveDrivers(
          [copy({ rotation: true })],
          seed([
            [
              "node:s:rotation",
              { kind: "node", node: "s", path: "rotation" },
              [0, 0, 0, 1, 99],
            ],
          ]),
          validNodes,
        ),
      ["copy driver source rotation value", "exactly 4", "5"],
    ),
  );
}

/** Compare copied scalar arrays with the original exact-value requirement and explicit finite numeric predicates. */
function sameValues(actual: number[], expected: number[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every((value: number, index: number): boolean =>
      nclose(value, expected[index]!, 0),
    )
  );
}

import { IAutoMovieScriptNode } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateScriptTree } from "../../../../packages/engine/src/validation/validateScriptTree";
import { createScriptTreeFixture } from "../internal/createScriptTreeFixture";

/**
 * Valid screenplay trees preserve the flat script and permit minimal structure.
 *
 * Scenarios:
 * 1. A five-kind tree joins both flat beats with finite and null dialogue anchors.
 * 2. A lone intent root joins an empty beat list.
 * 3. A long alternating group/scene chain validates without recursive traversal.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls source tree admission and requires zero violations for full, minimal and deep trees, catching accidental refusal of legal parent kinds, nullable anchors, empty beats or long acyclic chains.
 * @evidence contracts/testing.md#independent-expectations Fixtures declare the supported parent table, one intent root, exact flat-header agreement and one node per flat beat; a chain alternating group and scene follows two permitted parent pairs independently of the traversal implementation.
 * @evidence contracts/testing.md#distinguishing-cases Covers every node kind, mutual interaction edges, temporal reference, finite and null anchors, zero beats and a 10000-node acyclic chain; malformed graphs and editorial payloads belong to the gates entry.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous unit entry owns these portable fixtures and assertions and calls engine source directly; no process, renderer or dynamically registered case is required.
 */
export function test_validation_script_tree(): void {
  const full: ReturnType<typeof validateScriptTree> = validateScriptTree(createScriptTreeFixture());
  TestValidator.equals("full five-kind tree validates", full.success, true);
  const root: IAutoMovieScriptNode = createScriptTreeFixture().tree[0]!;
  const minimal: Parameters<typeof validateScriptTree>[0] = { ...createScriptTreeFixture(), tree: [root], beats: [] };
  TestValidator.equals("intent-only tree validates", validateScriptTree(minimal).success, true);
  const deep: IAutoMovieScriptNode[] = [root];
  for (let index: number = 1; index < 10000; index++)
    deep.push(index % 2 === 1 ? {
      id: `deep-${index}`, kind: "group", parent: index === 1 ? "root" : `deep-${index-1}`,
      temporal: null, interactsWith: [], payload: { rationale: "Nested editorial group" },
    } : {
      id: `deep-${index}`, kind: "scene", parent: `deep-${index-1}`,
      temporal: null, interactsWith: [], payload: { interiorExterior: "EXT", location: "location", timeOfDay: "day", description: null },
    });
  TestValidator.equals("deep legal tree validates", validateScriptTree({ ...minimal, tree: deep }).success, true);
}

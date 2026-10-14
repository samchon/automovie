import type { IAutoMovieScriptNode } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { beatNodeOf, scriptAncestors } from "@automovie/engine";

import { createScriptTree } from "../internal/createScriptTree";
import { throwsError } from "../internal/predicates";

/**
 * The refinement-graph walkers of the feedback cascade: scriptAncestors returns the chain a located violation climbs, and beatNodeOf is the flat-beat → graph-node join a beat-scoped consumer locates itself with. Walkers serve validated trees but refuse silent drops on malformed input (the bindProfile precedent): a cascade that stopped short would misdirect the correction.
 *
 * Scenarios:
 *
 * 1. A deep chain walks nearest-first to the root, excluding the node itself: beat
 * `b1` under group/scene/act/intent yields exactly `["grp", "scene1", "act1", "root"]`.
 * 2. The root itself has no ancestors: an empty chain, not a throw.
 * 3. An unknown node id throws (refusal, not an empty answer).
 * 4. A dangling parent mid-walk throws.
 * 5. A cyclic parent chain throws instead of looping forever.
 * 6. BeatNodeOf finds the claiming beat node, and returns null for an unclaimed
 * beat, a null tree, and an undefined tree alike.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls screenplay parent and flat-beat joins and observes exact nearest-first ancestors, located malformed-chain throws and null unclaimed/absent-tree answers.
 * @evidence contracts/testing.md#independent-expectations The fixture's explicitly authored hierarchy supplies literal ancestor ids and claiming beat node, independent of the walkers; tests do not validate all possible screenplay graph shapes.
 * @evidence contracts/testing.md#distinguishing-cases Keeps a deep chain, root, unknown node, dangling parent, cycle, claimed/unclaimed beats and null/undefined tree inputs.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_script_graph and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_script_graph(): void {
  const tree: IAutoMovieScriptNode[] = createScriptTree();
  TestValidator.equals(
    "deep chain walks nearest-first to the root",
    scriptAncestors(tree, "b1"),
    ["grp", "scene1", "act1", "root"],
  );
  TestValidator.equals(
    "the root has no ancestors",
    scriptAncestors(tree, "root"),
    [],
  );
  TestValidator.predicate(
    "unknown node id throws",
    throwsError(
      (): string[] => scriptAncestors(tree, "ghost"),
      "is not in the",
    ),
  );
  TestValidator.predicate(
    "dangling parent mid-walk throws",
    throwsError(
      (): string[] =>
        scriptAncestors(
          tree.map(
            (node: IAutoMovieScriptNode): IAutoMovieScriptNode =>
              node.id === "scene1" ? { ...node, parent: "ghost" } : node,
          ),
          "b1",
        ),
      'parent "ghost" is not in the',
    ),
  );
  TestValidator.predicate(
    "cyclic parent chain throws",
    throwsError(
      (): string[] =>
        scriptAncestors(
          tree.map(
            (node: IAutoMovieScriptNode): IAutoMovieScriptNode =>
              node.id === "root" ? { ...node, parent: "grp" } : node,
          ),
          "b1",
        ),
      "cyclic",
    ),
  );

  TestValidator.equals(
    "beatNodeOf finds the claiming node",
    beatNodeOf(tree, "beat-2"),
    "b2",
  );
  TestValidator.equals(
    "unclaimed beat yields null",
    beatNodeOf(tree, "beat-99"),
    null,
  );
  TestValidator.equals(
    "null tree yields null",
    beatNodeOf(null, "beat-1"),
    null,
  );
  TestValidator.equals(
    "undefined tree yields null",
    beatNodeOf(undefined, "beat-1"),
    null,
  );
}

import { AutoMovieEngineResolve } from "@automovie/engine";
import type { IAutoMovieNode } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** A node of the given id and parent with every other field at rest. */
const node: (id: string, parent: string | null) => IAutoMovieNode = (
  id: string,
  parent: string | null,
): IAutoMovieNode => ({
  id,
  name: null,
  parent,
  kind: "group",
  transform: {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  mesh: null,
  camera: null,
  light: null,
  skin: null,
});

/**
 * `childrenIndex` maps each parent id to its children's ids in input order.
 *
 * Scenarios:
 *
 * 1. Two children of one parent are listed in input order.
 * 2. The root and the internal child appear as parents. Neither leaf appears
 *    as a map key.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names insertion-order siblings, the root as a parent, and the absence of childless entries.
 * @evidence contracts/development/testing.md#behavioral-verification Passes four typed nodes to `childrenIndex`, then checks both ordered child arrays, missing leaf keys, and the map size.
 * @evidence contracts/development/testing.md#independent-expectations The input links b and then a to root, and c to b. So the only entries are root with [b, a] and b with [c], and neither a nor c has an entry.
 */
export function test_engine_resolve_children_index(): void {
  const index: Map<string, string[]> = AutoMovieEngineResolve.childrenIndex([
    node("root", null),
    node("b", "root"),
    node("a", "root"),
    node("c", "b"),
  ]);
  TestValidator.equals(
    "children in input order",
    [index.get("root"), index.get("b")],
    [["b", "a"], ["c"]],
  );
  TestValidator.predicate(
    "a root and a leaf have no entry",
    !index.has("a") && !index.has("c") && index.size === 2,
  );
}

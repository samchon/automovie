import { buildAutoMovieMeshQueryHierarchy } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Spatial partitioning retains admitted boxes and their identity while every
 * node encloses its descendants, so nearest-feature pruning stays conservative.
 * Scenarios:
 * 1. Empty, singleton and twelve-box inputs remain leaves with their exact
 *    extrema, references and order; thirteen boxes split at the median.
 * 2. Each axis can be uniquely widest; equal widths choose X, and equal
 *    centres preserve the original order. Negative coordinates remain metres.
 * 3. Twenty-five boxes recurse into both sides without losing an identity.
 */
export const test_geometry_mesh_query_hierarchy = (): void => {
  const box = (id: number, axis: number) => {
    const low = [-2, -2, -2],
      high = [-1, -1, -1];
    low[axis] = id - 2;
    high[axis] = id - 1;
    return { id, low, high, centre: low.map((v, a) => (v + high[a]) / 2) };
  };
  type Tree = ReturnType<typeof buildAutoMovieMeshQueryHierarchy<ReturnType<typeof box>>>;
  const ids = (tree: Tree): number[] =>
    "triangles" in tree
      ? tree.triangles.map((triangle) => triangle.id)
      : [...ids(tree.left), ...ids(tree.right)];
  for (const count of [0, 1, 12]) {
    const input = Array.from({ length: count }, (_, at) => box(at, 0));
    const tree = buildAutoMovieMeshQueryHierarchy(input);
    TestValidator.predicate("small inputs are leaves", "triangles" in tree);
    if (!("triangles" in tree)) throw new Error("Expected a leaf.");
    TestValidator.predicate("the leaf keeps the owned array", tree.triangles === input);
    TestValidator.predicate("leaf extrema", count === 0
      ? tree.low.every((value) => value === Infinity) &&
        tree.high.every((value) => value === -Infinity)
      : tree.low.every((value) => nclose(value, -2)) &&
        tree.high.every((value, axis) => nclose(value, axis === 0 ? count - 2 : -1)));
  }
  for (const axis of [0, 1, 2]) {
    const input = Array.from({ length: 13 }, (_, at) => box(12 - at, axis));
    const tree = buildAutoMovieMeshQueryHierarchy(input);
    TestValidator.equals("widest axis orders by its centres", ids(tree), Array.from({ length: 13 }, (_, at) => at));
    if ("triangles" in tree) throw new Error("Expected a branch.");
    TestValidator.equals("odd median has six on the left", ids(tree.left).length, 6);
    TestValidator.equals("odd median has seven on the right", ids(tree.right).length, 7);
  }
  const tied = Array.from({ length: 13 }, (_, id) => ({
    id, low: [-2, -2, -2], high: [2, 2, 2], centre: [0, 0, 0],
  }));
  TestValidator.equals("centre ties retain input order", ids(buildAutoMovieMeshQueryHierarchy(tied)), Array.from({ length: 13 }, (_, at) => at));
  const equalWidths = Array.from({ length: 13 }, (_, id) => ({
    id,
    low: [id, -id, 0],
    high: [id + 1, 1 - id, 1],
    centre: [id + 0.5, 0.5 - id, 0.5],
  })).reverse();
  TestValidator.equals("axis width ties choose X before Y", ids(buildAutoMovieMeshQueryHierarchy(equalWidths)), Array.from({ length: 13 }, (_, at) => at));
  const deep = buildAutoMovieMeshQueryHierarchy(Array.from({ length: 25 }, (_, at) => box(24 - at, 2)));
  TestValidator.equals("recursive leaves retain every identity", ids(deep), Array.from({ length: 25 }, (_, at) => at));
  TestValidator.predicate("recursive enclosing bounds",
    deep.low.every((value) => nclose(value, -2)) &&
    deep.high.every((value, axis) => nclose(value, axis === 2 ? 23 : -1)));
};

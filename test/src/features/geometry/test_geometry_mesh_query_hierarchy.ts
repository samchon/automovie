import { buildAutoMovieMeshQueryHierarchy } from "@automovie/engine";
import type { IAutoMovieMeshQueryHierarchy } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Spatial partitioning retains admitted boxes and their identity; the asserted
 * leaf and root bounds enclose those fixtures for conservative query pruning.
 * Scenarios:
 * 1. Empty, singleton and twelve-box inputs remain leaves with their exact
 *    extrema, references and order; thirteen boxes split at the median.
 * 2. Each axis can be uniquely widest; equal widths choose X, and equal
 *    centres preserve the original order. Negative coordinates remain metres.
 * 3. Twenty-five boxes recurse into both sides without losing an identity.
 * 4. Median selection preserves every entry and splits mixed and all-equal
 *    centres at the expected rank without borrowing the scratch array.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds actual query hierarchies and checks leaf ownership/extrema, median splits, retained identities, selected root enclosure, widest-axis selection and stable center ties. It catches lost boxes or incorrect asserted bounds while allowing the documented in-place ordering; it does not inspect every descendant node's bounds.
 * @evidence contracts/development/testing.md#independent-expectations Authored low/high coordinates determine extrema and widest axes; original integer IDs determine populations and equal-center order. Twelve-or-fewer leaf ownership and thirteen-box median behavior are explicit hierarchy contracts, not output snapshots. Empty infinite sentinels are classifications, and enclosure alone does not prove every downstream query.
 * @evidence contracts/development/testing.md#distinguishing-cases Keeps empty/singleton/twelve/thirteen populations, each uniquely widest axis, equal widths and centers, negative bounds and twenty-five-box recursion. Actual ray/clearance nearest-feature behavior is owned by their operation tests; this builder assumes admitted boxes rather than testing new malformed cases.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable named entry directly calls the portable generic hierarchy builder with existing authored boxes and local traversal observers. It starts no process, browser, GPU or native build, installs no consumer and dynamically registers no cases.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Empty, singleton and twelve-box inputs remain leaves with their exact).
 */
export function test_geometry_mesh_query_hierarchy(): void {
  const box: (
    id: number,
    axis: number,
  ) => { id: number; low: number[]; high: number[]; centre: number[] } = (
    id: number,
    axis: number,
  ): { id: number; low: number[]; high: number[]; centre: number[] } => {
    const low: number[] = [-2, -2, -2],
      high: number[] = [-1, -1, -1];
    low[axis] = id - 2;
    high[axis] = id - 1;
    return {
      id,
      low,
      high,
      centre: low.map((v: number, a: number): number => (v + high[a]) / 2),
    };
  };
  type Tree = ReturnType<
    typeof buildAutoMovieMeshQueryHierarchy<ReturnType<typeof box>>
  >;
  const ids: (
    tree: IAutoMovieMeshQueryHierarchy<{
      id: number;
      low: number[];
      high: number[];
      centre: number[];
    }>,
  ) => number[] = (tree: Tree): number[] =>
    "triangles" in tree
      ? tree.triangles.map(
          (triangle: {
            id: number;
            low: number[];
            high: number[];
            centre: number[];
          }): number => triangle.id,
        )
      : [...ids(tree.left), ...ids(tree.right)];
  for (const count of [0, 1, 12]) {
    const input: {
      id: number;
      low: number[];
      high: number[];
      centre: number[];
    }[] = Array.from(
      { length: count },
      (
        _: unknown,
        at: number,
      ): { id: number; low: number[]; high: number[]; centre: number[] } =>
        box(at, 0),
    );
    const tree: IAutoMovieMeshQueryHierarchy<{
      id: number;
      low: number[];
      high: number[];
      centre: number[];
    }> = buildAutoMovieMeshQueryHierarchy(input);
    TestValidator.predicate("small inputs are leaves", "triangles" in tree);
    if (!("triangles" in tree)) throw new Error("Expected a leaf.");
    TestValidator.predicate(
      "the leaf keeps the owned array",
      tree.triangles === input,
    );
    TestValidator.predicate(
      "leaf extrema",
      count === 0
        ? tree.low.every((value: number): boolean => value === Infinity) &&
            tree.high.every((value: number): boolean => value === -Infinity)
        : tree.low.every((value: number): boolean => nclose(value, -2)) &&
            tree.high.every((value: number, axis: number): boolean =>
              nclose(value, axis === 0 ? count - 2 : -1),
            ),
    );
  }
  for (const axis of [0, 1, 2]) {
    const input: {
      id: number;
      low: number[];
      high: number[];
      centre: number[];
    }[] = Array.from(
      { length: 13 },
      (
        _: unknown,
        at: number,
      ): { id: number; low: number[]; high: number[]; centre: number[] } =>
        box(12 - at, axis),
    );
    const tree: IAutoMovieMeshQueryHierarchy<{
      id: number;
      low: number[];
      high: number[];
      centre: number[];
    }> = buildAutoMovieMeshQueryHierarchy(input);
    TestValidator.equals(
      "widest axis orders by its centres",
      ids(tree),
      Array.from({ length: 13 }, (_: unknown, at: number): number => at),
    );
    if ("triangles" in tree) throw new Error("Expected a branch.");
    TestValidator.equals(
      "odd median has six on the left",
      ids(tree.left).length,
      6,
    );
    TestValidator.equals(
      "odd median has seven on the right",
      ids(tree.right).length,
      7,
    );
  }
  const tied: {
    id: number;
    low: number[];
    high: number[];
    centre: number[];
  }[] = Array.from(
    { length: 13 },
    (
      _: unknown,
      id: number,
    ): { id: number; low: number[]; high: number[]; centre: number[] } => ({
      id,
      low: [-2, -2, -2],
      high: [2, 2, 2],
      centre: [0, 0, 0],
    }),
  );
  TestValidator.equals(
    "centre ties retain input order",
    ids(buildAutoMovieMeshQueryHierarchy(tied)),
    Array.from({ length: 13 }, (_: unknown, at: number): number => at),
  );
  const equalWidths: {
    id: number;
    low: number[];
    high: number[];
    centre: number[];
  }[] = Array.from(
    { length: 13 },
    (
      _: unknown,
      id: number,
    ): { id: number; low: number[]; high: number[]; centre: number[] } => ({
      id,
      low: [id, -id, 0],
      high: [id + 1, 1 - id, 1],
      centre: [id + 0.5, 0.5 - id, 0.5],
    }),
  ).reverse();
  TestValidator.equals(
    "axis width ties choose X before Y",
    ids(buildAutoMovieMeshQueryHierarchy(equalWidths)),
    Array.from({ length: 13 }, (_: unknown, at: number): number => at),
  );
  const deep: IAutoMovieMeshQueryHierarchy<{
    id: number;
    low: number[];
    high: number[];
    centre: number[];
  }> = buildAutoMovieMeshQueryHierarchy(
    Array.from(
      { length: 25 },
      (
        _: unknown,
        at: number,
      ): { id: number; low: number[]; high: number[]; centre: number[] } =>
        box(24 - at, 2),
    ),
  );
  TestValidator.equals(
    "recursive leaves retain every identity",
    ids(deep),
    Array.from({ length: 25 }, (_: unknown, at: number): number => at),
  );
  TestValidator.predicate(
    "recursive enclosing bounds",
    deep.low.every((value: number): boolean => nclose(value, -2)) &&
      deep.high.every((value: number, axis: number): boolean =>
        nclose(value, axis === 2 ? 23 : -1),
      ),
  );

  const mixed = [8, 2, 7, 3, 6, 4, 4, 4, 5, 1, 9, 0, 4, 10, 11];
  const entries = mixed.map((centre, id) => ({ ...box(centre, 2), id }));
  const selected = buildAutoMovieMeshQueryHierarchy.partition(entries);
  if ("triangles" in selected) throw new Error("Expected a selected branch.");
  const left = ids(selected.left);
  const right = ids(selected.right);
  TestValidator.equals("selected median splits seven from eight", [7, 8], [
    left.length,
    right.length,
  ]);
  TestValidator.equals(
    "selected faces occupy opposite sides of the median rank",
    [4, 4],
    [
      Math.max(...left.map((id) => mixed[id]!)),
      Math.min(...right.map((id) => mixed[id]!)),
    ],
  );
  TestValidator.equals(
    "selection keeps each original identity exactly once",
    mixed.map((_, id) => id),
    [...left, ...right].sort((a, b) => a - b),
  );
  const selectedTies = buildAutoMovieMeshQueryHierarchy.partition(tied);
  if ("triangles" in selectedTies) throw new Error("Expected a selected branch.");
  TestValidator.equals("all-equal centres still split by rank", [6, 7], [
    ids(selectedTies.left).length,
    ids(selectedTies.right).length,
  ]);
  const scratch = [box(-4, 2)];
  const selectedLeaf = buildAutoMovieMeshQueryHierarchy.partition(scratch);
  scratch.length = 0;
  TestValidator.equals("selected leaf owns its entry list", [-4], ids(selectedLeaf));
}

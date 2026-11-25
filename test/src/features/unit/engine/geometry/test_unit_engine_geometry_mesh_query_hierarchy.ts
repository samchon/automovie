import {
  buildAutoMovieMeshQueryHierarchy,
  refitAutoMovieMeshQueryHierarchy,
} from "@automovie/engine";
import type { IAutoMovieMeshQueryHierarchy } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

interface IBox extends IAutoMovieMeshQueryHierarchy.IEntry {
  id: number;
}

/**
 * `buildAutoMovieMeshQueryHierarchy(entries)` splits boxes at the median of
 * their centres along the node's widest axis (x before y before z on ties,
 * stable among equal centres) down to leaves of at most 12, every node
 * enclosing its entries; `refitAutoMovieMeshQueryHierarchy(tree, replace)`
 * keeps that partition with replaced entries and recomputed boxes.
 *
 * Fixture: box k spans [k - 2, k - 1] along one axis and [-2, -1] on the
 * others.
 *
 * Scenarios:
 *
 * 1. Up to 12 entries are one leaf holding the caller's array with their exact
 *    extrema; none gives the +-Infinity sentinels.
 * 2. Thirteen boxes given in descending order along x, y or z come back in
 *    ascending order, 6 left and 7 right.
 * 3. Thirteen boxes of one extent keep input order; boxes whose x and y widths tie
 *    split along x.
 * 4. Twenty-five boxes along z recurse and keep every identity, the root spanning
 *    [-2, 23] in z.
 * 5. Refitting the 13-box tree with every box moved +10 in x keeps the order and
 *    the split, the root now [8, 21] in x, and shares no leaf array.
 */
export function test_unit_engine_geometry_mesh_query_hierarchy(): void {
  const box = (id: number, axis: number): IBox => {
    const low: number[] = [-2, -2, -2];
    const high: number[] = [-1, -1, -1];
    low[axis] = id - 2;
    high[axis] = id - 1;
    return {
      id,
      low,
      high,
      centre: low.map((v: number, a: number): number => (v + high[a]!) / 2),
    };
  };
  const ids = (tree: IAutoMovieMeshQueryHierarchy<IBox>): number[] =>
    "triangles" in tree
      ? tree.triangles.map((b: IBox): number => b.id)
      : [...ids(tree.left), ...ids(tree.right)];
  const count = (n: number): number[] =>
    Array.from({ length: n }, (_: unknown, k: number): number => k);
  const descending = (n: number, axis: number): IBox[] =>
    count(n).map((k: number): IBox => box(n - 1 - k, axis));

  // 1.
  for (const n of [0, 1, 12]) {
    const input: IBox[] = count(n).map((k: number): IBox => box(k, 0));
    const tree = buildAutoMovieMeshQueryHierarchy(input);
    TestValidator.predicate(
      `${n} leaf`,
      "triangles" in tree && tree.triangles === input,
    );
    TestValidator.equals(
      `${n} extrema`,
      [tree.low, tree.high],
      n === 0
        ? [
            [Infinity, Infinity, Infinity],
            [-Infinity, -Infinity, -Infinity],
          ]
        : [
            [-2, -2, -2],
            [n - 2, -1, -1],
          ],
    );
  }

  // 2.
  for (const axis of [0, 1, 2]) {
    const tree = buildAutoMovieMeshQueryHierarchy(descending(13, axis));
    TestValidator.equals(`axis ${axis} order`, ids(tree), count(13));
    TestValidator.predicate(
      `axis ${axis} split`,
      !("triangles" in tree) &&
        ids(tree.left).length === 6 &&
        ids(tree.right).length === 7,
    );
  }

  // 3.
  const tied: IBox[] = count(13).map(
    (id: number): IBox => ({
      id,
      low: [-2, -2, -2],
      high: [2, 2, 2],
      centre: [0, 0, 0],
    }),
  );
  TestValidator.equals(
    "stable",
    ids(buildAutoMovieMeshQueryHierarchy(tied)),
    count(13),
  );
  const widths: IBox[] = count(13)
    .map(
      (id: number): IBox => ({
        id,
        low: [id, -id, 0],
        high: [id + 1, 1 - id, 1],
        centre: [id + 0.5, 0.5 - id, 0.5],
      }),
    )
    .reverse();
  TestValidator.equals(
    "x before y",
    ids(buildAutoMovieMeshQueryHierarchy(widths)),
    count(13),
  );

  // 4.
  const deep = buildAutoMovieMeshQueryHierarchy(descending(25, 2));
  TestValidator.equals("deep order", ids(deep), count(25));
  TestValidator.equals(
    "deep bounds",
    [deep.low, deep.high],
    [
      [-2, -2, -2],
      [-1, -1, 23],
    ],
  );

  // 5.
  const tree = buildAutoMovieMeshQueryHierarchy(descending(13, 0));
  const moved = refitAutoMovieMeshQueryHierarchy(
    tree,
    (b: IBox): IBox => ({
      id: b.id,
      low: [b.low[0]! + 10, b.low[1]!, b.low[2]!],
      high: [b.high[0]! + 10, b.high[1]!, b.high[2]!],
      centre: [b.centre[0]! + 10, b.centre[1]!, b.centre[2]!],
    }),
  );
  TestValidator.equals("refit order", ids(moved), count(13));
  TestValidator.equals(
    "refit bounds",
    [moved.low, moved.high],
    [
      [8, -2, -2],
      [21, -1, -1],
    ],
  );
  TestValidator.predicate(
    "refit split",
    !("triangles" in tree) &&
      !("triangles" in moved) &&
      ids(moved.left).length === 6 &&
      "triangles" in tree.left &&
      "triangles" in moved.left &&
      tree.left.triangles !== moved.left.triangles,
  );
}

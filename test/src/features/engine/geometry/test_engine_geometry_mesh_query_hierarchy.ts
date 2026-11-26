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
 * The node union has no discriminant, so every tree is compared as its whole
 * expected record (leaf `{ low, high, triangles }`, branch `{ low, high, left,
 * right }`) through its JSON form.
 *
 * Fixture: box k spans [k - 2, k - 1] along one axis and [-2, -1] on the
 * others.
 *
 * Scenarios:
 *
 * 1. Up to 12 entries are one leaf of the entries with their exact extrema; none
 *    gives the +-Infinity sentinels; the leaf holds the caller's own array (a
 *    later push shows in it).
 * 2. Thirteen boxes given in descending order along x, y or z become a branch of
 *    the 6 lowest and the 7 highest, each leaf in ascending order.
 * 3. Thirteen boxes of one extent keep input order; boxes whose x and y widths tie
 *    split along x.
 * 4. Twenty-five boxes along z recurse two levels, every identity kept in order,
 *    the root spanning [-2, 23] in z.
 * 5. Refitting the 13-box tree with every box moved +10 in x keeps the partition
 *    with recomputed boxes, the root now [8, 21] in x.
 * 6. The median-only partition divides mixed and equal centres by rank, keeps
 *    every identity and owns its leaf arrays.
 */
export function test_engine_geometry_mesh_query_hierarchy(): void {
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
  const count = (n: number): number[] =>
    Array.from({ length: n }, (_: unknown, k: number): number => k);
  const descending = (n: number, axis: number): IBox[] =>
    count(n).map((k: number): IBox => box(n - 1 - k, axis));
  const bounds = (boxes: IBox[]) => ({
    low: [0, 1, 2].map((a: number): number =>
      Math.min(...boxes.map((b: IBox): number => b.low[a]!)),
    ),
    high: [0, 1, 2].map((a: number): number =>
      Math.max(...boxes.map((b: IBox): number => b.high[a]!)),
    ),
  });
  const leaf = (boxes: IBox[]) => ({ ...bounds(boxes), triangles: boxes });
  const branch = (
    left: { low: number[]; high: number[] },
    right: { low: number[]; high: number[] },
  ) => ({
    low: left.low.map((v: number, a: number): number =>
      Math.min(v, right.low[a]!),
    ),
    high: left.high.map((v: number, a: number): number =>
      Math.max(v, right.high[a]!),
    ),
    left,
    right,
  });
  const same = (x: unknown, y: unknown): boolean =>
    JSON.stringify(x) === JSON.stringify(y);
  const ids = (tree: unknown): number[] =>
    [...JSON.stringify(tree).matchAll(/"id":(\d+)/g)].map((m) => Number(m[1]));

  // 1.
  for (const n of [1, 12]) {
    const input: IBox[] = count(n).map((k: number): IBox => box(k, 0));
    TestValidator.predicate(
      `${n} leaf`,
      same(buildAutoMovieMeshQueryHierarchy([...input]), leaf(input)),
    );
  }
  TestValidator.predicate(
    "empty",
    same(buildAutoMovieMeshQueryHierarchy([]), {
      low: [Infinity, Infinity, Infinity],
      high: [-Infinity, -Infinity, -Infinity],
      triangles: [],
    }),
  );
  const own: IBox[] = [box(0, 0)];
  const held = buildAutoMovieMeshQueryHierarchy(own);
  own.push(box(7, 0));
  TestValidator.equals("own array", ids(held), [0, 7]);

  // 2.
  for (const axis of [0, 1, 2]) {
    const sorted: IBox[] = count(13).map((k: number): IBox => box(k, axis));
    TestValidator.predicate(
      `axis ${axis}`,
      same(
        buildAutoMovieMeshQueryHierarchy(descending(13, axis)),
        branch(leaf(sorted.slice(0, 6)), leaf(sorted.slice(6))),
      ),
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
    ids(buildAutoMovieMeshQueryHierarchy([...tied])),
    count(13),
  );
  const widths: IBox[] = count(13).map(
    (id: number): IBox => ({
      id,
      low: [id, -id, 0],
      high: [id + 1, 1 - id, 1],
      centre: [id + 0.5, 0.5 - id, 0.5],
    }),
  );
  TestValidator.predicate(
    "x before y",
    same(
      buildAutoMovieMeshQueryHierarchy([...widths].reverse()),
      branch(leaf(widths.slice(0, 6)), leaf(widths.slice(6))),
    ),
  );

  // 4.
  const deep = buildAutoMovieMeshQueryHierarchy(descending(25, 2));
  const z: IBox[] = count(25).map((k: number): IBox => box(k, 2));
  TestValidator.predicate(
    "deep",
    same(
      deep,
      branch(
        leaf(z.slice(0, 12)),
        branch(leaf(z.slice(12, 18)), leaf(z.slice(18))),
      ),
    ) && same(bounds(z), { low: [-2, -2, -2], high: [-1, -1, 23] }),
  );

  // 5.
  const shift = (b: IBox): IBox => ({
    id: b.id,
    low: [b.low[0]! + 10, b.low[1]!, b.low[2]!],
    high: [b.high[0]! + 10, b.high[1]!, b.high[2]!],
    centre: [b.centre[0]! + 10, b.centre[1]!, b.centre[2]!],
  });
  const moved = count(13).map((k: number): IBox => shift(box(k, 0)));
  TestValidator.predicate(
    "refit",
    same(
      refitAutoMovieMeshQueryHierarchy(
        buildAutoMovieMeshQueryHierarchy(descending(13, 0)),
        shift,
      ),
      branch(leaf(moved.slice(0, 6)), leaf(moved.slice(6))),
    ) && same(bounds(moved), { low: [8, -2, -2], high: [21, -1, -1] }),
  );

  // 6.
  const mixed = [8, 2, 7, 3, 6, 4, 4, 4, 5, 1, 9, 0, 4, 10, 11];
  const entries = mixed.map((centre, id) => ({ ...box(centre, 2), id }));
  const selected = buildAutoMovieMeshQueryHierarchy.partition(entries);
  if ("triangles" in selected) throw new Error("Expected a selected branch.");
  const left = ids(selected.left);
  const right = ids(selected.right);
  TestValidator.equals(
    "selected median splits by rank",
    [left.length, right.length],
    [7, 8],
  );
  TestValidator.equals(
    "selected faces are on opposite sides of the median",
    [
      Math.max(...left.map((id) => mixed[id]!)),
      Math.min(...right.map((id) => mixed[id]!)),
    ],
    [4, 4],
  );
  TestValidator.equals(
    "selection retains each original identity",
    [...left, ...right].sort((a, b) => a - b),
    count(mixed.length),
  );
  const selectedTies = buildAutoMovieMeshQueryHierarchy.partition(tied);
  if ("triangles" in selectedTies)
    throw new Error("Expected a selected branch.");
  TestValidator.equals(
    "equal centres still split by rank",
    [ids(selectedTies.left).length, ids(selectedTies.right).length],
    [6, 7],
  );
  const scratch = [box(42, 2)];
  const selectedLeaf = buildAutoMovieMeshQueryHierarchy.partition(scratch);
  scratch.length = 0;
  TestValidator.equals(
    "selected leaf owns its entry list",
    ids(selectedLeaf),
    [42],
  );
}

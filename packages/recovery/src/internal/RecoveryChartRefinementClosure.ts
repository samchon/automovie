/**
 * Close a private rectangle split under laminar opposed interface intervals. Bounds are global unit-square [u0,u1,v0,v1] coordinates; axes 0 and 1 vary u and v. An exact endpoint sweep first establishes one covering layer over every positive-area cell. Every subsequent strict split preserves that partition without moving an endpoint. Proper overlaps propagate an existing smaller end into the opposite leaf; identical, contained and disjoint interfaces need no additional split. Stable geometric and name ordering makes input permutations equivalent.
 *
 * Failure is atomic: invalid coverage, exhausted leaf budgets, unrepresentable levels or colliding child names throw without changing input. Low and high children append .0 and .1 to the parent ID, increment its level and retain its root. This operation establishes rectangle coverage and laminar interfaces only; C0 control relations, field prolongation, approximation improvement and normal or source correspondence remain consumer obligations.
 *
 * @evidence contracts/common.md#principled-implementation Exact UV endpoint sweeps verify one covering layer. Opposed edge intervals are compared in parameter order; each proper overlap is removed by subdividing the overhanging leaf at the other interval's existing endpoint. Strict splits inductively preserve the admitted partition and copy the same global phase.
 * @evidence contracts/common.md#clear-and-simple-design One pure helper owns rectangle admission and deterministic interface closure. It returns an explicit replayable split plan while coefficient relations and previous-field transfer retain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No epsilon merge, midpoint replacement, coordinate weld, source geometry, anatomical policy, guard removal or independently changed boundary phase supplies closure. Unsupported arithmetic and resource limits fail atomically.
 * @evidence contracts/common.md#meaningful-documentation States global normalized UV, exact endpoint comparison, deterministic ordering, root and child identity, immutable failure, budget termination and the separate C0/prolongation obligations.
 * @evidence contracts/performance.md#efficient-algorithms With N final leaves and S returned splits, admission and final coverage use O(N log N) endpoint sweeps. Rebuilding sorted opposed-edge lists after each split costs O((S+1)N log N); two-pointer interface comparisons are linear because admitted same-bank intervals have disjoint interiors. Full rebuilds account for changed child identities and new perpendicular interfaces.
 * @evidence contracts/performance.md#reuse-equivalent-work One endpoint-compressed range-count tree serves each coverage sweep. Each closure round reuses its edge lists to find the first conflict, and every propagated parameter is an existing exact endpoint rather than a new geometric calculation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local leaves, historical names, endpoint trees and edge lists expire on return or failure. Every split increases leaf count by one, bounded by maxLeaves; output owns its arrays and no caller state or external handle is retained.
 */
export function RecoveryChartRefinementClosure(input: {
  leaves: readonly {
    id: string;
    root: string;
    level: number;
    bounds: readonly [number, number, number, number];
  }[];
  request: { leaf: string; axis: 0 | 1; parameter: number };
  maxLeaves: number;
}): {
  leaves: {
    id: string;
    root: string;
    level: number;
    bounds: [number, number, number, number];
  }[];
  splits: {
    leaf: string;
    axis: 0 | 1;
    parameter: number;
    reason: "requested" | "interface-closure";
  }[];
  diagnostics: string[];
} {
  type Leaf = ReturnType<
    typeof RecoveryChartRefinementClosure
  >["leaves"][number];
  type Split = ReturnType<
    typeof RecoveryChartRefinementClosure
  >["splits"][number];
  type Edge = { leaf: string; start: number; end: number };
  type Line = {
    axis: 0 | 1;
    value: number;
    positive: Edge[];
    negative: Edge[];
  };
  const compare: (a: string, b: string) => number = (
    a: string,
    b: string,
  ): number => (a < b ? -1 : a > b ? 1 : 0);
  if (
    !input ||
    !Array.isArray(input.leaves) ||
    !input.leaves.length ||
    !Number.isSafeInteger(input.maxLeaves) ||
    input.maxLeaves < input.leaves.length ||
    !input.request
  )
    throw new Error(
      "A covering private partition, split request and safe leaf budget are required",
    );
  const leaves: Map<string, Leaf> = new Map(),
    names: Set<string> = new Set(),
    splits: Split[] = [];
  for (const leaf of input.leaves) {
    if (
      !leaf ||
      typeof leaf.id !== "string" ||
      !leaf.id.trim() ||
      names.has(leaf.id) ||
      typeof leaf.root !== "string" ||
      !leaf.root.trim() ||
      !Number.isSafeInteger(leaf.level) ||
      leaf.level < 0 ||
      !Array.isArray(leaf.bounds) ||
      leaf.bounds.length !== 4 ||
      !leaf.bounds.every(
        (x: number): boolean => Number.isFinite(x) && x >= 0 && x <= 1,
      ) ||
      !(leaf.bounds[0] < leaf.bounds[1] && leaf.bounds[2] < leaf.bounds[3])
    )
      throw new Error(
        "Private leaves need unique names, roots, safe levels and positive unit rectangles",
      );
    names.add(leaf.id);
    leaves.set(leaf.id, {
      id: leaf.id,
      root: leaf.root,
      level: leaf.level,
      bounds: [leaf.bounds[0], leaf.bounds[1], leaf.bounds[2], leaf.bounds[3]],
    });
  }
  const coverage: () => void = (): void => {
    const rows: Leaf[] = [...leaves.values()];
    const ys: number[] = [
      ...new Set(
        rows.flatMap((leaf: Leaf): number[] => [
          leaf.bounds[2],
          leaf.bounds[3],
        ]),
      ),
    ].sort((a: number, b: number): number => a - b);
    const indices: Map<number, number> = new Map(
      ys.map((y: number, i: number): [number, number] => [y, i]),
    );
    const events: { x: number; lo: number; hi: number; delta: number }[] =
      rows.flatMap(
        (leaf: Leaf): { x: number; lo: number; hi: number; delta: number }[] =>
          [1, -1].map(
            (
              delta: number,
              side: number,
            ): { x: number; lo: number; hi: number; delta: number } => ({
              x: leaf.bounds[side]!,
              lo: indices.get(leaf.bounds[2])!,
              hi: indices.get(leaf.bounds[3])! - 1,
              delta,
            }),
          ),
      );
    events.sort(
      (a: (typeof events)[number], b: (typeof events)[number]): number =>
        a.x - b.x,
    );
    if (
      ys[0] !== 0 ||
      ys.at(-1) !== 1 ||
      events[0]!.x !== 0 ||
      events.at(-1)!.x !== 1
    )
      throw new Error(
        "Private rectangles do not reach every unit-square boundary",
      );
    const minimum: number[] = new Array(4 * ys.length).fill(0),
      maximum: number[] = minimum.slice(),
      lazy: number[] = minimum.slice();
    const add: (
      node: number,
      lo: number,
      hi: number,
      a: number,
      b: number,
      delta: number,
    ) => void = (
      node: number,
      lo: number,
      hi: number,
      a: number,
      b: number,
      delta: number,
    ): void => {
      if (a <= lo && hi <= b) {
        minimum[node]! += delta;
        maximum[node]! += delta;
        lazy[node]! += delta;
        return;
      }
      const middle: number = Math.floor((lo + hi) / 2);
      if (a <= middle) add(2 * node, lo, middle, a, b, delta);
      if (b > middle) add(2 * node + 1, middle + 1, hi, a, b, delta);
      minimum[node] =
        lazy[node]! + Math.min(minimum[2 * node]!, minimum[2 * node + 1]!);
      maximum[node] =
        lazy[node]! + Math.max(maximum[2 * node]!, maximum[2 * node + 1]!);
    };
    for (let at: number = 0; at < events.length; ) {
      const x: number = events[at]!.x;
      do {
        const event: (typeof events)[number] = events[at++]!;
        add(1, 0, ys.length - 2, event.lo, event.hi, event.delta);
      } while (at < events.length && events[at]!.x === x);
      if (
        at < events.length
          ? minimum[1] !== 1 || maximum[1] !== 1
          : minimum[1] !== 0 || maximum[1] !== 0
      )
        throw new Error(
          "Private rectangle coverage has a positive-area gap or overlap",
        );
    }
  };
  coverage();
  const split: (request: Split) => void = (request: Split): void => {
    const parent: Leaf | undefined = leaves.get(request.leaf);
    if (
      !parent ||
      (request.axis !== 0 && request.axis !== 1) ||
      !Number.isFinite(request.parameter)
    )
      throw new Error(
        "A closure split requires a retained leaf, axis and finite global phase",
      );
    const lower: number = 2 * request.axis,
      upper: number = lower + 1;
    if (
      !(
        request.parameter > parent.bounds[lower]! &&
        request.parameter < parent.bounds[upper]!
      )
    )
      throw new Error("A closure split is not representably inside its leaf");
    if (leaves.size >= input.maxLeaves)
      throw new Error("Private interface closure exceeds maxLeaves");
    if (
      !Number.isSafeInteger(parent.level + 1) ||
      names.has(`${parent.id}.0`) ||
      names.has(`${parent.id}.1`)
    )
      throw new Error(
        "Closure child levels or names cannot be represented uniquely",
      );
    leaves.delete(parent.id);
    for (const side of [0, 1] as const) {
      const id: string = `${parent.id}.${side}`,
        bounds: Leaf["bounds"] = [...parent.bounds];
      bounds[side === 0 ? upper : lower] = request.parameter;
      names.add(id);
      leaves.set(id, {
        id,
        root: parent.root,
        level: parent.level + 1,
        bounds,
      });
    }
    splits.push({ ...request });
  };
  split({ ...input.request, reason: "requested" });
  for (;;) {
    const lines: Map<string, Line> = new Map();
    for (const leaf of leaves.values())
      for (const side of [0, 1, 2, 3] as const) {
        const axis: 0 | 1 = side % 2 === 0 ? 0 : 1,
          value: number =
            leaf.bounds[side === 0 ? 2 : side === 1 ? 1 : side === 2 ? 3 : 0]!;
        if (value === 0 || value === 1) continue;
        const key: string = `${axis}:${value}`;
        if (!lines.has(key))
          lines.set(key, { axis, value, positive: [], negative: [] });
        lines
          .get(key)!
          [
            side < 2 ? "positive" : "negative"
          ].push({ leaf: leaf.id, start: leaf.bounds[2 * axis]!, end: leaf.bounds[2 * axis + 1]! });
      }
    let next: Split | undefined;
    for (const line of [...lines.values()].sort(
      (a: Line, b: Line): number => a.axis - b.axis || a.value - b.value,
    )) {
      const order: (a: Edge, b: Edge) => number = (a: Edge, b: Edge): number =>
        a.start - b.start || a.end - b.end || compare(a.leaf, b.leaf);
      line.positive.sort(order);
      line.negative.sort(order);
      for (
        let a: number = 0, b: number = 0;
        a < line.positive.length && b < line.negative.length;
      ) {
        const first: Edge = line.positive[a]!,
          second: Edge = line.negative[b]!;
        if (
          first.start < second.start &&
          second.start < first.end &&
          first.end < second.end
        )
          next = {
            leaf: second.leaf,
            axis: line.axis,
            parameter: first.end,
            reason: "interface-closure",
          };
        else if (
          second.start < first.start &&
          first.start < second.end &&
          second.end < first.end
        )
          next = {
            leaf: first.leaf,
            axis: line.axis,
            parameter: second.end,
            reason: "interface-closure",
          };
        if (next) break;
        if (first.end <= second.end) a++;
        if (second.end <= first.end) b++;
      }
      if (next) break;
    }
    if (!next) break;
    split(next);
  }
  coverage();
  return {
    leaves: [...leaves.values()].sort((a: Leaf, b: Leaf): number =>
      compare(a.id, b.id),
    ),
    splits,
    diagnostics: [
      `Private interface closure applied ${splits.length - 1} propagated splits after one requested split; exact rectangle coverage and opposed laminar intervals checked`,
      "Coefficient C0 constraints, field prolongation, added degrees of freedom and source correspondence require separate consumer validation",
    ],
  };
}

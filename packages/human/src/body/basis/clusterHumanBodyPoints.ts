/**
 * Group points by transitive neighbouring-cube incidence at the declared gap.
 *
 * The groups are connected components of points binned into cubes of side gap and joined across the twenty-six neighbouring cubes. This is cube incidence rather than an exact pair-distance test: neighbouring cubes can over-group distant points. The no-separation argument for points closer than gap requires representable cube quotients and neighbouring integer arithmetic; finite points and positive gap alone do not establish that numerical premise. Groups hold point indices in input order, and group order follows its first point.
 *
 * @evidence contracts/common.md#principled-implementation Cube incidence and neighbouring-cube unions form conservative point components, with transitive chains retained rather than imposing a maximum cluster diameter.
 * @evidence contracts/common.md#clear-and-simple-design One representative per cube and a path-compressed parent array separate spatial lookup from input-ordered result assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This cube rule is not an exact distance predicate or material adjacency; complete finite metre points, positive finite gap and representable cube/neighbour arithmetic are caller premises.
 * @evidence contracts/common.md#meaningful-documentation The prose states neighbour over-grouping, transitive chains, point-index output and deterministic group order.
 * @evidence contracts/performance.md#efficient-algorithms Each of V points performs 27 cube lookups and parent walks; path compression reduces repeated walks, but the implementation has no union-by-rank guarantee and stores O(V) parents and cube/group entries.
 * @evidence contracts/performance.md#reuse-equivalent-work A cube representative reuses connectivity for all points in that cube and path compression reuses discovered roots; no result survives across separate point sets.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned groups contain numeric indices only; parents, cube keys and traversal state become unreachable after return, without external handles or tasks.
 */
export function clusterHumanBodyPoints(
  points: readonly number[],
  gap: number,
): number[][] {
  const count: number = points.length / 3;
  const parent: number[] = Array.from({ length: count }, (_: unknown, v: number): number => v);
  const find: (v: number) => number = (v: number): number => {
    let root: number = v;
    while (parent[root] !== root) root = parent[root];
    while (parent[v] !== root) {
      const next: number = parent[v];
      parent[v] = root;
      v = next;
    }
    return root;
  };
  const cubes: Map<string, number> = new Map<string, number>();
  for (let v: number = 0; v < count; v++) {
    const cube: number[] = [0, 1, 2].map((k: number): number => Math.floor(points[v * 3 + k] / gap));
    for (let dx: number = -1; dx <= 1; dx++)
      for (let dy: number = -1; dy <= 1; dy++)
        for (let dz: number = -1; dz <= 1; dz++) {
          const other: number | undefined = cubes.get(
            cube[0] + dx + "/" + (cube[1] + dy) + "/" + (cube[2] + dz),
          );
          if (other !== undefined) parent[find(v)] = find(other);
        }
    cubes.set(cube.join("/"), v);
  }
  const groups: Map<number, number[]> = new Map<number, number[]>();
  for (let v: number = 0; v < count; v++) {
    const root: number = find(v);
    const group: number[] | undefined = groups.get(root);
    if (group === undefined) groups.set(root, [v]);
    else group.push(v);
  }
  return [...groups.values()];
}

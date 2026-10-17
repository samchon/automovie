/**
 * Union-find vertex components through triangles; unused vertices retain component -1.
 *
 * @evidence contracts/common.md#principled-implementation Union-find joins triangle vertices and labels exactly the triangle-supported components.
 * @evidence contracts/common.md#clear-and-simple-design Unused vertices retain -1 so missing surface support is explicit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Near-linear union/find traversal and O(vertexCount) parent/label storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated work is reused only inside this operation where source identity is fixed; no cross-call or identity-dependent result cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parent map is temporary; returned component labels own their buffer.
 */
export function components(
  vertexCount: number,
  triangles: number[][],
): { comp: Int32Array; count: number } {
  const parent: Int32Array = Int32Array.from(
    { length: vertexCount },
    (_v: unknown, i: number): number => i,
  );
  const root = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  for (const t of triangles) {
    parent[root(t[1])] = root(t[0]);
    parent[root(t[2])] = root(t[0]);
  }
  const labels: Map<number, number> = new Map();
  const comp: Int32Array = new Int32Array(vertexCount).fill(-1);
  for (const t of triangles)
    for (const v of t) {
      const r: number = root(v);
      if (!labels.has(r)) labels.set(r, labels.size);
      comp[v] = labels.get(r)!;
    }
  return { comp, count: labels.size };
}

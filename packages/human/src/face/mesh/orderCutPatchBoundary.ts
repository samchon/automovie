/**
 * Order one simple directed boundary of an admitted triangular cut patch.
 * Source indices/winding and manifold interior connectivity are caller premises;
 * the boundary walk alone does not establish these whole-patch properties.
 *
 * @evidence contracts/common.md#principled-implementation Undirected incidence selects singly used edges with original directions; a unique-successor walk must close and cover every boundary edge. Nasal/replacement callers supply triangular source incidence; interior manifoldness/connectivity remains a premise.
 * @evidence contracts/common.md#clear-and-simple-design Edge counts and directed successors expose original boundary identity/order for fitting, without generating coordinates or synthetic closure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty/branching/open/multiple boundary loops refuse. Interior incidence above two is not independently rejected here and a single boundary cannot certify the whole patch as manifold or clinically valid.
 * @evidence contracts/common.md#meaningful-documentation Prose separates triangular input premises from one-loop ordering, retained winding and unresolved interior properties.
 * @evidence contracts/performance.md#efficient-algorithms T triangles build expected O(T) maps and B edges walk once, O(T+B) work/storage without coordinate search/sorting.
 * @evidence contracts/performance.md#reuse-equivalent-work Edge counts share occurrences and returned order serves rim fitting; changed selections require a new walk rather than cached closure.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local edge/successor/visited maps release and B pairs transfer; no source mutation, history or external handle exists.
 */
export function orderCutPatchBoundary(
  faces: number[][],
): { a: number; b: number }[] {
  if (faces.length === 0)
    throw new Error("A nostril opening must select at least one control face.");
  const edges: Map<string, { a: number; b: number; count: number }> = new Map<
    string,
    { a: number; b: number; count: number }
  >();
  for (const face of faces)
    for (let i: number = 0; i < 3; i++) {
      const a: number = face[i],
        b: number = face[(i + 1) % 3];
      const key: string = Math.min(a, b) + "/" + Math.max(a, b);
      const edge: { a: number; b: number; count: number } | undefined =
        edges.get(key);
      if (edge === undefined) edges.set(key, { a, b, count: 1 });
      else edge.count++;
    }
  const boundary: { a: number; b: number; count: number }[] = [
    ...edges.values(),
  ].filter(
    (edge: { a: number; b: number; count: number }): boolean =>
      edge.count === 1,
  );
  const next: Map<number, { a: number; b: number; count: number }> = new Map(
    boundary.map(
      (edge: {
        a: number;
        b: number;
        count: number;
      }): [number, { a: number; b: number; count: number }] => [edge.a, edge],
    ),
  );
  const ordered: { a: number; b: number }[] = [];
  if (boundary.length === 0 || next.size !== boundary.length)
    throw new Error("A nasal cut must have one simple oriented boundary.");
  let edge: { a: number; b: number; count: number } = boundary[0];
  const visited: Set<number> = new Set<number>();
  while (!visited.has(edge.a)) {
    visited.add(edge.a);
    ordered.push({ a: edge.a, b: edge.b });
    const following: { a: number; b: number; count: number } | undefined =
      next.get(edge.b);
    if (following === undefined)
      throw new Error("A nasal cut boundary must be closed.");
    edge = following;
  }
  if (edge.a !== ordered[0].a || ordered.length !== boundary.length)
    throw new Error("A nasal cut must contain exactly one boundary loop.");
  return ordered;
}

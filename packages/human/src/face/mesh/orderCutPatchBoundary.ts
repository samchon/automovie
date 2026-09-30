

/**
 * Boundary edges of a connected cut patch, preserving its original winding.
 */
export function orderCutPatchBoundary(
  faces: number[][],
): { a: number; b: number }[] {
  if (faces.length === 0)
    throw new Error("A nostril opening must select at least one control face.");
  const edges = new Map<string, { a: number; b: number; count: number }>();
  for (const face of faces)
    for (let i = 0; i < 3; i++) {
      const a = face[i],
        b = face[(i + 1) % 3];
      const key = Math.min(a, b) + "/" + Math.max(a, b);
      const edge = edges.get(key);
      if (edge === undefined) edges.set(key, { a, b, count: 1 });
      else edge.count++;
    }
  const boundary = [...edges.values()].filter((edge) => edge.count === 1);
  const next = new Map(boundary.map((edge) => [edge.a, edge]));
  const ordered: { a: number; b: number }[] = [];
  if (boundary.length === 0 || next.size !== boundary.length)
    throw new Error("A nasal cut must have one simple oriented boundary.");
  let edge = boundary[0];
  const visited = new Set<number>();
  while (!visited.has(edge.a)) {
    visited.add(edge.a);
    ordered.push({ a: edge.a, b: edge.b });
    const following = next.get(edge.b);
    if (following === undefined)
      throw new Error("A nasal cut boundary must be closed.");
    edge = following;
  }
  if (edge.a !== ordered[0].a || ordered.length !== boundary.length)
    throw new Error("A nasal cut must contain exactly one boundary loop.");
  return ordered;
}

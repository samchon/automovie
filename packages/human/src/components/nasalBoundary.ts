/**
 * Bind a nasal opening to a caller-owned control mesh. The footprint predicate
 * classifies strict XY interior points in matching units; the boundary walker
 * converts selected oriented triangle indices into one cyclic attachment.
 * Neither operation mutates input or fits depth. The nose component and its
 * lining share this cycle so their vertex ordering cannot diverge. The caller
 * supplies valid triangle indices; this owner refuses empty, branched, open or
 * disconnected boundary populations, not geometric triangle intersections.
 */
/**
 * Select an ellipse footprint while binding a measured host socket.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Selects the initial nostril footprint used when binding a measured host.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Tests strict interior membership of the caller-owned elliptical XY footprint without changing connectivity.
 */
export const portraitNostrilContains = (
  x: number,
  y: number,
  footprint: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
): boolean =>
  ((x - footprint.x) / footprint.width) ** 2 +
    ((y - footprint.y) / footprint.height) ** 2 <
  1;

/**
 * Boundary edges of a connected cut patch, preserving its original winding.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Retains the oriented attachment rim of a selected component cut.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Counts the cut's edges and refuses an empty, open, branched or multiple-loop boundary before returning its cyclic order.
 */
export function portraitCutBoundary(
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

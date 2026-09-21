/**
 * The vertices on the open boundary of a triangle surface: every endpoint of
 * an edge that only one triangle owns. On the body basis that is the neck
 * ring where the face was cut away, whatever height the cut was made at, so
 * a height rule or a volume cap reads the ring from the topology rather than
 * from a remembered plane.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Finds the clip ring the height rule reads from the surface itself.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Realizes the boundary-edge definition of the ring the measurement rules refer to.
 */
export function humanBodySurfaceBoundary(indices: number[]): number[] {
  const directed = new Set<string>();
  for (let t = 0; t + 2 < indices.length; t += 3)
    for (let k = 0; k < 3; k++)
      directed.add(indices[t + k] + ">" + indices[t + ((k + 1) % 3)]);
  const boundary = new Set<number>();
  for (const key of directed) {
    const [a, b] = key.split(">").map(Number);
    if (!directed.has(b + ">" + a)) {
      boundary.add(a);
      boundary.add(b);
    }
  }
  return [...boundary].sort((x, y) => x - y);
}

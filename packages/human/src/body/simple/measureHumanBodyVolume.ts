/**
 * The volume enclosed by a triangle surface, in cubic metres, with its open
 * boundary loops capped.
 *
 * The signed volume is the sum of the tetrahedra each triangle spans with
 * the origin, `a · (b × c) / 6`; on a closed, consistently wound surface the
 * sum is the enclosed volume up to sign. The body basis is not closed: the
 * face was cut away at the neck, leaving one boundary loop. Every boundary
 * edge (an edge one triangle owns) is fanned to the centroid of all boundary
 * vertices with the winding the owning triangle implies, which closes the
 * neck with a flat cap and leaves the volume below it. A surface with more
 * than one loop is capped loop by loop as long as the loops do not share a
 * centroid worth distinguishing, which the body does not need.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Reads the skin volume the body mass index is solved against.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Realizes the tetrahedron sum and the boundary cap the mass model specifies.
 */
export function measureHumanBodyVolume(
  positions: number[],
  indices: number[],
): number {
  const at = (v: number): number[] => [
    positions[v * 3],
    positions[v * 3 + 1],
    positions[v * 3 + 2],
  ];
  const tetra = (a: number[], b: number[], c: number[]): number =>
    (a[0] * (b[1] * c[2] - b[2] * c[1]) +
      a[1] * (b[2] * c[0] - b[0] * c[2]) +
      a[2] * (b[0] * c[1] - b[1] * c[0])) /
    6;
  let volume = 0;
  const directed = new Map<string, number>();
  for (let t = 0; t + 2 < indices.length; t += 3) {
    const corners = [indices[t], indices[t + 1], indices[t + 2]];
    volume += tetra(at(corners[0]), at(corners[1]), at(corners[2]));
    for (let k = 0; k < 3; k++) {
      const key = corners[k] + ">" + corners[(k + 1) % 3];
      directed.set(key, (directed.get(key) ?? 0) + 1);
    }
  }
  // a boundary edge a>b has no partner b>a
  const boundary: [number, number][] = [];
  const loopVertices = new Set<number>();
  for (const key of directed.keys()) {
    const [a, b] = key.split(">").map(Number);
    if (!directed.has(b + ">" + a)) {
      boundary.push([a, b]);
      loopVertices.add(a);
      loopVertices.add(b);
    }
  }
  if (boundary.length > 0) {
    const centroid = [0, 0, 0];
    for (const v of loopVertices) {
      const p = at(v);
      for (let k = 0; k < 3; k++) centroid[k] += p[k] / loopVertices.size;
    }
    // the cap triangle (b, a, centroid) runs the boundary edge backwards,
    // which is the winding a neighbour across that edge would have
    for (const [a, b] of boundary) volume += tetra(at(b), at(a), centroid);
  }
  return Math.abs(volume);
}

/**
 * Trace the seeded free cycle of a refined, oriented skin surface: the actual oral attachment that `preparePortraitOralLining` joins its interior to before constructing its depth rings. The seed identifies one free cycle, including when a vermilion band has an outer edge. The cycle keeps its original edge orientation, because the enclosure reverses these edges to face inward.
 *
 * Vertex indices and head-frame millimetre positions are caller-owned; only a new ordered index array is returned. No spline estimates the attachment.
 *
 * Complete resident triangles, opposed manifold edges and unique outgoing boundary edges establish disjoint cycles: the opposite incident edges of every interior triangle cancel, so unique free outgoing edges imply unique incoming edges and a closed boundary. Only then is the seed followed, without a geometric proximity search. Finite, noncollapsed rim coordinates are checked before a downstream enclosure copies them. This topology owner does not establish clearance, tissue thickness or the enclosed cavity shape. Changing its order or coordinates changes lining winding and seam identity.
 *
 * @evidence contracts/common.md#principled-implementation Opposed manifold triangle edges leave unique free directed edges whose seeded cycle supplies the actual lining attachment.
 * @evidence contracts/common.md#clear-and-simple-design Topology order replaces geometric proximity or a second lip spline.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid incidence, nonmanifold edges, branching boundary and collapsed/nonfinite rim points refuse; no cavity clearance or tissue thickness is proved.
 * @evidence contracts/common.md#meaningful-documentation The new ordered ids preserve original winding and refer to caller head-millimetre coordinates.
 * @evidence contracts/performance.md#efficient-algorithms Triangle-edge indexing and cycle traversal are linear in topology and boundary length.
 * @evidence contracts/performance.md#reuse-equivalent-work One edge table determines free cycles and the seed chooses the required one without retracing all openings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the owned boundary-id array escapes; temporary maps/rim references are call-local.
 */
export function tracePortraitOralBoundary(
  surface: {
    positions: readonly (readonly number[])[];
    indices: readonly number[];
  },
  seed: number,
): number[] {
  if (
    surface.indices.length % 3 !== 0 ||
    surface.indices.some(
      (id: number): boolean => !Number.isInteger(id) || id < 0 || id >= surface.positions.length,
    )
  )
    throw new Error("Oral lining needs resident complete skin triangles.");
  const edges: Map<string, { a: number; b: number; count: number; }> = new Map<string, { a: number; b: number; count: number }>();
  for (let i: number = 0; i < surface.indices.length; i += 3) {
    const face: number[] = surface.indices.slice(i, i + 3);
    if (new Set(face).size !== 3)
      throw new Error("Oral lining skin triangles need distinct vertices.");
    for (let j: number = 0; j < 3; j++) {
      const a: number = face[j],
        b: number = face[(j + 1) % 3];
      const key: string = `${Math.min(a, b)}/${Math.max(a, b)}`;
      const edge: { a: number; b: number; count: number; } | undefined = edges.get(key);
      if (edge === undefined) edges.set(key, { a, b, count: 1 });
      else {
        if (edge.count === 2 || edge.a === a)
          throw new Error(
            "Oral lining skin must have manifold, opposed edges.",
          );
        edge.count++;
      }
    }
  }
  const next: Map<number, number> = new Map<number, number>();
  for (const edge of edges.values())
    if (edge.count === 1) {
      if (next.has(edge.a))
        throw new Error("Oral lining skin boundary must not branch.");
      next.set(edge.a, edge.b);
    }
  if (!next.has(seed))
    throw new Error("Oral lining seed must lie on a free skin boundary.");
  const boundary: number[] = [seed];
  for (let id: number = next.get(seed)!; id !== seed; id = next.get(id)!)
    boundary.push(id);
  const rim: (readonly number[])[] = boundary.map((id: number): readonly number[] => surface.positions[id]);
  if (rim.some((p: readonly number[]): boolean => p.length !== 3 || !p.every(Number.isFinite)))
    throw new Error("Oral lining rim must contain finite XYZ points.");
  for (let i: number = 0; i < rim.length; i++)
    if (rim[i].every((v: number, axis: number): boolean => v === rim[(i + 1) % rim.length][axis]))
      throw new Error("Oral lining rim edges must have positive length.");
  return boundary;
}

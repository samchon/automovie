/**
 * Trace the seeded free cycle of a refined, oriented skin surface: the actual
 * oral attachment that `preparePortraitOralLining` joins its interior to before
 * constructing its depth rings. The seed identifies one free cycle, including
 * when a vermilion band has an outer edge. The cycle keeps its original edge
 * orientation, because the enclosure reverses these edges to face inward.
 *
 * Vertex indices and head-frame millimetre positions are caller-owned; only a
 * new ordered index array is returned. No spline estimates the attachment.
 *
 * Complete resident triangles, opposed manifold edges and unique outgoing
 * boundary edges establish disjoint cycles: the opposite incident edges of
 * every interior triangle cancel, so unique free outgoing edges imply unique
 * incoming edges and a closed boundary. Only then is the seed followed, without
 * a geometric proximity search. Finite, noncollapsed rim coordinates are
 * checked before a downstream enclosure copies them. This topology owner does
 * not establish clearance, tissue thickness or the enclosed cavity shape.
 * Changing its order or coordinates changes lining winding and seam identity.
 *
 * @evidence contracts/common.md#principled-implementation On a manifold, consistently oriented triangle surface each interior edge is used once in each direction, so the directed edges that appear once are exactly the boundary and each boundary vertex has one outgoing edge; following the seed's outgoing edges therefore traces one closed cycle. The function checks the premises (complete triangles, distinct vertices, opposed manifold edges, no branching) before following it.
 * @evidence contracts/common.md#clear-and-simple-design One topology owner returning indices; the lining that consumes it copies coordinates and adds no second boundary estimate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No proximity search or coordinate coincidence stands in for the topology; every refusal is a violated premise.
 * @evidence contracts/common.md#meaningful-documentation The comment states the surface premises, the orientation of the result, what is checked and what is not established (clearance, tissue thickness or cavity shape).
 * @evidence contracts/modeling.md#spatial-conventions Inputs are host vertex identities and head-frame millimetre positions; positions are only read.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function traces a cycle and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidence contracts/modeling.md#shared-boundaries It selects the free skin cycle the lining is joined to, so the lining's rim is built from the skin's own boundary vertices, not from a second estimate. It refuses a surface without a free cycle at the seed, so the join cannot silently open.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity; it refuses a collapsed or nonfinite rim.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function.
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
      (id) => !Number.isInteger(id) || id < 0 || id >= surface.positions.length,
    )
  )
    throw new Error("Oral lining needs resident complete skin triangles.");
  const edges = new Map<string, { a: number; b: number; count: number }>();
  for (let i = 0; i < surface.indices.length; i += 3) {
    const face = surface.indices.slice(i, i + 3);
    if (new Set(face).size !== 3)
      throw new Error("Oral lining skin triangles need distinct vertices.");
    for (let j = 0; j < 3; j++) {
      const a = face[j],
        b = face[(j + 1) % 3];
      const key = `${Math.min(a, b)}/${Math.max(a, b)}`;
      const edge = edges.get(key);
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
  const next = new Map<number, number>();
  for (const edge of edges.values())
    if (edge.count === 1) {
      if (next.has(edge.a))
        throw new Error("Oral lining skin boundary must not branch.");
      next.set(edge.a, edge.b);
    }
  if (!next.has(seed))
    throw new Error("Oral lining seed must lie on a free skin boundary.");
  const boundary = [seed];
  for (let id = next.get(seed)!; id !== seed; id = next.get(id)!)
    boundary.push(id);
  const rim = boundary.map((id) => surface.positions[id]);
  if (rim.some((p) => p.length !== 3 || !p.every(Number.isFinite)))
    throw new Error("Oral lining rim must contain finite XYZ points.");
  for (let i = 0; i < rim.length; i++)
    if (rim[i].every((v, axis) => v === rim[(i + 1) % rim.length][axis]))
      throw new Error("Oral lining rim edges must have positive length.");
  return boundary;
}

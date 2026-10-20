/** One directed use of an undirected edge by a source triangle. */
interface IEdgeUse {
  triangle: number;
  a: number;
  b: number;
}

/**
 * Select the connected triangle patch on the inward side of an oriented mesh
 * boundary.
 *
 * The boundary lists each vertex once, in the order the selected faces wind:
 * the triangle that traverses boundary edge `a -> b` in that direction is
 * inside. Selection floods across shared edges from those triangles and never
 * crosses a boundary edge, so it depends on connectivity alone and a pose or a
 * folded projection cannot change which triangles a closed loop encloses.
 *
 * The input must have consistently wound manifold edges, every triangle with
 * three distinct vertices. A boundary edge missing from the mesh is refused, a
 * loop that does not separate the surface is refused, and on an open surface
 * the patch may not reach a free edge outside the supplied boundary.
 *
 * @param props.indices Triangle corner indices, three per triangle.
 * @param props.boundary Distinct vertex indices of the closed loop, at least three, wound like the selected faces.
 * @returns Sorted original triangle ordinals of the patch, suitable for removal without renumbering.
 * @throws Error naming the failed requirement when the input or boundary breaks any rule above.
 *
 * @evidence contracts/common.md#principled-implementation A breadth-first flood over the triangle adjacency graph with the boundary edges removed, seeded by the triangle that uses each boundary edge in the loop's own direction; on a consistently wound manifold that triangle lies on the loop's inner side, and the final check that every boundary edge has exactly one selected neighbour proves the loop separated the surface.
 * @evidence contracts/common.md#clear-and-simple-design One function builds the edge index, seeds, floods and checks separation, because each step reads the same edge map; the portrait host-face cut calls it rather than repeating an image-plane test.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonmanifold, inconsistently wound or degenerate input is refused before any selection, and a nonseparating loop or a leak to an outside free edge throws rather than returning a partial patch.
 * @evidence contracts/common.md#meaningful-documentation States the orientation convention, why selection is topological, the input requirements, each refusal, and that ordinals are original and sorted.
 * @evidence contracts/performance.md#efficient-algorithms For T triangles and B boundary vertices, the edge index, flood and separation check are O(T + B) with one string key per edge, and the final sort is O(K log K) for K selected triangles; the flood visits each triangle once and each edge twice at most.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call answers one mesh and boundary; the portrait builder calls it once per loop, so there is no repeated work to share.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the edge map, per-triangle edge keys, barrier set and work queue are sized by T and released on return, and only the selected ordinal array is returned.
 */
export function selectAutoMovieTriangleRegion(props: {
  indices: readonly number[];
  boundary: readonly number[];
}): number[] {
  const { indices, boundary }: typeof props = props;
  const invalidIndex: (index: number) => boolean = (index: number): boolean =>
    !Number.isInteger(index) || index < 0;
  if (
    indices.length % 3 !== 0 ||
    boundary.length < 3 ||
    new Set(boundary).size !== boundary.length ||
    indices.some(invalidIndex) ||
    boundary.some(invalidIndex)
  )
    throw new Error(
      "A triangle region needs complete triangles and distinct nonnegative boundary vertices.",
    );
  const key: (a: number, b: number) => string = (
    a: number,
    b: number,
  ): string => Math.min(a, b) + "/" + Math.max(a, b);
  const barriers: Set<string> = new Set(
    boundary.map((a: number, i: number): string =>
      key(a, boundary[(i + 1) % boundary.length]!),
    ),
  );
  const edges: Map<string, IEdgeUse[]> = new Map();
  const triangleEdges: string[][] = [];
  for (let i: number = 0; i < indices.length; i += 3) {
    const face: readonly [number, number, number] = [
      indices[i]!,
      indices[i + 1]!,
      indices[i + 2]!,
    ];
    if (face[0] === face[1] || face[1] === face[2] || face[2] === face[0])
      throw new Error(
        "A region source triangle must have three distinct vertices.",
      );
    const identities: string[] = [];
    for (let j: number = 0; j < 3; j++) {
      const a: number = face[j]!;
      const b: number = face[(j + 1) % 3]!;
      const identity: string = key(a, b);
      identities.push(identity);
      const incident: IEdgeUse[] = edges.get(identity) ?? [];
      if (
        incident.length === 2 ||
        incident.some((edge: IEdgeUse): boolean => edge.a === a)
      )
        throw new Error(
          "A region source must have consistently wound manifold edges.",
        );
      incident.push({ triangle: i / 3, a, b });
      edges.set(identity, incident);
    }
    triangleEdges.push(identities);
  }
  const pending: number[] = [];
  for (let i: number = 0; i < boundary.length; i++) {
    const a: number = boundary[i]!;
    const b: number = boundary[(i + 1) % boundary.length]!;
    const inward: IEdgeUse | undefined = edges
      .get(key(a, b))
      ?.find((edge: IEdgeUse): boolean => edge.a === a && edge.b === b);
    if (inward === undefined)
      throw new Error(
        "Every oriented region boundary edge must belong to its selected surface.",
      );
    pending.push(inward.triangle);
  }
  const selected: Set<number> = new Set();
  for (let i: number = 0; i < pending.length; i++) {
    const triangle: number = pending[i]!;
    if (selected.has(triangle)) continue;
    selected.add(triangle);
    for (const identity of triangleEdges[triangle]!) {
      if (barriers.has(identity)) continue;
      const incident: IEdgeUse[] = edges.get(identity)!;
      if (incident.length === 1)
        throw new Error(
          "A region boundary must not select an outside free edge.",
        );
      for (const neighbour of incident)
        if (!selected.has(neighbour.triangle)) pending.push(neighbour.triangle);
    }
  }
  for (const identity of barriers)
    if (
      edges
        .get(identity)!
        .filter((edge: IEdgeUse): boolean => selected.has(edge.triangle))
        .length !== 1
    )
      throw new Error(
        "A region boundary must separate one connected surface patch.",
      );
  return [...selected].sort((a: number, b: number): number => a - b);
}

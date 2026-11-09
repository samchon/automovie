/**
 * Union original triangle incidence at every sampled contour vertex or crossed source edge. The resulting support can include adjacent faces and is not a semantic region or an exact generating patch.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Exact canonical vertex and edge addresses select the already prepared incidence sets; their union preserves original input triangle ordinals.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One helper owns the incidence union reused by fitting provenance, winding support and slab classification.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No nearest-face inference, source filtering, coordinate repair or anatomical classification is introduced.
 * @evidence contracts/development/common.md#meaningful-documentation States original address ownership, incident-support meaning and its patch-membership limitation.
 * @evidence contracts/development/implementation.md#efficient-algorithms For P contour samples and I visited incident faces, expected O(P+I) lookup and insertion time creates O(F) storage for F unique supported faces.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Prepared vertex and edge incidence maps are borrowed unchanged; one union supplies all downstream contour consumers.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned face set for its extraction lifetime; borrowed contour and incidence maps are not retained separately.
 */
export function collectRecoveryContourFaceSupport(
  points: readonly { a: number; b: number }[],
  vertexFaces: ReadonlyMap<number, ReadonlySet<number>>,
  faceEdges: ReadonlyMap<string, ReadonlySet<number>>,
  edgeKey: (a: number, b: number) => string,
): Set<number> {
  const support: Set<number> = new Set();
  for (const point of points) {
    const incident: ReadonlySet<number> | undefined =
      point.a === point.b
        ? vertexFaces.get(point.a)
        : faceEdges.get(edgeKey(point.a, point.b));
    if (incident) for (const triangle of incident) support.add(triangle);
  }
  return support;
}

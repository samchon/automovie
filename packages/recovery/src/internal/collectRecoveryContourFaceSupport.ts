import type { IAutoMovieRecoveryContourFaceSupportCollectionOperation } from "@automovie/interface";

/**
 * Union original triangle incidence at every sampled contour vertex or crossed
 * source edge. The resulting support can include adjacent faces and is not a
 * semantic region or an exact generating patch.
 */
export function collectRecoveryContourFaceSupport(
  points: Parameters<IAutoMovieRecoveryContourFaceSupportCollectionOperation.Operation>[0],
  vertexFaces: Parameters<IAutoMovieRecoveryContourFaceSupportCollectionOperation.Operation>[1],
  faceEdges: Parameters<IAutoMovieRecoveryContourFaceSupportCollectionOperation.Operation>[2],
  edgeKey: Parameters<IAutoMovieRecoveryContourFaceSupportCollectionOperation.Operation>[3],
): ReturnType<IAutoMovieRecoveryContourFaceSupportCollectionOperation.Operation> {
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

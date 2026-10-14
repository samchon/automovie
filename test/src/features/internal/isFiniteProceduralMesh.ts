import { type IAutoMovieMesh } from "@automovie/interface";

/**
 * Observe position/optional-normal finiteness and explicit index integrality.
 * UV/color/skin buffers, cardinality, index range and sparse holes are not checked.
 * The borrowed arrays are not changed; visited components take linear time and
 * constant scratch storage. This partial test observer does not admit a mesh.
 */
export const isFiniteProceduralMesh: (mesh: IAutoMovieMesh) => boolean = (
  mesh: IAutoMovieMesh,
): boolean =>
  mesh.positions.every(Number.isFinite) &&
  (mesh.normals?.every(Number.isFinite) ?? true) &&
  (mesh.indices?.every(Number.isSafeInteger) ?? true);

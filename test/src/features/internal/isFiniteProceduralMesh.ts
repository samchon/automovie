import type { IAutoMovieMesh } from "@automovie/interface";

/** All emitted geometry components and explicit triangle indices remain finite. */
export const isFiniteProceduralMesh = (mesh: IAutoMovieMesh): boolean =>
  mesh.positions.every(Number.isFinite) &&
  (mesh.normals?.every(Number.isFinite) ?? true) &&
  (mesh.indices?.every(Number.isSafeInteger) ?? true);


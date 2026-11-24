import { Box3, Mesh } from "three";

import { AutoMovieSkinnedMesh } from "../AutoMovieSkinnedMesh.js";
import { AutoMovieThreeKind } from "../AutoMovieThreeKind.js";

/**
 * Enclose the current world geometry of a required subject's admitted meshes.
 *
 * A rigid mesh contributes its geometry box under its world matrix. An owned
 * skin contributes its exact posed local extent, already grown by its float32
 * GPU tolerance, under its world matrix; Three keeps posed skinned positions in
 * the mesh's local frame, so the same world transform applies to both.
 *
 * @param meshes Meshes from listAutoMovieCameraSubjectMeshes, with current
 *   world matrices.
 * @returns A finite world box in metres, or undefined when the list is empty or
 *   any contribution is empty or non-finite.
 */
export function boundAutoMovieCameraSubject(
  meshes: readonly Mesh[],
): Box3 | undefined {
  const combined: Box3 = new Box3();
  const world: Box3 = new Box3();
  for (const mesh of meshes) {
    if (AutoMovieThreeKind.isAutoMovieSkinnedMesh(mesh)) mesh.computeBoundingBox();
    else if (mesh.geometry.boundingBox === null)
      mesh.geometry.computeBoundingBox();
    const local: Box3 | null =
      AutoMovieThreeKind.isAutoMovieSkinnedMesh(mesh)
        ? mesh.boundingBox
        : mesh.geometry.boundingBox;
    if (local === null || !isFiniteBox(local)) return undefined;
    world.copy(local).applyMatrix4(mesh.matrixWorld);
    if (!isFiniteBox(world)) return undefined;
    combined.union(world);
  }
  return isFiniteBox(combined) ? combined : undefined;
}

/** Rejects empty, inverted and non-finite bounds, while allowing flat bounds. */
function isFiniteBox(box: Box3): boolean {
  return !box.isEmpty();
}

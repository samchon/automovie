import { Box3, Mesh } from "three";

import { AutoMovieSkinnedMesh } from "../AutoMovieSkinnedMesh.js";

/**
 * Enclose the current world geometry of a required subject's admitted meshes.
 *
 * A rigid mesh contributes its geometry box under its world matrix. An owned
 * skin contributes its exact posed local extent, already grown by its float32
 * GPU tolerance, under its world matrix; Three keeps posed skinned positions in
 * the mesh's local frame, so the same world transform applies to both.
 *
 * @param meshes Meshes from listAutoMovieCameraSubjectMeshes, with current world matrices.
 * @returns A finite world box in metres, or undefined when the list is empty or
 * any contribution is empty or non-finite.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, units, skin padding and the undefined outcome.
 * @evidence contracts/development/implementation.md#principled-implementation An affine image of an enclosing local box encloses the transformed vertices; the skin box is the exact CPU pose extent padded by AutoMovieSkinnedMesh.tolerance, so every vertex the GPU draws lies inside.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission stays with listAutoMovieCameraSubjectMeshes; this only unions the admitted local bounds.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rest or culling sphere never stands in for the posed skin, and one missing contribution refuses the whole subject.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per rigid mesh with a cached geometry box; a skin costs one O(V) pose evaluation only when its pose key changed.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses Three's geometry box and the skin's pose cache, which its writers invalidate.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one new box; a rigid geometry may keep the bounding box Three computes on first use.
 */
export function boundAutoMovieCameraSubject(
  meshes: readonly Mesh[],
): Box3 | undefined {
  const combined: Box3 = new Box3();
  const world: Box3 = new Box3();
  for (const mesh of meshes) {
    if (mesh instanceof AutoMovieSkinnedMesh) mesh.computeBoundingBox();
    else if (mesh.geometry.boundingBox === null)
      mesh.geometry.computeBoundingBox();
    const local: Box3 | null =
      mesh instanceof AutoMovieSkinnedMesh
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
  return (
    !box.isEmpty() &&
    [...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite)
  );
}

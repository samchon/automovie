import * as THREE from "three";

/**
 * Bound the selected mesh population without recursively admitting its
 * children. Vertex sampling uses Three's posed/morphed vertex owner; instances
 * use Three's conservative instance box, as its precise object bounds do.
 * Coordinates are world-space metres. World matrices and derived box caches
 * are refreshed without changing authored transforms or geometry buffers.
 *
 * @evidence contracts/common.md#principled-implementation Reads posed/morphed native vertex positions for selected meshes and applies current world transforms; instances union their conservative native boxes. Admitted finite geometry and current deformation/skeleton state are premises. Missing position attributes contribute nothing and an empty population returns an empty Box3, not a finite framing sphere.
 * @evidence contracts/common.md#clear-and-simple-design Bounding the explicit selected population avoids recursive child admission that would add auxiliary or hidden surfaces; native getVertexPosition owns deformation interpretation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomical proxy box or fixture extent replaces current mesh vertices. Instance bounds are conservative rather than claimed exact visible-surface bounds, and no raster observation is inferred.
 * @evidence contracts/common.md#meaningful-documentation The comment gives world metres, selected-only population, instance approximation and refreshed derived matrices/caches without claiming authored geometry mutation.
 * @evidence contracts/performance.md#efficient-algorithms Visits selected mesh vertices linearly, while native instance box computation includes instance count and geometry bounds. One point accumulator is reused; instance branches allocate temporary transformed boxes.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses native deformation and geometry/instance bound machinery, but rereads current state on each call because selection and transforms are mutable.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one owned Box3 and borrows all meshes. Temporary vector/box records acquire no GPU handle; the scene owner retains geometry and cached native bounds.
 */
export function getHumanObservationBounds(
  meshes: readonly THREE.Mesh[],
): THREE.Box3 {
  const bounds: THREE.Box3 = new THREE.Box3();
  const point: THREE.Vector3 = new THREE.Vector3();
  for (const mesh of meshes) {
    mesh.updateWorldMatrix(true, false);
    if (mesh instanceof THREE.InstancedMesh) {
      mesh.computeBoundingBox();
      bounds.union(mesh.boundingBox!.clone().applyMatrix4(mesh.matrixWorld));
      continue;
    }
    const position: THREE.BufferAttribute<THREE.BufferAttributeEventMap> | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
    if (position === undefined) continue;
    for (let index: number = 0; index < position.count; ++index)
      bounds.expandByPoint(
        mesh.getVertexPosition(index, point).applyMatrix4(mesh.matrixWorld),
      );
  }
  return bounds;
}

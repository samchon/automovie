import * as THREE from "three";

/**
 * Bound exactly the selected mesh population without recursively admitting its
 * children. Vertex sampling uses Three's posed/morphed vertex owner; instances
 * use Three's conservative instance box, as its precise object bounds do.
 * Coordinates are world-space metres. World matrices and derived box caches
 * are refreshed without changing authored transforms or geometry buffers.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Frames the current displayed geometry rather than auxiliary descendants.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Preserves posed source correspondence in observation framing.
 */
export function getHumanObservationBounds(
  meshes: readonly THREE.Mesh[],
): THREE.Box3 {
  const bounds = new THREE.Box3();
  const point = new THREE.Vector3();
  for (const mesh of meshes) {
    mesh.updateWorldMatrix(true, false);
    if (mesh instanceof THREE.InstancedMesh) {
      mesh.computeBoundingBox();
      bounds.union(mesh.boundingBox!.clone().applyMatrix4(mesh.matrixWorld));
      continue;
    }
    const position = mesh.geometry.getAttribute("position");
    if (position === undefined) continue;
    for (let index = 0; index < position.count; ++index)
      bounds.expandByPoint(
        mesh.getVertexPosition(index, point).applyMatrix4(mesh.matrixWorld),
      );
  }
  return bounds;
}

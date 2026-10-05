import type * as THREE from "three";

/**
 * Release the GPU resources of one preview group: every mesh geometry in the
 * group's subtree, then each distinct material once.
 *
 * Materials shared by several meshes are disposed a single time; textures are
 * left to their cache owner, unlike `disposeHumanPreview`, which also disposes
 * the textures of a decoded preview that owns them. The group itself stays
 * usable as a scene node.
 * The body and face preview renderers release replaced or withdrawn frames
 * through this one owner.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Frees a replaced preview frame so continuous editing does not accumulate GPU memory.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Disposes each geometry and each distinct material of a released group exactly once, leaving cached textures to their owner.
 * @author Samchon
 */
export function releaseHumanPreviewGroup(group: THREE.Group): void {
  const materials = new Set<THREE.Material>();
  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh !== true) return;
    mesh.geometry.dispose();
    for (const material of Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material])
      materials.add(material);
  });
  for (const material of materials) material.dispose();
}

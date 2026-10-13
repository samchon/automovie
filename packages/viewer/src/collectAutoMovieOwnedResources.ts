import type * as THREE from "three";

/**
 * Collect the resources a subtree owner may retire, before any disposal event
 * can mutate that subtree. Geometry, standard materials and custom shadow
 * materials are distinct by object identity, including sharing across meshes.
 *
 * Textures are included only for a decoded subtree that owns them. A group
 * backed by a texture cache leaves those wrappers to the cache's independent
 * retirement. This collection does not acquire ownership of borrowed objects:
 * the caller must own the supplied subtree and its declared resource roles.
 * Texture collection covers direct material texture slots, as used by the
 * decoded standard-material previews. Shader uniform textures have their own
 * producer lifetime and are not acquired by this subtree collector.
 *
 * @evidence contracts/common.md#principled-implementation Collects actual owned objects before callbacks can mutate the subtree; identity deduplication follows shared resource ownership.
 * @evidence contracts/common.md#clear-and-simple-design One collector serves cached and decoded subtree owners with explicit texture ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses public subtree and material roles without creating replacement resources or changing foreign methods.
 * @evidence contracts/common.md#meaningful-documentation States ownership, material roles, callback ordering and the direct texture-slot boundary.
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Collects the actual resources declared owned by a subtree without retiring borrowed cache textures.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Separates subtree-owned geometry and materials from independently owned texture wrappers.
 */
export function collectAutoMovieOwnedResources(
  group: THREE.Object3D,
  ownTextures = false,
): readonly { dispose(): void }[] {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh !== true) return;
    geometries.add(mesh.geometry);
    for (const material of Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material])
      materials.add(material);
    if (mesh.customDepthMaterial !== undefined)
      materials.add(mesh.customDepthMaterial);
    if (mesh.customDistanceMaterial !== undefined)
      materials.add(mesh.customDistanceMaterial);
  });
  if (ownTextures)
    for (const material of materials)
      for (const value of Object.values(material))
        if (value?.isTexture === true) textures.add(value);
  return [...geometries, ...materials, ...textures];
}

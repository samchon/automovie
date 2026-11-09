import type * as THREE from "three";

/**
 * Collect the resources a subtree owner may retire, before any disposal event
 * can mutate that subtree. Geometry, standard materials, custom shadow
 * materials and skinned meshes' skeletons are distinct by object identity,
 * including sharing across meshes. A skeleton is collected because its
 * disposal releases the bone texture the renderer allocates on first draw;
 * omitting it left that texture to the GPU until context loss. Skeletons come
 * last, after every geometry, material and texture.
 *
 * Textures are included only for a decoded subtree that owns them. A group
 * backed by a texture cache leaves those wrappers to the cache's independent
 * retirement. This collection does not acquire ownership of borrowed objects:
 * the caller must own the supplied subtree and its declared resource roles.
 * Texture collection covers direct material texture slots, as used by the
 * decoded standard-material previews. Shader uniform textures have their own
 * producer lifetime and are not acquired by this subtree collector.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Snapshots geometry/visible/custom-shadow material identities and skinned-mesh skeletons (whose dispose releases the renderer's bone texture) from actual mesh subclasses before disposal can mutate the subtree, optionally collecting direct native texture slots; the caller must own those roles, and shader-uniform/producer-owned textures remain outside this collector.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Returns a deduplicated retirement population without executing disposal or inferring ownership from attachment; asynchronous/failure-aware retirement stays with its resource owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts ownTextures is an explicit decoded-subtree ownership decision, not a fixture-name inference; actual object identity dedup avoids duplicate calls and no foreign disposal method is replaced.
 * @evidence contracts/development/common.md#meaningful-documentation Gives pre-disposal snapshot purpose, standard/custom-shadow roles, optional texture ownership, borrowed-source prohibition and uniform-texture exclusion.
 * @evidence contracts/development/implementation.md#efficient-algorithms Traverses O subtree nodes and mesh material slots with identity Sets, then optionally scans direct enumerable fields of unique materials; time/storage follow actual unique geometry/material/texture resources, not instance-member count or pixel dimensions.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Deduplicates resources shared by multiple meshes in one snapshot; different mutable subtrees/ownership roles require a fresh collection rather than an attachment-only cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Acquires no resource ownership or task and transfers snapshot references to the caller; its temporary Sets die on return, while the caller must preserve failed/indeterminate owned resources through supported retirement.
 */
export function collectAutoMovieOwnedResources(
  group: THREE.Object3D,
  ownTextures: boolean = false,
): readonly { dispose(): void }[] {
  const geometries: Set<
    THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >
  > = new Set<THREE.BufferGeometry>();
  const materials: Set<THREE.Material<THREE.MaterialEventMap>> =
    new Set<THREE.Material>();
  const textures: Set<THREE.Texture<unknown, THREE.TextureEventMap>> =
    new Set<THREE.Texture>();
  const skeletons: Set<THREE.Skeleton> = new Set<THREE.Skeleton>();
  group.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    // A skinned mesh's skeleton owns the bone texture the renderer uploads its
    // bone matrices into; it is retired with the subtree that bound it.
    if ((object as THREE.SkinnedMesh).isSkinnedMesh === true)
      skeletons.add((object as THREE.SkinnedMesh).skeleton);
    const mesh: THREE.Mesh<
      THREE.BufferGeometry<
        THREE.NormalBufferAttributes,
        THREE.BufferGeometryEventMap
      >,
      | THREE.Material<THREE.MaterialEventMap>
      | THREE.Material<THREE.MaterialEventMap>[],
      THREE.Object3DEventMap
    > = object as THREE.Mesh;
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
  return [...geometries, ...materials, ...textures, ...skeletons];
}

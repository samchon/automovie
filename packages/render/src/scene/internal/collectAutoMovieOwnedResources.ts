import type * as THREE from "three";

import { AutoMovieThreeKind } from "../AutoMovieThreeKind.js";

/*
 * Collect the resources a subtree owner may retire, before any disposal event
 * can mutate that subtree. Geometry, standard materials, custom shadow
 * materials and skinned meshes' skeletons are distinct by object identity,
 * including sharing across meshes. A skeleton is collected because its disposal
 * releases the bone texture the renderer allocates on first draw; omitting it
 * left that texture to the GPU until context loss. Skeletons come last, after
 * every geometry, material and texture.
 *
 * Textures are included only for a decoded subtree that owns them. A group
 * backed by a texture cache leaves those wrappers to the cache's independent
 * retirement. This collection does not acquire ownership of borrowed objects:
 * the caller must own the supplied subtree and its declared resource roles.
 * Texture collection covers direct material texture slots, as used by the
 * decoded standard-material previews. Shader uniform textures have their own
 * producer lifetime and are not acquired by this subtree collector.
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
    if (AutoMovieThreeKind.isSkinnedMesh(object))
      skeletons.add(object.skeleton);
    if (!AutoMovieThreeKind.isMesh(object)) return;
    const mesh: THREE.Mesh = object;
    geometries.add(mesh.geometry);
    for (const material of [mesh.material].flat()) materials.add(material);
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

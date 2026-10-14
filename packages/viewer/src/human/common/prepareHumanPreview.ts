import * as THREE from "three";

import { createHairCardShadowMaterial } from "./createHairCardShadowMaterial.js";

/**
 * Prepare the decoded static face for the preview's shadowed lighting.
 * Transmissive optics pass light while opaque anatomy casts its silhouette;
 * both receive lighting. Fibre cards, hair (a `:hair-cards` finish) and the
 * blended lash and brow cards alike, cast the partial shadow their fibres'
 * coverage and transmittance give (`createHairCardShadowMaterial`) rather
 * than their whole card's. Groups and other non-mesh nodes remain untouched.
 * Resident textures use the supplied device anisotropy limit, capped at 16.
 * Zero denotes an unsupported device and falls back to isotropic filtering.
 * This preview sampler policy does not change exported texture or model bytes.
 *
 * @evidence contracts/common.md#principled-implementation Traverses native meshes, sets shadow participation from supported transmission/alpha material data, optionally installs a hair-card custom depth material and updates distinct texture anisotropy within the finite nonnegative device limit and display cap. These are renderer policies, not anatomical tissue classification or changes to numerical geometry.
 * @evidence contracts/common.md#clear-and-simple-design One group preparation owner applies display material/shadow conventions and canonical hair-card projection; native resource retirement stays with the resident renderer's group/cache scope.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hair-card naming is a declared material role and the broader transparent-textured single-material branch is a display heuristic, not a measured fibre identity. Structural passes may still treat alpha cards as opaque surfaces; current beauty remains unobserved and no anatomical success is inferred.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies mesh-only application, shadow/transmission policy, device limit and zero fallback, and separation from exported bytes. Existing custom depth material is preserved instead of being replaced.
 * @evidence contracts/performance.md#efficient-algorithms Traverses scene nodes and material fields, collecting unique textures in a set; work scales with nodes/material-property occurrences and unique texture updates. Each eligible mesh allocates at most one custom shadow material and existing ones are reused.
 * @evidence contracts/performance.md#reuse-equivalent-work Texture identity deduplicates anisotropy updates and unchanged values avoid needsUpdate. Existing custom depth material prevents duplicate allocation; mutable later pigment changes require the owning renderer's material/reuse policy rather than this preparation silently replacing it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources New custom depth materials become group-owned and are collected by preview-group retirement. Textures remain cache-owned despite sampler mutation; this operation starts no task and provides no partial-setup rollback itself, relying on the caller's registered group scope.
 */
export function prepareHumanPreview(
  group: THREE.Group,
  maxAnisotropy: number = 1,
): void {
  if (!Number.isFinite(maxAnisotropy) || maxAnisotropy < 0)
    throw new Error("Preview anisotropy limit must be finite and nonnegative.");
  const anisotropy: number = Math.max(1, Math.min(16, maxAnisotropy));
  const textures: Set<THREE.Texture<unknown, THREE.TextureEventMap>> = new Set<THREE.Texture>();
  group.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    // Loader and consumer may resolve different Three.js module instances.
    const mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap> = object as THREE.Mesh;
    if (mesh.isMesh !== true) return;
    const materials: THREE.Material<THREE.MaterialEventMap>[] = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const material of materials) {
      material.alphaToCoverage = material.alphaTest > 0;
      for (const value of Object.values(material))
        if (value?.isTexture === true) textures.add(value);
    }
    mesh.castShadow = !materials.some(
      (material: THREE.Material<THREE.MaterialEventMap>): boolean =>
        (material as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial ===
          true && (material as THREE.MeshPhysicalMaterial).transmission > 0,
    );
    mesh.receiveShadow = true;
    const [only]: THREE.Material<THREE.MaterialEventMap>[] = materials;
    if (
      materials.length === 1 &&
      (only!.name.endsWith(":hair-cards") ||
        (only!.transparent &&
          (only as THREE.MeshStandardMaterial).map !== null &&
          (only as THREE.MeshStandardMaterial).map !== undefined)) &&
      (only as THREE.MeshStandardMaterial).color !== undefined &&
      mesh.customDepthMaterial === undefined
    )
      mesh.customDepthMaterial = createHairCardShadowMaterial(
        (only as THREE.MeshStandardMaterial).color,
      );
  });
  for (const texture of textures)
    if (texture.anisotropy !== anisotropy) {
      texture.anisotropy = anisotropy;
      texture.needsUpdate = true;
    }
}

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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Keeps the inspected face readable under orbiting view and shadowed material display.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Applies device-bounded texture sampling and shadow policy without changing the saved anatomical document.
 */
export function prepareHumanPreview(
  group: THREE.Group,
  maxAnisotropy: number = 1,
): void {
  if (!Number.isFinite(maxAnisotropy) || maxAnisotropy < 0)
    throw new Error("Preview anisotropy limit must be finite and nonnegative.");
  const anisotropy = Math.max(1, Math.min(16, maxAnisotropy));
  const textures = new Set<THREE.Texture>();
  group.traverse((object) => {
    // Loader and consumer may resolve different Three.js module instances.
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh !== true) return;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const material of materials) {
      material.alphaToCoverage = material.alphaTest > 0;
      for (const value of Object.values(material))
        if (value?.isTexture === true) textures.add(value);
    }
    mesh.castShadow = !materials.some(
      (material) =>
        (material as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial ===
          true && (material as THREE.MeshPhysicalMaterial).transmission > 0,
    );
    mesh.receiveShadow = true;
    const [only] = materials;
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

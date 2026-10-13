import type * as THREE from "three";

import type { IFormationTierRepresentation } from "./IFormationTierRepresentation.js";

/**
 * Release owned tier geometry, material objects and every declared gait table.
 * Host-owned promoted heroes and model input declarations are never disposed.
 * Shared material identities are released once across the supplied tiers.
 */
export const disposeFormationRepresentations = (
  representations: Iterable<IFormationTierRepresentation>,
): void => {
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  for (const representation of representations) {
    representation.geometry.dispose();
    for (const material of representation.materials) materials.add(material);
    representation.shadows?.dispose();
    if (representation.cycle !== null)
      for (const take of representation.cycle.takes.values())
        textures.add(take.texture);
  }
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
};

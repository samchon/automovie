import type * as THREE from "three";

import type { IFormationTierRepresentation } from "./IFormationTierRepresentation";
import { reportResourceRetirement } from "./reportResourceRetirement";

/*
 * Release owned tier geometry, material objects and every declared gait table.
 * Host-owned promoted heroes and model input declarations are never disposed.
 * Shared material identities are released once across the supplied tiers.
 */
export const disposeFormationRepresentations: (
  representations: Iterable<IFormationTierRepresentation>,
) => void = (representations: Iterable<IFormationTierRepresentation>): void => {
  const geometries: Set<THREE.BufferGeometry> = new Set<THREE.BufferGeometry>();
  const shadows: Set<NonNullable<IFormationTierRepresentation["shadows"]>> =
    new Set<NonNullable<IFormationTierRepresentation["shadows"]>>();
  const materials: Set<THREE.Material> = new Set<THREE.Material>();
  const textures: Set<THREE.Texture> = new Set<THREE.Texture>();
  for (const representation of representations) {
    geometries.add(representation.geometry);
    for (const material of representation.materials) materials.add(material);
    if (representation.shadows !== null) shadows.add(representation.shadows);
    if (representation.cycle !== null)
      for (const take of representation.cycle.takes.values())
        textures.add(take.texture);
  }
  reportResourceRetirement([
    ...[...geometries].map(
      (geometry: THREE.BufferGeometry): (() => void) =>
        (): void =>
          geometry.dispose(),
    ),
    ...[...shadows].map(
      (
        shadow: NonNullable<IFormationTierRepresentation["shadows"]>,
      ): (() => void) =>
        (): void =>
          shadow.dispose(),
    ),
    ...[...materials].map(
      (material: THREE.Material): (() => void) =>
        (): void =>
          material.dispose(),
    ),
    ...[...textures].map(
      (texture: THREE.Texture): (() => void) =>
        (): void =>
          texture.dispose(),
    ),
  ]);
};

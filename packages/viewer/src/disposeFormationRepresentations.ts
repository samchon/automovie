import type * as THREE from "three";

import type { IFormationTierRepresentation } from "./IFormationTierRepresentation.js";
import { reportAutoMovieResourceRetirement } from "./reportAutoMovieResourceRetirement.js";

/**
 * Release owned tier geometry, material objects and every declared gait table.
 * Host-owned promoted heroes and model input declarations are never disposed.
 * Shared material identities are released once across the supplied tiers.
 *
 * @evidence contracts/common.md#principled-implementation Collects actual owned tier geometry, shadow handles, visible materials and every declared gait texture by native identity, then independently invokes each release; iterable tiers must represent resources this owner may retire, and physical GPU release is not certified by public listener completion.
 * @evidence contracts/common.md#clear-and-simple-design One tier retirement projection serves both constructor rollback and runtime close, with shadow-pair ownership delegated to its own independent disposer and no hero/input model disposal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No first throwing geometry/material can skip later resource roles, and shared identities are not retried within this attempt; callbacks are actual public disposers rather than replaced methods or synthetic success counters.
 * @evidence contracts/common.md#meaningful-documentation Gives all owned resource roles, all declared takes rather than active-only texture, shared identity dedup and borrowed-hero/input exclusions.
 * @evidence contracts/performance.md#efficient-algorithms Visits tier/material/take entries once to build identity Sets and then R unique resource operations, O(entries+R) time and O(R) temporary references independent of anonymous member count.
 * @evidence contracts/performance.md#reuse-equivalent-work One attempt deduplicates shared geometry/material/shadow/texture objects; constructor and runtime callers reuse this implementation, while their lifetime owner must memoize completion rather than re-invoking this effectful primitive.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires no new GPU resource and borrows the tier collection only for snapshot/retirement; attempts every role before reporting failures, and the calling lifetime owner must retain failed/indeterminate handles until its supported physical boundary ends.
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
  reportAutoMovieResourceRetirement([
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

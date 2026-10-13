import type * as THREE from "three";

import type { IFormationTierRepresentation } from "./IFormationTierRepresentation.js";

/**
 * Bind one resident tier's cycle to its mesh and supported shadow projections.
 * Structural overrides discover the same cycle through mesh metadata; shadow
 * dispatch consumes the tier-owned pair. Static tiers keep Three's defaults.
 * Original palette identities remain authoritative during temporary guide
 * overrides, so no pass creates new shadow-program identities for this mesh.
 *
 * @evidence requirements/lighting/shadows-reflections-and-transmission.md#lighting-shadow-time-sampling Binds beauty, structural and punctual shadow projections to one tier's actual cycle.
 * @evidence specifications/camera-light-and-visibility/light-transport-color-and-budget.md#clv-shadow-state-sampling Preserves Three's grouped shadow dispatch while associating its actual palette and cycle owner.
 */
export const bindFormationTierCycle = (
  mesh: THREE.InstancedMesh,
  representation: IFormationTierRepresentation,
): void => {
  if (representation.cycle !== null)
    mesh.userData.automovieFormationCycle = representation.cycle;
  const shadows = representation.shadows;
  if (shadows === null) return;
  mesh.customDepthMaterial = shadows.depth;
  mesh.customDistanceMaterial = shadows.distance;
  mesh.onBeforeShadow = (_renderer, _object, _camera, _shadowCamera, _geometry, material, group) => {
    // Three r186 dispatches a geometry group. The installed Object3D
    // declaration currently names the scene-graph Group at this boundary.
    const drawGroup = group as unknown as THREE.BufferGeometry["groups"][number] | null;
    const palette = representation.materials[drawGroup?.materialIndex ?? 0]!;
    shadows.beforeDraw(material, palette);
  };
};

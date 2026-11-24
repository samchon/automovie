import type * as THREE from "three";

import type { IFormationTierRepresentation } from "./IFormationTierRepresentation.js";

/**
 * Bind one resident tier's cycle to its mesh and supported shadow projections.
 * Structural overrides discover the same cycle through mesh metadata; shadow
 * dispatch consumes the tier-owned pair. Static tiers keep Three's defaults.
 * Original palette identities remain authoritative during temporary guide
 * overrides, so no pass creates new shadow-program identities for this mesh.
 */
export const bindFormationTierCycle: (
  mesh: THREE.InstancedMesh,
  representation: IFormationTierRepresentation,
) => void = (
  mesh: THREE.InstancedMesh,
  representation: IFormationTierRepresentation,
): void => {
  if (representation.cycle !== null)
    mesh.userData.automovieFormationCycle = representation.cycle;
  const shadows: {
    depth: THREE.MeshDepthMaterial;
    distance: THREE.MeshDistanceMaterial;
    beforeDraw: (
      material: THREE.Material,
      paletteMaterial: THREE.Material,
    ) => void;
    dispose: () => void;
  } | null = representation.shadows;
  if (shadows === null) return;
  mesh.customDepthMaterial = shadows.depth;
  mesh.customDistanceMaterial = shadows.distance;
  mesh.onBeforeShadow = (
    _renderer: THREE.WebGLRenderer,
    _object: THREE.Scene<THREE.Object3DEventMap>,
    _camera: THREE.Camera,
    _shadowCamera: THREE.Camera,
    _geometry: THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    material: THREE.Material<THREE.MaterialEventMap>,
    // Three r186 dispatches the drawn geometry group, or null for an ungrouped
    // draw; its declaration names the scene-graph Group, so the parameter
    // admits both and the group's flag tells them apart.
    group: THREE.Group | THREE.GeometryGroup | null,
  ): void => {
    const palette: THREE.Material<THREE.MaterialEventMap> =
      representation.materials[
        isGeometryGroup(group) ? (group.materialIndex ?? 0) : 0
      ]!;
    shadows.beforeDraw(material, palette);
  };
};

/** Whether a shadow draw names a geometry group rather than a scene group. */
function isGeometryGroup(
  group: THREE.Group | THREE.GeometryGroup | null,
): group is THREE.GeometryGroup {
  return group !== null && (group as THREE.Group).isGroup !== true;
}

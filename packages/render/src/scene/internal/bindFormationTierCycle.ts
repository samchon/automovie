import type * as THREE from "three";

import type { IFormationTierRepresentation } from "./IFormationTierRepresentation";
import { selectFormationShadowPalette } from "./selectFormationShadowPalette";

/*
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
    geometry: THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    material: THREE.Material<THREE.MaterialEventMap>,
    group: THREE.Group | THREE.GeometryGroup | null,
  ): void => {
    shadows.beforeDraw(
      material,
      selectFormationShadowPalette(geometry, representation.materials, group),
    );
  };
};

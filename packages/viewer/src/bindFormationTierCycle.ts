import type * as THREE from "three";

import type { IFormationTierRepresentation } from "./IFormationTierRepresentation.js";

/**
 * Bind one resident tier's cycle to its mesh and supported shadow projections.
 * Structural overrides discover the same cycle through mesh metadata; shadow
 * dispatch consumes the tier-owned pair. Static tiers keep Three's defaults.
 * Original palette identities remain authoritative during temporary guide
 * overrides, so no pass creates new shadow-program identities for this mesh.
 *
 * @evidence contracts/common.md#principled-implementation Attaches the tier's exact cycle metadata and custom depth/distance pair, then selects original palette identity using the actual geometry draw-group material index before native shadow draw; admitted group indices must match the tier palette and the pinned Three runtime's geometry-group callback differs from its declared scene-Group type.
 * @evidence contracts/common.md#clear-and-simple-design One mesh binding exposes shared cycle identity to structural overrides and shadow resources to native dispatch, keeping palette-specific program policy with the tier shadow-material owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses original palette identity rather than temporary guide material identity; the callback cast describes the pinned native runtime boundary, not a fixture group fallback, and no Three prototype method is replaced.
 * @evidence contracts/common.md#meaningful-documentation States static omission, visible/structural/shadow identity sharing and original-palette authority; the inline cast comment records the native/declaration geometry-group mismatch.
 * @evidence contracts/performance.md#efficient-algorithms Installs fixed-count references/callback once per mesh; each shadow draw resolves one palette slot and performs the shadow owner's constant identity lookup, without per-member traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Meshes of one tier borrow the same cycle/shadow pair and palette identity table; temporary guide overrides do not create duplicate shadow program identities.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Mesh callback/metadata retain borrowed tier resources through mesh lifetime; tier construction/runtime disposal owns physical materials/textures, and this binder allocates no separate GPU handle or task.
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
    group: THREE.Group<THREE.Object3DEventMap>,
  ): void => {
    // Three r186 dispatches a geometry group. The installed Object3D
    // declaration currently names the scene-graph Group at this boundary.
    const drawGroup: THREE.GeometryGroup | null = group as unknown as
      | THREE.BufferGeometry["groups"][number]
      | null;
    const palette: THREE.Material<THREE.MaterialEventMap> =
      representation.materials[drawGroup?.materialIndex ?? 0]!;
    shadows.beforeDraw(material, palette);
  };
};

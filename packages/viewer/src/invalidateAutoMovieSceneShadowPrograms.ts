import type * as THREE from "three";

/**
 * Invalidate unique scene materials after the effective shadow enablement or filter changes. Three's program keys include shadow state, but changing the renderer flag alone does not always reevaluate an existing material program. The public needsUpdate boundary makes that changed state observable without touching SDK methods or caches. Shared materials are marked only once.
 *
 * @evidence contracts/common.md#principled-implementation Collects unique actual scene/override materials and marks their public needsUpdate boundary after effective shadow state changes.
 * @evidence contracts/common.md#clear-and-simple-design Shadow-state application owns deciding when invalidation is needed; this helper owns only deduplicated material notification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No Three cache key, method or native program is replaced, and shared materials receive one update request regardless of scene aliases.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies effective shadow enable/filter changes, supported material notification and SDK program-key ownership.
 * @evidence contracts/performance.md#efficient-algorithms One N-object traversal and M-material Set cost O(N+M) expected work with O(M) temporary references; full scan is needed to discover shared scene materials.
 * @evidence contracts/performance.md#reuse-equivalent-work Set identity reuses each material within this invalidation, while native program reuse remains Three's responsibility after notified state changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Materials are borrowed and the temporary Set leaves the call; no shader program is acquired/disposed or retained in this helper.
 */
export const invalidateAutoMovieSceneShadowPrograms: (
  scene: THREE.Scene,
) => void = (scene: THREE.Scene): void => {
  const materials: Set<THREE.Material> = new Set();
  if (scene.overrideMaterial !== null) materials.add(scene.overrideMaterial);
  scene.traverse((object: THREE.Object3D): void => {
    const material: THREE.Material | THREE.Material[] | undefined = (
      object as THREE.Mesh
    ).material;
    if (Array.isArray(material))
      for (const value of material) materials.add(value);
    else if (material !== undefined) materials.add(material);
  });
  for (const material of materials) material.needsUpdate = true;
};

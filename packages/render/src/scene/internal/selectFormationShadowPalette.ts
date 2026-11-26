import type * as THREE from "three";

/**
 * The palette material a formation's shadow draw stands for: the material of
 * the geometry group three's shadow map is drawing, or the first palette entry
 * for an ungrouped draw or a group the geometry does not hold.
 *
 * Three passes the drawn entry of `geometry.groups`, or null, typed as a
 * `THREE.Group | THREE.GeometryGroup | null`; only an entry of the geometry's
 * own groups selects a palette material.
 */
export function selectFormationShadowPalette(
  geometry: THREE.BufferGeometry,
  palette: readonly THREE.Material[],
  group: THREE.Group | THREE.GeometryGroup | null,
): THREE.Material {
  const drawn: THREE.GeometryGroup | undefined = geometry.groups.find(
    (entry: THREE.GeometryGroup): boolean => entry === group,
  );
  const material: THREE.Material | undefined =
    palette[drawn?.materialIndex ?? 0];
  if (material === undefined)
    throw new Error("A formation shadow draw needs its palette material");
  return material;
}

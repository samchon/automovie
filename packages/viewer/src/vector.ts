import * as THREE from "three";

/**
 * Copies a resolved metre-space vector into a newly owned Three vector without changing its components.
 *
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Copies a resolved metre-space vector into a newly owned Three vector without changing its components.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Copies a resolved metre-space vector into a newly owned Three vector without changing its components.
 */
export const vector = (value: {
  x: number;
  y: number;
  z: number;
}): THREE.Vector3 => new THREE.Vector3(value.x, value.y, value.z);

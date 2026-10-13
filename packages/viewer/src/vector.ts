import * as THREE from "three";

/**
 * Copies a resolved metre-space vector into a newly owned Three vector without changing its components.
 */
export const vector = (value: {
  x: number;
  y: number;
  z: number;
}): THREE.Vector3 => new THREE.Vector3(value.x, value.y, value.z);

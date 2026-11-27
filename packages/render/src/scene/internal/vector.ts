import * as THREE from "three";

/*
 * Copy an admitted resolved metre-space vector into a newly owned Three vector,
 * preserving its three components and frame.
 */
export function vector(value: {
  x: number;
  y: number;
  z: number;
}): THREE.Vector3 {
  return new THREE.Vector3(value.x, value.y, value.z);
}

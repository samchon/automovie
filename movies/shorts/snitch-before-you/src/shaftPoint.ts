import * as THREE from "three";

/**
 * Resolve the shared rigid shaft frame used by props, grips and support.
 *
 * @evidence contracts/common.md#implementation-and-ownership One rotation/translation definition owns each broom-local point; geometry and hands do not maintain competing transforms.
 * @evidence contracts/common.md#authoring-interface Position and points use metres; quaternion owns heading/pitch/bank, with legacy pitch fallback for isolated diagnostics. Returns an owned world vector and retains no input.
 */
export function shaftPoint(broom: { position: THREE.Vector3; pitch: number; quaternion?: THREE.Quaternion }, x: number, y: number, z: number): THREE.Vector3 {
  const rotation: THREE.Quaternion = broom.quaternion ?? new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), broom.pitch);
  return new THREE.Vector3(x, y, z).applyQuaternion(rotation).add(broom.position);
}

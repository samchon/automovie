import * as THREE from "three";

/**
 * Align an actual prop-local witness with an actual world contact.
 *
 * @evidence contracts/common.md#implementation-and-ownership Rigid placement subtracts the rotated local witness from the world contact; it neither changes geometry nor moves the supporting limb. Both inputs remain caller-owned.
 * @evidence contracts/common.md#authoring-interface Supply the prop root, its current actual local anchor, a world contact and a finite unit orientation. The root must have no transformed parent. Returns the measured world anchor error in metres.
 */
export function placePropAnchor(object: THREE.Object3D, anchor: THREE.Vector3, contact: THREE.Vector3, rotation: THREE.Quaternion): number {
  if (![...anchor.toArray(), ...contact.toArray(), ...rotation.toArray()].every(Number.isFinite) || Math.abs(rotation.lengthSq() - 1) > 1e-6)
    throw new Error("Prop contact requires finite points and a unit quaternion");
  object.quaternion.copy(rotation);
  object.position.copy(contact).sub(anchor.clone().applyQuaternion(rotation));
  object.updateMatrixWorld(true);
  return object.localToWorld(anchor.clone()).distanceTo(contact);
}

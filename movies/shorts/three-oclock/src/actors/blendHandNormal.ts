import * as THREE from "three";

/**
 * Follow a unit orientation course without collapsing an antipodal hand marker.
 *
 * @evidence contracts/common.md#implementation-and-ownership Uses quaternion rotation of a unit normal, never linear interpolation of marker endpoints. An antipodal course projects the supplied fixed anatomical axis onto the start-normal plane, keeping the half-turn direction stable. Endpoint normalization retains the60mm marker's rigid length. No pose, mesh or contact is substituted.
 * @evidence contracts/common.md#authoring-interface Finite unit start/end normals, a stable nonparallel axis and bounded weight return an owned unit vector. A fixed actual reference frame owns the start through a transition. Ambiguous antipodal axes refuse rather than guessing. Clinical fitting and actual continuity remain consumer checks.
 */
export function blendHandNormal(from: THREE.Vector3, to: THREE.Vector3, weight: number, axis: THREE.Vector3): THREE.Vector3 {
  if (![...from.toArray(), ...to.toArray(), ...axis.toArray(), weight].every(Number.isFinite) || Math.abs(from.length() - 1) > 1e-6 || Math.abs(to.length() - 1) > 1e-6 || weight < 0 || weight > 1)
    throw new Error("Hand normal course needs finite unit endpoints and bounded weight");
  if (weight === 0) return from.clone(); if (weight === 1) return to.clone();
  let turn: THREE.Quaternion;
  if (from.dot(to) < -1 + 1e-8) {
    const stable: THREE.Vector3 = axis.clone().addScaledVector(from, -axis.dot(from));
    if (stable.lengthSq() < 1e-12) throw new Error("Antipodal hand course has no stable half-turn axis");
    turn = new THREE.Quaternion().setFromAxisAngle(stable.normalize(), Math.PI);
  } else turn = new THREE.Quaternion().setFromUnitVectors(from, to);
  return from.clone().applyQuaternion(new THREE.Quaternion().slerpQuaternions(new THREE.Quaternion(), turn, weight)).normalize();
}

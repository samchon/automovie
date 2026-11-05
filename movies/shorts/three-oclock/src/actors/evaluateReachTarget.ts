import * as THREE from "three";

/**
 * Aim a bounded reach from the actual supported shoulder toward a source object.
 *
 * @evidence contracts/common.md#implementation-and-ownership Uses current world-metre shoulder position and measured arm/anchor length to place a goal along the actual object direction. The fraction leaves room for orientation; this is a geometric authored goal, not proof of clinical reach or contact. Public IK and the actual scene still admit or refuse it. No body dimension or world point is rescaled to disguise failure.
 * @evidence contracts/common.md#authoring-interface Finite source/destination vectors, positive measured reach and fraction in0–1 return an owned point. Coincident points refuse rather than inventing a direction. The interrupted first reach uses a floorward ray without demanding floor contact before the forehead stop.
 */
export function evaluateReachTarget(shoulder: THREE.Vector3, towards: THREE.Vector3, reach: number, fraction: number): THREE.Vector3 {
  if (![...shoulder.toArray(), ...towards.toArray(), reach, fraction].every(Number.isFinite) || reach <= 0 || fraction <= 0 || fraction > 1)
    throw new Error("Reach needs finite world points, positive measured length and bounded fraction");
  const direction: THREE.Vector3 = towards.clone().sub(shoulder);
  if (direction.lengthSq() <= 1e-16) throw new Error("A coincident object supplies no reach direction");
  return shoulder.clone().addScaledVector(direction.normalize(), reach * fraction);
}

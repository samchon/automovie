import * as THREE from "three";

/**
 * Plant the actual heel-to-front material lines without shortening either rigid shoe.
 *
 * @evidence contracts/common.md#implementation-and-ownership The entry vectors come from the previous admitted public posed shoe carriers. Quaternion interpolation rotates each measured rigid line toward its neutral flat counterpart around the continuing front-sole goal; it never interpolates an already solved pose or changes a displayed vertex. The resulting heel targets still require full Human/shoe grounding admission.
 * @evidence contracts/common.md#authoring-interface Supply finite world front points, equal-length actual/flat heel offsets and a bounded phase. Return independent world heel goals. A changed shoe length or invalid phase refuses. The caller owns the frozen entry vectors and canonical phase clock; seeking must consume the resulting baked states.
 */
export function interpolateDuelHeelTargets(front: { left: THREE.Vector3; right: THREE.Vector3 }, entry: { left: THREE.Vector3; right: THREE.Vector3 }, flat: { left: THREE.Vector3; right: THREE.Vector3 }, progress: number): { left: THREE.Vector3; right: THREE.Vector3 } {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new Error("Heel planting requires a bounded phase");
  const result: { left: THREE.Vector3; right: THREE.Vector3 } = { left: new THREE.Vector3(), right: new THREE.Vector3() };
  for (const side of ["left", "right"] as const) {
    if (![...front[side].toArray(), ...entry[side].toArray(), ...flat[side].toArray()].every(Number.isFinite) || entry[side].length() < 0.01 || Math.abs(entry[side].length() - flat[side].length()) > 0.000001) throw new Error("Heel planting requires unchanged finite rigid material lines");
    const rotation: THREE.Quaternion = new THREE.Quaternion().setFromUnitVectors(entry[side].clone().normalize(), flat[side].clone().normalize());
    result[side].copy(entry[side]).applyQuaternion(new THREE.Quaternion().slerp(rotation, progress)).add(front[side]);
  }
  return result;
}

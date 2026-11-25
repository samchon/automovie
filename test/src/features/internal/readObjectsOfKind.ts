import type * as THREE from "three";

/** Every object of a list, each of the kind the guard admits, refusing another. */
export function readObjectsOfKind<Kind extends THREE.Object3D>(
  objects: readonly THREE.Object3D[],
  is: (object: THREE.Object3D) => object is Kind,
): Kind[] {
  return objects.map((object: THREE.Object3D, index: number): Kind => {
    if (!is(object)) throw new Error(`Object ${index} is of another kind`);
    return object;
  });
}

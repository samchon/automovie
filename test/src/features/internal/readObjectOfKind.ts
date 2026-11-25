import type * as THREE from "three";

/**
 * The object at `index` of a list, of the kind the guard admits, refusing an
 * absent object or one of another kind.
 */
export function readObjectOfKind<Kind extends THREE.Object3D>(
  objects: readonly THREE.Object3D[],
  index: number,
  is: (object: THREE.Object3D) => object is Kind,
): Kind {
  const object: THREE.Object3D | undefined = objects[index];
  if (object === undefined || !is(object))
    throw new Error(`Object ${index} is absent or of another kind`);
  return object;
}

import * as THREE from "three";

/*
 * Place an object so that its local space is the world space of a source
 * object, wherever the object itself is attached.
 *
 * The object must not update its own matrix. `local` is applied inside the
 * source's space, which is how marks follow one instance of an instanced mesh.
 * The source's world matrix and the world matrix of the object's parent must be
 * current.
 */
export function followInspectionSource(
  object: THREE.Object3D,
  source: THREE.Object3D,
  local?: THREE.Matrix4,
): void {
  object.matrix.copy(source.matrixWorld);
  if (local !== undefined) object.matrix.multiply(local);
  if (object.parent !== null)
    object.matrix.premultiply(
      new THREE.Matrix4().copy(object.parent.matrixWorld).invert(),
    );
  object.updateMatrixWorld(true);
}

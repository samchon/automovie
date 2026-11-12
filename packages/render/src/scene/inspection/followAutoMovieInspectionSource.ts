import * as THREE from "three";

/**
 * Place an object so that its local space is the world space of a source object, wherever the object itself is attached.
 *
 * The object must not update its own matrix. `local` is applied inside the source's space, which is how marks follow one instance of an instanced mesh. The source's world matrix and the world matrix of the object's parent must be current.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the resulting placement, the optional inner transform and both preconditions.
 * @evidence contracts/development/implementation.md#principled-implementation The object's world matrix must equal the source's, so its local matrix is the inverse of its parent's world matrix times the source's world matrix.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Copy, the optional inner transform, the parent's inverse, then one world-matrix refresh.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The parent's transform is cancelled instead of assumed to be the identity.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: at most two matrix products and one inversion.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The curve and defect overlays both follow their source through this function.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One temporary matrix when the object has a parent; neither object is retained.
 */
export function followAutoMovieInspectionSource(
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

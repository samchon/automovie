import * as THREE from "three";

/**
 * Update a matched parallel comparison from a standalone centred camera. The
 * target-plane height follows its effective perspective field of view, while
 * one native orthographic camera removes depth-dependent magnification. Equal
 * offsets along camera screen-right preserve the same view direction, scale and
 * vertical framing for both unchanged subjects, including profile views. World
 * coordinates and separation use model metres. Parented/scaled cameras, manual
 * source matrices and off-axis source lenses are outside this contract. Supply
 * distinct input and output objects. The output camera and vector are mutable
 * scratch; a refused output is unqualified.
 */
export function updateAutoMovieComparisonCamera(input: {
  perspective: THREE.PerspectiveCamera;
  comparison: THREE.OrthographicCamera;
  target: THREE.Vector3;
  halfSeparation: number;
  offset: THREE.Vector3;
}): void {
  const source: THREE.PerspectiveCamera = input.perspective;
  const distance: number = source.position.distanceTo(input.target);
  const halfHeight: number =
    distance * Math.tan((source.getEffectiveFOV() * Math.PI) / 360);
  const halfWidth: number = halfHeight * source.aspect;
  if (
    source.parent !== null ||
    input.comparison.parent !== null ||
    !source.matrixAutoUpdate ||
    !input.comparison.matrixAutoUpdate ||
    input.comparison.scale.x !== 1 ||
    input.comparison.scale.y !== 1 ||
    input.comparison.scale.z !== 1 ||
    source.scale.x !== 1 ||
    source.scale.y !== 1 ||
    source.scale.z !== 1 ||
    source.fov <= 0 ||
    source.fov >= 180 ||
    source.zoom <= 0 ||
    source.filmOffset !== 0 ||
    source.view?.enabled === true ||
    Math.abs(source.quaternion.lengthSq() - 1) > 64 * Number.EPSILON ||
    halfHeight <= 0 ||
    halfWidth <= 0 ||
    source.near <= 0 ||
    source.far <= source.near ||
    input.halfSeparation <= 0
  )
    throw new Error(
      "Comparison requires a finite standalone unit camera chart",
    );
  source.updateMatrixWorld(true);
  const comparison: THREE.OrthographicCamera = input.comparison;
  comparison.left = -halfWidth;
  comparison.right = halfWidth;
  comparison.top = halfHeight;
  comparison.bottom = -halfHeight;
  comparison.near = source.near;
  comparison.far = source.far;
  comparison.zoom = 1;
  if (comparison.view?.enabled) comparison.clearViewOffset();
  comparison.position.copy(source.position);
  comparison.quaternion.copy(source.quaternion);
  comparison.updateMatrixWorld(true);
  comparison.updateProjectionMatrix();
  // An overflowing projection or its inverse names no finite chart.
  if (
    [
      ...comparison.projectionMatrix.elements,
      ...comparison.projectionMatrixInverse.elements,
    ].some(
      (value: number): boolean => value === Infinity || value === -Infinity,
    ) ||
    comparison.projectionMatrix.determinant() === 0
  )
    throw new Error("Comparison projection exceeds native finite chart limits");
  input.offset
    .setFromMatrixColumn(source.matrixWorld, 0)
    .multiplyScalar(input.halfSeparation);
}

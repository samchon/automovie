import * as THREE from "three";

/**
 * Construct a native camera for a supplied horizontal metric pixel chart.
 * Pixel centres use column+0.5,row+0.5. Image U projects cos(a) X + sin(a) Z;
 * image V projects negative Y, with pitch in metres per pixel and principal
 * point in pixel-edge coordinates. No image distortion, pose estimation or
 * resizing is performed. Distance and near/far only select orthographic depth
 * admission; image scale is supplied independently by pitch. Native projection
 * and inverse matrices must remain finite and nonsingular at the supplied gauge.
 *
 * @evidence contracts/common.md#principled-implementation Native frustum bounds are calibrated pixel-edge limits in metres; right is (cos(a),0,sin(a)), up is +Y and position lies on their cross product. Native rotation about Y and updateProjectionMatrix preserve the supplied affine projection without a custom override or distance-dependent lookAt normalization.
 * @evidence contracts/common.md#clear-and-simple-design This generic viewer owner maps one explicit metric chart to native Three camera fields while inverse geometry fitting and image acquisition remain independent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No approximate perspective lens, guessed focal length, altered principal point, image resampling, source-dependent pose or native method replacement is used.
 * @evidence contracts/common.md#meaningful-documentation Gives pixel centres/edges, world/image signs, metre pitch, principal point, horizontal restriction and the separate role of orthographic depth limits.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of trigonometric, scalar and native matrix operations constructs one camera independent of image pixel population.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each explicit chart gets its own mutable caller-owned native camera rather than a shared stale projection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One CPU camera is returned without a renderer, GPU allocation, image buffer, listener, handle or global cache.
 */
export function createAutoMovieMetricOrthographicCamera(input: {
  width: number;
  height: number;
  pixelPitchMeters: number;
  principalPointPx: [number, number];
  azimuthRadians: number;
  distanceMeters: number;
  nearMeters: number;
  farMeters: number;
}): THREE.OrthographicCamera {
  if (
    !input ||
    !Number.isSafeInteger(input.width) ||
    input.width < 1 ||
    !Number.isSafeInteger(input.height) ||
    input.height < 1 ||
    !Number.isFinite(input.pixelPitchMeters) ||
    input.pixelPitchMeters <= 0 ||
    !Array.isArray(input.principalPointPx) ||
    input.principalPointPx.length !== 2 ||
    !Number.isFinite(input.principalPointPx[0]) ||
    !Number.isFinite(input.principalPointPx[1]) ||
    !Number.isFinite(input.azimuthRadians) ||
    !Number.isFinite(input.distanceMeters) ||
    input.distanceMeters <= 0 ||
    !Number.isFinite(input.nearMeters) ||
    !Number.isFinite(input.farMeters) ||
    input.nearMeters <= 0 ||
    input.farMeters <= input.nearMeters
  )
    throw new Error(
      "A finite horizontal metric pixel chart and positive ordered depth limits are required",
    );
  const left: number = -input.principalPointPx[0] * input.pixelPitchMeters;
  const right: number =
    (input.width - input.principalPointPx[0]) * input.pixelPitchMeters;
  const top: number = input.principalPointPx[1] * input.pixelPitchMeters;
  const bottom: number =
    (input.principalPointPx[1] - input.height) * input.pixelPitchMeters;
  if (
    ![left, right, top, bottom].every(Number.isFinite) ||
    !(left < right) ||
    !(bottom < top)
  )
    throw new Error(
      "Metric orthographic frustum exceeds finite representable chart limits",
    );
  const camera: THREE.OrthographicCamera = new THREE.OrthographicCamera(
    left,
    right,
    top,
    bottom,
    input.nearMeters,
    input.farMeters,
  );
  camera.position.set(
    -Math.sin(input.azimuthRadians) * input.distanceMeters,
    0,
    Math.cos(input.azimuthRadians) * input.distanceMeters,
  );
  camera.up.set(0, 1, 0);
  camera.rotation.y = -input.azimuthRadians;
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  if (
    !camera.projectionMatrix.elements.every(Number.isFinite) ||
    !camera.matrixWorld.elements.every(Number.isFinite) ||
    !camera.matrixWorldInverse.elements.every(Number.isFinite) ||
    !camera.projectionMatrixInverse.elements.every(Number.isFinite) ||
    camera.projectionMatrix.determinant() === 0
  )
    throw new Error(
      "Metric orthographic native projection or inverse is nonfinite or singular",
    );
  return camera;
}

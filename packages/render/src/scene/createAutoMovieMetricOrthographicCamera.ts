import * as THREE from "three";

/** The largest chart edge, distance or far plane in metres the camera admits; its native matrices stay finite. */
const MAX_CHART: number = 1e15;

/**
 * Construct a native camera for a supplied horizontal metric pixel chart. Pixel
 * centres use column+0.5,row+0.5. Image U projects cos(a) X + sin(a) Z; image V
 * projects negative Y, with pitch in metres per pixel and principal point in
 * pixel-edge coordinates. No image distortion, pose estimation or resizing is
 * performed. Distance and near/far only select orthographic depth admission;
 * image scale is supplied independently by pitch. Native projection and inverse
 * matrices must remain finite and nonsingular at the supplied gauge.
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
    input.width < 1 ||
    input.height < 1 ||
    input.pixelPitchMeters <= 0 ||
    input.distanceMeters <= 0 ||
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
    [left, right, top, bottom, input.distanceMeters, input.farMeters].some(
      (value: number): boolean => Math.abs(value) > MAX_CHART,
    ) ||
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
  if (camera.projectionMatrix.determinant() === 0)
    throw new Error(
      "Metric orthographic native projection or inverse is singular",
    );
  return camera;
}

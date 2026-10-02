/**
 * Where a point lands in the picture of an exact camera, by pinhole
 * arithmetic that uses nothing of the viewer's camera code. The camera stands
 * at `target + distance * (sin(yaw) cos(pitch), sin(pitch), cos(yaw) cos(pitch))`
 * (yaw from the front toward anatomical left, +X; pitch above the horizon),
 * looks at `target` with world up +Y, and has the vertical field `fov` in
 * degrees over a square picture of `size` pixels, y downward. Returns the
 * pixel, the distance along the view axis (`depth`, negative behind the camera)
 * and the pixel radius of a sphere of `radius` metres at that depth.
 *
 * @evidence contracts/common.md#principled-implementation A pinhole camera with a look-at basis; the sphere radius projects as radius over depth times the focal length in pixels, exact on the axis and first order off it.
 * @evidence contracts/common.md#clear-and-simple-design One pure projection is the independent reading convention for the calibration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No viewer, three.js or measured value is used.
 * @evidence contracts/common.md#meaningful-documentation States camera placement, axes, units and the sphere radius approximation.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the model frame, degrees for angles, pixels with a top-left origin and y downward.
 */
export function projectHumanViewerCalibration(
  camera: {
    yaw: number;
    pitch: number;
    distance: number;
    target: readonly [number, number, number];
    fov: number;
  },
  size: number,
  point: readonly [number, number, number],
  radius = 0,
): { x: number; y: number; depth: number; radiusPx: number } {
  const yaw = (camera.yaw * Math.PI) / 180;
  const pitch = (camera.pitch * Math.PI) / 180;
  const offset = [
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch),
  ];
  // The view axis points from the eye to the target, so the eye offset reversed.
  const forward = offset.map((value) => -value);
  const right = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const up = [
    right[1] * forward[2] - right[2] * forward[1],
    right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0],
  ];
  const eye = camera.target.map((value, axis) => value + camera.distance * offset[axis]);
  const delta = point.map((value, axis) => value - eye[axis]);
  const dot = (a: number[], b: number[]): number =>
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const depth = dot(delta, forward);
  const focal = size / 2 / Math.tan((camera.fov * Math.PI) / 360);
  return {
    x: size / 2 + (focal * dot(delta, right)) / depth,
    y: size / 2 - (focal * dot(delta, up)) / depth,
    depth,
    radiusPx: (focal * radius) / depth,
  };
}

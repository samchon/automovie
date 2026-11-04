import * as THREE from "three";

/** Fraction of the view a framed box leaves free at each side, the reference capture's margin. */
const MARGIN: number = 1.15;

/**
 * Place a camera so a box fills the view from a direction, the rule of the person captures.
 *
 * The camera looks at the box centre (or `target`) from azimuth a and elevation e, along the unit
 * offset (cos a cos e, sin e, sin a cos e). It is oriented at unit distance first, because the
 * corner test needs its view matrix; then each box corner p in camera space sets the distance
 * 1 + p.z + 1.15 |p.x| / (tan(fov / 2) aspect) and 1 + p.z + 1.15 |p.y| / tan(fov / 2), and the
 * largest wins, so every corner fits with a 15 percent margin. An orthographic camera takes its
 * half height from the same corners. Looking straight up or down (|e| over 89.9 degrees), screen up
 * is -Z, so a top view shows +X to the right and +Z downward.
 *
 * @param camera Perspective camera with its fov set, or orthographic camera.
 * @param azimuth Radians from +X toward +Z.
 * @param elevation Radians above the floor plane.
 * @param box Box to frame, metres.
 * @param aspect Drawing-buffer width over height.
 * @param target Look-at point replacing the box centre, metres.
 * @param distance Camera distance replacing the fitted one, metres.
 * @returns The placement facts in metres and radians.
 */
export function placeHumanDebugCamera(
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  azimuth: number,
  elevation: number,
  box: THREE.Box3,
  aspect: number,
  target: THREE.Vector3 | null,
  distance: number | null,
): Record<string, unknown> {
  const size: number = box.getSize(new THREE.Vector3()).length();
  const look: THREE.Vector3 = target?.clone() ?? box.getCenter(new THREE.Vector3());
  const offset: THREE.Vector3 = new THREE.Vector3(
    Math.cos(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.sin(azimuth) * Math.cos(elevation),
  );
  if (Math.abs(elevation) > THREE.MathUtils.degToRad(89.9)) camera.up.set(0, 0, -1);
  else camera.up.set(0, 1, 0);
  camera.position.copy(look).add(offset);
  camera.lookAt(look);
  camera.updateMatrixWorld();

  const corners: THREE.Vector3[] = [];
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z])
        corners.push(new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse));

  let fitted: number = 0;
  let half: number | null = null;
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.aspect = aspect;
    const tangent: number = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    for (const p of corners)
      fitted = Math.max(
        fitted,
        1 + p.z + (MARGIN * Math.abs(p.x)) / (tangent * aspect),
        1 + p.z + (MARGIN * Math.abs(p.y)) / tangent,
      );
  } else {
    // The same corners set the half extents; the camera only has to stand before the nearest one.
    half = 0;
    for (const p of corners) {
      half = Math.max(half, MARGIN * Math.abs(p.y), (MARGIN * Math.abs(p.x)) / aspect);
      fitted = Math.max(fitted, 1 + p.z);
    }
    fitted += size;
    camera.top = half;
    camera.bottom = -half;
    camera.left = -half * aspect;
    camera.right = half * aspect;
    camera.zoom = 1;
  }
  const placed: number = distance ?? fitted;
  camera.position.copy(look).addScaledVector(offset, placed);
  camera.near = Math.max(0.0001, placed / 1000);
  camera.far = placed + size * 4;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return {
    azimuth,
    elevation,
    projection: half === null ? "perspective" : "orthographic",
    position: camera.position.toArray(),
    target: look.toArray(),
    up: camera.up.toArray(),
    fov: camera instanceof THREE.PerspectiveCamera ? camera.fov : null,
    halfHeight: half,
    aspect,
    near: camera.near,
    far: camera.far,
    region: { min: box.min.toArray(), max: box.max.toArray() },
  };
}

import type * as THREE from "three";

import type { IHumanDebugOptions } from "../contracts/IHumanDebugOptions";

/**
 * Observe the actual orbit camera without fitting, moving or changing its zoom.
 *
 * URL fields retain the existing tenth-degree/tenth-mm convention. Placement keeps exact
 * position/target/near/far/halfHeight in metres, azimuth/elevation in radians, fov in degrees,
 * and dimensionless up/zoom/aspect, independently of the last fitted box. These are the existing receipt units.
 * A coincident target uses camera orientation for direction and leaves URL distance unset.
 *
 * @evidence contracts/common.md#principled-implementation Reads the real camera/target, deriving the existing orbit URL fields and exact placement facts; orthographic zoom and projection inputs are never assigned.
 * @evidence contracts/common.md#clear-and-simple-design One passive observer serves orbit commits and snapshots; placeHumanDebugCamera remains the separate framing owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Performs no refit, generated-shape measurement, camera substitution or claimed draw.
 * @evidence contracts/common.md#meaningful-documentation Separates rounded URL state, actual placement units and undefined target distance.
 * @evidence contracts/performance.md#efficient-algorithms Constant vector/scalar work, independent of scene/mesh size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The camera is mutable, so each observation reads its current values rather than caching them.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns fresh small records/arrays and owns no camera, event listener, renderer or retained state.
 */
export function HumanDebugCameraState(
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  target: THREE.Vector3,
): {
  options: Pick<IHumanDebugOptions, "az" | "el" | "dist" | "target">;
  placement: Record<string, unknown>;
} {
  const offset: THREE.Vector3 = camera.position.clone().sub(target);
  const distance: number = offset.length();
  if (distance === 0) offset.set(0, 0, 1).applyQuaternion(camera.quaternion);
  const azimuth: number = Math.atan2(offset.z, offset.x);
  const elevation: number = Math.asin(Math.max(-1, Math.min(1, offset.y / offset.length())));
  const round = (value: number): number => Math.round(value * 10) / 10;
  const perspective: boolean = "isPerspectiveCamera" in camera;
  return {
    options: {
      az: round(azimuth * 180 / Math.PI),
      el: round(elevation * 180 / Math.PI),
      dist: distance > 0 ? round(distance * 1000) : null,
      target: [round(target.x * 1000), round(target.y * 1000), round(target.z * 1000)],
    },
    placement: {
      azimuth, elevation, position: camera.position.toArray(), target: target.toArray(),
      up: camera.up.toArray(), near: camera.near, far: camera.far, zoom: camera.zoom,
      projection: perspective ? "perspective" : "orthographic",
      fov: "fov" in camera ? camera.fov : null,
      halfHeight: "top" in camera ? (camera.top - camera.bottom) / 2 : null,
      aspect: "aspect" in camera ? camera.aspect : (camera.right - camera.left) / (camera.top - camera.bottom),
    },
  };
}

/**
 * Camera actions shared by pointer-independent tour buttons and keyboard use.
 * Authored views supply their exact world eye, target and lens. Manual orbit
 * works around the current target; panning moves eye and target together in
 * camera-local axes. Zoom scales distance and clamps before the near plane.
 * No action changes geometry or production view records.
 */
import * as THREE from "three";

import type { TourView } from "./tourData";

export const applyTourView = (
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  view: TourView,
): void => {
  camera.position.set(...view.position);
  target.set(...view.target);
  camera.fov = view.fov;
  camera.near = view.near;
  camera.far = view.far;
  camera.lookAt(target);
  camera.updateProjectionMatrix();
};

export type CameraAction = "left" | "right" | "up" | "down" | "in" | "out";

export const moveTourCamera = (
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  action: CameraAction,
  pan = false,
): void => {
  const horizontal = action === "left" ? -1 : action === "right" ? 1 : 0;
  const vertical = action === "up" ? 1 : action === "down" ? -1 : 0;
  const offset = camera.position.clone().sub(target);
  if (action === "in" || action === "out") {
    const distance = THREE.MathUtils.clamp(
      offset.length() * (action === "in" ? 0.85 : 1.18),
      camera.near * 2,
      camera.far * 0.8,
    );
    if (offset.lengthSq() === 0) offset.set(0, 0, 1);
    camera.position.copy(target).add(offset.setLength(distance));
  } else if (pan) {
    const shift = new THREE.Vector3(horizontal, vertical, 0)
      .applyQuaternion(camera.quaternion)
      .multiplyScalar(Math.max(offset.length(), 1) * 0.05);
    camera.position.add(shift);
    target.add(shift);
  } else {
    const spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta += horizontal * 0.1;
    spherical.phi -= vertical * 0.1;
    spherical.makeSafe();
    camera.position
      .copy(target)
      .add(new THREE.Vector3().setFromSpherical(spherical));
  }
  camera.lookAt(target);
};

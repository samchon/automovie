/**
 * Applies the native author's exact world eye, target and lens when entering a
 * room or resetting. Spectator input adopts this pose without changing geometry
 * or the production view records.
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

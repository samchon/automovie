/**
 * Applies the native author's exact world eye, target and lens when entering a room or resetting. Spectator input adopts this pose without changing geometry or the production view records.
 */
import * as THREE from "three";

import type { TourView } from "./tourData";

/**
 * Apply an authored view's world eye, target and lens settings to the existing perspective camera. The first-party view must supply a usable perspective pose and lens; this mutation does not validate numeric ranges or record a completed GPU frame.
 *
 * @evidence contracts/common.md#principled-implementation Three's position, lookAt and projection APIs apply the source XYZ meters and lens degrees directly without converting them to orbit coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Camera mutation is shared by initial selection, room navigation and reset while scene geometry remains outside this owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fallback pose, test-specific offset or foreign camera method replacement substitutes for the authored view.
 * @evidence contracts/common.md#meaningful-documentation The comment states mutation ownership, producer numeric premises and the distinction between camera application and GPU observation.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of vector and perspective-matrix operations costs constant work and temporary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing camera and target objects are mutated in place; the source view remains borrowed and unchanged without a redundant camera clone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No renderer, listener or task is acquired; camera and target lifetimes remain with the mounting host.
 */
export const applyTourView: (
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  view: TourView,
) => void = (
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

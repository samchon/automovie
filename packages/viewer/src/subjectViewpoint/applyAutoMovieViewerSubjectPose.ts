import type * as THREE from "three";

import type { IAutoMovieViewerSubjectPose } from "./IAutoMovieViewerSubjectPose.js";

/**
 * Apply an admitted inspection pose to a borrowed perspective camera and update its projection and world matrix. World position is written as local position, requiring an unparented camera or identity parent transform; failure does not roll back earlier mutations.
 *
 * @evidence contracts/common.md#principled-implementation Copies position/lens/clips, sets world-up +Y, uses Three lookAt and updates projection/world matrices before population resolution; finite valid pose and compatible parent frame are caller premises.
 * @evidence contracts/common.md#clear-and-simple-design One native camera mutation boundary realizes the numerical pose; resolution and rendering remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses public Three methods without altering foreign implementations; it performs no range admission or parent-space conversion and promises no recovery from a partial setter failure.
 * @evidence contracts/common.md#meaningful-documentation States borrowed camera mutation, matrix timing, finite-pose premise and parent/failure limits.
 * @evidence contracts/performance.md#efficient-algorithms Fixed pose arithmetic and projection update precede updateMatrixWorld, whose descendant traversal scales with any camera child subtree.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call applies the requested effect to current camera state; no previous pose result substitutes for matrix updates.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires no renderer or buffer; the caller owns camera lifetime and keeps the applied state after return or downstream failure.
 */
export function applyAutoMovieViewerSubjectPose(
  camera: THREE.PerspectiveCamera,
  pose: IAutoMovieViewerSubjectPose,
): void {
  camera.position.set(pose.position.x, pose.position.y, pose.position.z);
  camera.fov = pose.lens.fovDeg;
  camera.aspect = pose.lens.aspect;
  camera.near = pose.near;
  camera.far = pose.far;
  camera.up.set(0, 1, 0);
  camera.lookAt(pose.target.x, pose.target.y, pose.target.z);
  camera.updateProjectionMatrix();
  // The populations resolve against a world matrix, and `lookAt` only writes
  // the local quaternion; a frame drawn before this reads last frame's eye.
  camera.updateMatrixWorld(true);
}

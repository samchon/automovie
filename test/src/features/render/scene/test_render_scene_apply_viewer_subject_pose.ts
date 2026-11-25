import { applyAutoMovieViewerSubjectPose } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/** Tolerance of the camera's look direction. */
const DIRECTION_TOLERANCE: number = 1e-9;

/**
 * `applyAutoMovieViewerSubjectPose` writes a pose onto a perspective camera.
 *
 * Scenarios:
 *
 * 1. A pose at (0, 0, 5) aimed at the origin sets the position, field of view,
 *    aspect and clip planes, and the camera's world direction is -Z at once.
 */
export function test_render_scene_apply_viewer_subject_pose(): void {
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  applyAutoMovieViewerSubjectPose(camera, {
    position: { x: 0, y: 0, z: 5 },
    target: { x: 0, y: 0, z: 0 },
    lens: { fovDeg: 40, aspect: 2 },
    near: 0.5,
    far: 80,
  });
  TestValidator.equals(
    "camera",
    [camera.position.toArray(), camera.fov, camera.aspect, camera.near, camera.far],
    [[0, 0, 5], 40, 2, 0.5, 80],
  );
  TestValidator.predicate(
    "direction",
    camera
      .getWorldDirection(new THREE.Vector3())
      .distanceTo(new THREE.Vector3(0, 0, -1)) < DIRECTION_TOLERANCE,
  );
}
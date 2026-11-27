import { AutoMovieRenderInspectionCamera } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/** Tolerance of the intrusion depth, metres. */
const DEPTH_TOLERANCE: number = 1e-6;

/**
 * `measureCameraNearClip` measures how far a subject's surface reaches
 * in front of the delivery near plane inside the frame.
 *
 * Scenarios:
 *
 * 1. A unit cube seen from 5 m, with the near plane at 0.1 m, is clear.
 * 2. The same camera 0.05 m from the cube's front face is clipped by
 *    0.1 - 0.05 = 0.05 m, the deepest point lying on that face.
 * 3. A budget of no triangles is over budget once triangles must be examined, as
 *    in the clipped camera; a negative budget and a refused
 *    subject are unmeasured.
 */
export function test_render_scene_measure_camera_near_clip(): void {
  const cube: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial(),
  );
  cube.updateMatrixWorld(true);
  const camera = (z: number): THREE.PerspectiveCamera => {
    const result: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    result.position.set(0, 0, z);
    result.updateMatrixWorld(true);
    return result;
  };
  TestValidator.equals(
    "clear",
    AutoMovieRenderInspectionCamera.measureNearClip({
      camera: camera(5),
      meshes: [cube],
      triangleBudget: 1000,
    }).status,
    "clear",
  );
  const clipped = AutoMovieRenderInspectionCamera.measureNearClip({
    camera: camera(0.55),
    meshes: [cube],
    triangleBudget: 1000,
  });
  TestValidator.predicate(
    "clipped",
    clipped.status === "clipped" &&
      Math.abs(clipped.depth - 0.05) < DEPTH_TOLERANCE &&
      Math.abs(clipped.point.z - 0.5) < DEPTH_TOLERANCE,
  );
  TestValidator.equals(
    "over budget",
    AutoMovieRenderInspectionCamera.measureNearClip({
      camera: camera(0.55),
      meshes: [cube],
      triangleBudget: 0,
    }).status,
    "over-budget",
  );
  TestValidator.equals(
    "negative budget",
    AutoMovieRenderInspectionCamera.measureNearClip({
      camera: camera(5),
      meshes: [cube],
      triangleBudget: -1,
    }).status,
    "unmeasured",
  );
  TestValidator.equals(
    "refused subject",
    AutoMovieRenderInspectionCamera.measureNearClip({
      camera: camera(5),
      meshes: undefined,
      triangleBudget: 1000,
    }).status,
    "unmeasured",
  );
}
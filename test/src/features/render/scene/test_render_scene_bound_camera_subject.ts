import { AutoMovieRenderInspectionCamera } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `boundCameraSubject` is the world box that holds every mesh.
 *
 * Scenarios:
 *
 * 1. A 2 m cube at (1, 0, 0) and another at (-3, 0, 0) are bounded by
 *    (-4, -1, -1) to (2, 1, 1).
 * 2. No mesh has no bound.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the bounds of two translated cubes and the empty-selection result.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public camera subject bounds operation with native Three.js cube meshes and an empty list. Reads the calculated world box endpoints.
 * @evidence contracts/development/testing.md#independent-expectations Each two-metre cube extends one metre from its center. Centers X 1 and −3 yield minimum X −4 and maximum X 2, with Y and Z from −1 to 1. No mesh supplies no bound.
 */
export function test_render_scene_bound_camera_subject(): void {
  const cube = (x: number): THREE.Mesh => {
    const mesh: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
    mesh.position.x = x;
    mesh.updateMatrixWorld();
    return mesh;
  };
  const box: THREE.Box3 | undefined = AutoMovieRenderInspectionCamera.boundSubject([
    cube(1),
    cube(-3),
  ]);
  TestValidator.equals("min", box?.min.toArray(), [-4, -1, -1]);
  TestValidator.equals("max", box?.max.toArray(), [2, 1, 1]);
  TestValidator.equals("empty", AutoMovieRenderInspectionCamera.boundSubject([]), undefined);
}
import { AutoMovieRenderInspectionCamera } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `AutoMovieRenderInspectionCamera.measureFrameEdge` measures where the sides of the delivered
 * frame cut a subject.
 *
 * Scenarios:
 *
 * 1. A unit cube at the origin, seen from 5 m through a 90 degree square lens,
 *    lies inside the frame, whose half-width at the cube is 5 m.
 * 2. The cube moved to x = 10, wholly beyond the right edge, crosses the right
 *    side only; the cube at x = 5, straddling it, does too.
 * 3. A subject refused by the mesh listing has no measurable bounds.
 */
export function test_render_scene_measure_camera_frame_edge(): void {
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(90, 1, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.updateMatrixWorld(true);
  const cube = (x: number): THREE.Mesh => {
    const mesh: THREE.Mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial(),
    );
    mesh.position.x = x;
    mesh.updateMatrixWorld(true);
    return mesh;
  };
  const measure = (x: number) =>
    AutoMovieRenderInspectionCamera.measureFrameEdge({
      camera,
      meshes: [cube(x)],
      triangleBudget: 1000,
    });
  TestValidator.equals("inside", measure(0).status, "inside");
  for (const x of [10, 5]) {
    const result = measure(x);
    TestValidator.equals(
      `crossed at ${x}`,
      result.status === "crossed"
        ? result.crossings.map((crossing): string => crossing.side)
        : null,
      ["right"],
    );
  }
  TestValidator.equals(
    "refused",
    AutoMovieRenderInspectionCamera.measureFrameEdge({
      camera,
      meshes: undefined,
      triangleBudget: 1000,
    }).status,
    "unmeasured",
  );
}
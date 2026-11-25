import { measureAutoMovieCameraFrameEdgeSurface } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `measureAutoMovieCameraFrameEdgeSurface` checks whether a drawn surface
 * beyond the near plane lies outside a side of the frame.
 *
 * Scenarios:
 *
 * 1. A unit cube at the origin seen from 5 m through a 90 degree square lens is
 *    clear, with its 12 triangles examined.
 * 2. The cube at x = 5, straddling the right edge, is cut, and part of it
 *    remains visible.
 * 3. A budget of no triangles is over budget for the cut cube.
 */
export function test_render_scene_measure_camera_frame_edge_surface(): void {
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(90, 1, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.updateMatrixWorld(true);
  const projection: THREE.Matrix4 = new THREE.Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  );
  const planes: THREE.Plane[] = new THREE.Frustum().setFromProjectionMatrix(projection)
    .planes;
  const measure = (x: number, triangleBudget: number) => {
    const cube: THREE.Mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial(),
    );
    cube.position.x = x;
    cube.updateMatrixWorld(true);
    return measureAutoMovieCameraFrameEdgeSurface({
      meshes: [cube],
      sides: planes.slice(0, 4),
      near: planes[5]!,
      projection,
      triangleBudget,
    });
  };
  const clear = measure(0, 1000);
  TestValidator.equals(
    "clear",
    clear.status === "clear" ? clear.triangles : null,
    12,
  );
  const cut = measure(5, 1000);
  TestValidator.predicate(
    "cut",
    cut.status === "cut" &&
      cut.fraction !== undefined &&
      cut.fraction > 0 &&
      cut.fraction < 1,
  );
  TestValidator.equals("over budget", measure(5, 0).status, "over-budget");
}
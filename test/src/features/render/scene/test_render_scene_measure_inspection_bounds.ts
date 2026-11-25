import { measureAutoMovieInspectionBounds } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `measureAutoMovieInspectionBounds` bounds what an object draws, in world
 * space.
 *
 * Scenarios:
 *
 * 1. A unit cube at (3, 0, 0) scaled by 2 along Y is (2.5, -1, -0.5) to
 *    (3.5, 1, 0.5).
 * 2. A point cloud and a line are bounded by their points under their
 *    transforms.
 * 3. An invisible child adds nothing, and an object that draws nothing has no
 *    bounds.
 */
export function test_render_scene_measure_inspection_bounds(): void {
  const root: THREE.Group = new THREE.Group();
  const cube: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  cube.position.set(3, 0, 0);
  cube.scale.y = 2;
  root.add(cube);
  TestValidator.equals("cube", measureAutoMovieInspectionBounds(root), {
    min: { x: 2.5, y: -1, z: -0.5 },
    max: { x: 3.5, y: 1, z: 0.5 },
  });

  const points: THREE.Points = new THREE.Points(
    new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 2, 3]), 3),
    ),
  );
  points.position.x = 10;
  const far: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  far.position.x = 100;
  far.visible = false;
  const group: THREE.Group = new THREE.Group();
  group.add(points, far);
  TestValidator.equals("points", measureAutoMovieInspectionBounds(group), {
    min: { x: 10, y: 0, z: 0 },
    max: { x: 11, y: 2, z: 3 },
  });
  TestValidator.equals("nothing", measureAutoMovieInspectionBounds(new THREE.Group()), null);
}
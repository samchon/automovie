import { AutoMovieRenderInspectionGeometry } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `AutoMovieRenderInspectionGeometry.measureBounds` bounds what an object draws, in world
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation The bounds cases describe transformed drawable geometry, invisibility, and a root that draws nothing.
 * @evidence contracts/development/testing.md#behavioral-verification Checks world bounds for a scaled cube and transformed point and line data, skipping the invisible child and returning no bounds for an empty group.
 * @evidence contracts/development/testing.md#independent-expectations Uses the unit cube's half extents after X translation and Y scaling and literal fixture points for the expected bounds.
 */
export function test_render_scene_measure_inspection_bounds(): void {
  const root: THREE.Group = new THREE.Group();
  const cube: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  cube.position.set(3, 0, 0);
  cube.scale.y = 2;
  root.add(cube);
  TestValidator.equals("cube", AutoMovieRenderInspectionGeometry.measureBounds(root), {
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
  TestValidator.equals("points", AutoMovieRenderInspectionGeometry.measureBounds(group), {
    min: { x: 10, y: 0, z: 0 },
    max: { x: 11, y: 2, z: 3 },
  });
  TestValidator.equals("nothing", AutoMovieRenderInspectionGeometry.measureBounds(new THREE.Group()), null);
}
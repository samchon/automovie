import { crossesAutoMovieFrustumPlane } from "@automovie/render/internal";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `crossesAutoMovieFrustumPlane` is true when a box reaches behind a plane.
 *
 * Scenarios:
 *
 * 1. For the unit box and the plane x + c = 0: c = -0.5 reaches behind it, and
 *    c = 0 (touching) and c = 0.5 (wholly in front) do not.
 * 2. A plane facing the other way, -x + 0.5 = 0, cuts the box.
 */
export function test_unit_render_scene_crosses_frustum_plane(): void {
  const box: THREE.Box3 = new THREE.Box3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1, 1, 1),
  );
  const plane = (x: number, constant: number): THREE.Plane =>
    new THREE.Plane(new THREE.Vector3(x, 0, 0), constant);
  TestValidator.equals("behind", crossesAutoMovieFrustumPlane(box, plane(1, -0.5)), true);
  TestValidator.equals("touching", crossesAutoMovieFrustumPlane(box, plane(1, 0)), false);
  TestValidator.equals("in front", crossesAutoMovieFrustumPlane(box, plane(1, 0.5)), false);
  TestValidator.equals("facing away", crossesAutoMovieFrustumPlane(box, plane(-1, 0.5)), true);
}
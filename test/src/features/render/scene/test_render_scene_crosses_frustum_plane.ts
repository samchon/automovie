import {
  crossesFrustumPlane
} from "../../../../../packages/render/src/scene/inspection/internal/crossesFrustumPlane";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `crossesFrustumPlane` is true when a box reaches behind a plane.
 *
 * Scenarios:
 *
 * 1. For the unit box and the plane x + c = 0: c = -0.5 reaches behind it, and
 *    c = 0 (touching) and c = 0.5 (wholly in front) do not.
 * 2. A plane facing the other way, -x + 0.5 = 0, cuts the box.
 */
export function test_render_scene_crosses_frustum_plane(): void {
  const box: THREE.Box3 = new THREE.Box3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1, 1, 1),
  );
  const plane = (x: number, constant: number): THREE.Plane =>
    new THREE.Plane(new THREE.Vector3(x, 0, 0), constant);
  TestValidator.equals("behind", crossesFrustumPlane(box, plane(1, -0.5)), true);
  TestValidator.equals("touching", crossesFrustumPlane(box, plane(1, 0)), false);
  TestValidator.equals("in front", crossesFrustumPlane(box, plane(1, 0.5)), false);
  TestValidator.equals("facing away", crossesFrustumPlane(box, plane(-1, 0.5)), true);
}
import { colliderCaseInside } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/** A corner of the unit cube. */
const corner = (x: number, y: number, z: number): THREE.Vector3 =>
  new THREE.Vector3(x, y, z);

/** The unit cube's twelve triangles, two per face. */
const CUBE: THREE.Triangle[] = (
  [
    [corner(0, 0, 0), corner(1, 0, 0), corner(1, 1, 0), corner(0, 1, 0)],
    [corner(0, 0, 1), corner(1, 0, 1), corner(1, 1, 1), corner(0, 1, 1)],
    [corner(0, 0, 0), corner(1, 0, 0), corner(1, 0, 1), corner(0, 0, 1)],
    [corner(0, 1, 0), corner(1, 1, 0), corner(1, 1, 1), corner(0, 1, 1)],
    [corner(0, 0, 0), corner(0, 1, 0), corner(0, 1, 1), corner(0, 0, 1)],
    [corner(1, 0, 0), corner(1, 1, 0), corner(1, 1, 1), corner(1, 0, 1)],
  ] satisfies THREE.Vector3[][]
).flatMap((q: THREE.Vector3[]): THREE.Triangle[] => [
  new THREE.Triangle(q[0]!, q[1]!, q[2]!),
  new THREE.Triangle(q[0]!, q[2]!, q[3]!),
]);

/**
 * `colliderCaseInside` tells a point inside a closed mesh by the parity of a
 * ray's crossings: odd inside, even outside (the Jordan curve theorem's parity
 * rule).
 *
 * Scenarios:
 *
 * 1. The unit cube's centre is inside; a point 1 m off its side is not.
 * 2. Nothing is inside an empty mesh.
 */
export function test_unit_motions_executable_collider_case_inside(): void {
  TestValidator.equals(
    "inside, outside and empty",
    [
      colliderCaseInside(new THREE.Vector3(0.5, 0.5, 0.5), CUBE),
      colliderCaseInside(new THREE.Vector3(2, 0.5, 0.5), CUBE),
      colliderCaseInside(new THREE.Vector3(0.5, 0.5, 0.5), []),
    ],
    [true, false, false],
  );
}

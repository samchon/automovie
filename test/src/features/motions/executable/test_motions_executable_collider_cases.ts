import {
  colliderCaseInside
} from "../../../../../packages/motions/src/executable/cases/internal/colliderCaseInside";
import {
  colliderCaseNearest
} from "../../../../../packages/motions/src/executable/cases/internal/colliderCaseNearest";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../../internal/nclose";

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
 * The collider captures' mesh queries: inside by the parity of a ray's
 * crossings (the Jordan curve theorem's rule), and the distance to the nearest
 * triangle.
 *
 * Scenarios:
 *
 * 1. The unit cube's centre is inside; a point 1 m off its side is not.
 * 2. A point 2 m along +X lies 1 m from the far corner of the right triangle with
 *    1 m legs along +X and +Y at the origin.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines mesh containment and point-to-nearest-triangle distance for capture fixtures.
 * @evidence contracts/development/testing.md#behavioral-verification Queries a unit cube at its center and beyond one face, and queries the explicit right triangle with an external point.
 * @evidence contracts/development/testing.md#independent-expectations Cube bounds independently distinguish inside and outside. The closest point on the unit triangle for (2, 0, 0) is its (1, 0, 0) corner, giving distance 1.
 */
export function test_motions_executable_collider_cases(): void {
  TestValidator.equals(
    "inside and outside",
    [
      colliderCaseInside(new THREE.Vector3(0.5, 0.5, 0.5), CUBE),
      colliderCaseInside(new THREE.Vector3(2, 0.5, 0.5), CUBE),
    ],
    [true, false],
  );
  TestValidator.predicate(
    "the nearest triangle",
    nclose(
      colliderCaseNearest(new THREE.Vector3(2, 0, 0), [
        new THREE.Triangle(
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, 1, 0),
        ),
      ]),
      1,
      1e-12,
    ),
  );
}

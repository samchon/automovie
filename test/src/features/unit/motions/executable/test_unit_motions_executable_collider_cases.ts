import {
  colliderCaseInside,
  colliderCaseNearest,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../../../internal/nclose";

/** The scenarios of `test_unit_motions_executable_collider_case_inside`. */
namespace ScenarioColliderCaseInside {
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
}

/** The scenarios of `test_unit_motions_executable_collider_case_nearest`. */
namespace ScenarioColliderCaseNearest {
  /**
   * `colliderCaseNearest` is a point's distance to the nearest of some triangles.
   *
   * The right triangle with legs 1 m along +X and +Y at the origin.
   *
   * Scenarios:
   *
   * 1. A point 1 m above its interior lies 1 m from it.
   * 2. A point 2 m along +X lies 1 m from its far corner.
   * 3. With no triangle the distance is infinite.
   */
  export function test_unit_motions_executable_collider_case_nearest(): void {
    const triangle: THREE.Triangle = new THREE.Triangle(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
    );
    TestValidator.predicate(
      "above, beyond, and none",
      nclose(
        colliderCaseNearest(new THREE.Vector3(0.2, 0.2, 1), [triangle]),
        1,
        1e-12,
      ) &&
        nclose(
          colliderCaseNearest(new THREE.Vector3(2, 0, 0), [triangle]),
          1,
          1e-12,
        ) &&
        colliderCaseNearest(new THREE.Vector3(0, 0, 0), []) === Infinity,
    );
  }
}

/**
 * The `collider_cases` family's own logic, one scenario group per namespace
 * above: each group's scenarios are documented on it.
 */
export function test_unit_motions_executable_collider_cases(): void {
  ScenarioColliderCaseInside.test_unit_motions_executable_collider_case_inside();
  ScenarioColliderCaseNearest.test_unit_motions_executable_collider_case_nearest();
}

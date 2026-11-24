import { colliderCaseNearest } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../../../internal/nclose";

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

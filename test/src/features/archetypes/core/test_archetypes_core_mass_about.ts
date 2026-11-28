import { AutoMovieArchetypeMass } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `AutoMovieArchetypeMass.about` is the moment of inertia about a line: n^T I n
 * about the centre of mass plus m times the squared distance from the centre to
 * the line (the parallel-axis term), whatever the length of the direction.
 *
 * Scenarios:
 *
 * 1. Mass 2 at the origin with principal moments (2, 3, 4): about the z axis
 *    through the origin it is 4, also for the direction (0, 0, 5).
 * 2. About the y direction through (1, 0, 0), the centre is 1 from the line:
 *    3 + 2 * 1^2 = 5.
 * 3. A zero direction is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines principal and displaced inertia axes, an equivalent scaled direction and zero-direction refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public inertia projection on a synthetic mass tensor with unit, scaled and displaced axes. A zero direction exercises invalid line admission.
 * @evidence contracts/development/testing.md#independent-expectations The Z principal moment is 4 for any nonzero Z direction. The Y moment through a point one metre away adds `2*1^2` to its central moment of 3.
 */
export function test_archetypes_core_mass_about(): void {
  const properties: AutoMovieArchetypeMass.IProperties = {
    mass: 2,
    centerOfMass: { x: 0, y: 0, z: 0 },
    inertia: { xx: 2, yy: 3, zz: 4, xy: 0, xz: 0, yz: 0 },
  };
  const origin = { x: 0, y: 0, z: 0 };
  TestValidator.predicate(
    "about z",
    nclose(
      AutoMovieArchetypeMass.about(properties, origin, { x: 0, y: 0, z: 1 }),
      4,
      1e-12,
    ),
  );
  TestValidator.predicate(
    "a longer direction",
    nclose(
      AutoMovieArchetypeMass.about(properties, origin, { x: 0, y: 0, z: 5 }),
      4,
      1e-12,
    ),
  );
  TestValidator.predicate(
    "the parallel axis",
    nclose(
      AutoMovieArchetypeMass.about(
        properties,
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ),
      5,
      1e-12,
    ),
  );
  TestValidator.error("a zero direction", (): unknown =>
    AutoMovieArchetypeMass.about(properties, origin, { x: 0, y: 0, z: 0 }),
  );
}

import { HumanObjectCord } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `HumanObjectCord.rest` lays a cord's particles at rest between its ends: a
 * vee of its rest length, sagging under gravity by `(L / 2) sqrt(1 − (d / L)²)`
 * at its middle, each side's links evenly along its arm.
 *
 * Scenarios:
 *
 * 1. A 1 m cord in four links between ends 0.6 m apart at 1 m up sags 0.4 m
 *    straight down to (0.3, 0.6, 0), the particles at the ends, the quarter
 *    points of each arm and the middle; each arm is half a metre, so the vee is
 *    the cord's length.
 * 2. Ends farther apart than the cord, or one end on the other, are refused.
 */
export function test_unit_motions_perform_object_cord_rest(): void {
  const rest: number[] = HumanObjectCord.rest(
    "cord",
    { from: { x: 0, y: 1, z: 0 }, to: { x: 0.6, y: 1, z: 0 } },
    1,
    4,
    { x: 0, y: -9.81, z: 0 },
  );
  const expected: number[] = [
    0, 1, 0, 0.15, 0.8, 0, 0.3, 0.6, 0, 0.45, 0.8, 0, 0.6, 1, 0,
  ];
  TestValidator.predicate(
    "the vee",
    rest.length === expected.length &&
      rest.every((v: number, i: number): boolean =>
        nclose(v, expected[i]!, 1e-12),
      ) &&
      nclose(Math.hypot(rest[6]! - rest[0]!, rest[7]! - rest[1]!), 0.5, 1e-12),
  );
  TestValidator.error("ends too far apart", () =>
    HumanObjectCord.rest(
      "cord",
      { from: { x: 0, y: 1, z: 0 }, to: { x: 2, y: 1, z: 0 } },
      1,
      4,
      { x: 0, y: -9.81, z: 0 },
    ),
  );
  TestValidator.error("one end on the other", () =>
    HumanObjectCord.rest(
      "cord",
      { from: { x: 0, y: 1, z: 0 }, to: { x: 0, y: 1, z: 0 } },
      1,
      4,
      { x: 0, y: -9.81, z: 0 },
    ),
  );
}

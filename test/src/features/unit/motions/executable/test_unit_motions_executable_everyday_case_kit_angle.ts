import { everydayCaseKit } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `everydayCaseKit.angle` is the angle between two directions in degrees,
 * whatever their lengths.
 *
 * Scenarios:
 *
 * 1. +X and +Y are 90 degrees apart, +X and its double 0, +X and -X 180.
 * 2. +X and (1, 1, 0) are 45 degrees apart.
 */
export function test_unit_motions_executable_everyday_case_kit_angle(): void {
  TestValidator.predicate(
    "right, none, straight and half-right",
    nclose(
      everydayCaseKit.angle({ x: 1, y: 0, z: 0 }, { x: 0, y: 3, z: 0 }),
      90,
      1e-9,
    ) &&
      nclose(
        everydayCaseKit.angle({ x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }),
        0,
        1e-9,
      ) &&
      nclose(
        everydayCaseKit.angle({ x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }),
        180,
        1e-9,
      ) &&
      nclose(
        everydayCaseKit.angle({ x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }),
        45,
        1e-9,
      ),
  );
}

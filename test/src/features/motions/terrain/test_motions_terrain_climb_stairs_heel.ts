import {
  climbStairsPrints
} from "../../../../../packages/motions/src/terrain/stairs/climbStairsPrints";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Sixteen rounding units cover the tread offsets at the largest expected span. */
const ROUNDING: number = 16 * Number.EPSILON * 1.5;

/**
 * Fit a footprint along the named tread while respecting its two margins.
 *
 * Scenarios:
 *
 * 1. On a 0.25 m tread a sole with 0.125 m length and 0.0625 m clearances just
 *    fits and centres in either direction.
 * 2. A 0.5 m sole overhangs the near edge going up and places its toe just over
 *    the far edge going down. The last landing accepts it beyond its near
 *    margin in either direction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines foot placement on a finite tread with exact two-margin fit and case-specific overhang.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the footprint helper for two approach directions and both regular and final landing cases.
 * @evidence contracts/development/testing.md#independent-expectations On a 0.25 m tread a 0.125 m sole plus twice 0.0625 m clearance fits exactly at center. An oversized sole chooses the respective edge and can extend on the last landing.
 */
export function test_motions_terrain_climb_stairs_heel(): void {
  const flight: climbStairsPrints.IRun = { first: 0.5, count: 3, tread: 0.25 };
  const margin: number = 0.0625;
  TestValidator.predicate(
    "centre within both margins including equality",
    nclose(
      climbStairsPrints.heelOnTread(flight, 2, 0.125, margin, 1),
      0.8125,
      ROUNDING,
    ) &&
      nclose(
        climbStairsPrints.heelOnTread(flight, 2, 0.125, margin, -1),
        0.8125,
        ROUNDING,
      ),
  );
  TestValidator.predicate(
    "use the appropriate nosing or the opening of the last landing",
    nclose(
      climbStairsPrints.heelOnTread(flight, 2, 0.5, margin, 1),
      0.6875,
      ROUNDING,
    ) &&
      nclose(
        climbStairsPrints.heelOnTread(flight, 2, 0.5, margin, -1),
        0.5625,
        ROUNDING,
      ) &&
      nclose(
        climbStairsPrints.heelOnTread(flight, 3, 0.5, margin, -1),
        1.0625,
        ROUNDING,
      ),
  );
}

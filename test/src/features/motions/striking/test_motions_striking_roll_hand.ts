import {
  StrikingRollHand
} from "../../../../../packages/motions/src/striking/internal/StrikingRollHand";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * The hand frames a strike's roll searches (`StrikingRollHand.aside`, `run`,
 * `grid`): a perpendicular to the tool's axis, the run tilted about it and
 * turned about the axis, and the grid of tilts every 10 degrees within the
 * cone, turned every 45 and rolled every 30, the untilted run only rolled.
 *
 * Scenarios:
 *
 * 1. Across +Z from the vertical is -X; across +Y, from +Z, is +X.
 * 2. Along +Z with -X across, a 90 degree tilt runs along +Y, and turned 90 about
 *    the axis along -X; untilted it stays along +Z.
 * 3. A cone of none searches 12 rolls; 15 degrees adds one tilt of 96; 20 adds
 *    two, 204 in all, each a [tilt, around, turn] in range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines perpendicular frame construction, tilted orientation and discrete grid counts within the cone.
 * @evidence contracts/development/testing.md#behavioral-verification Calls axis and orientation helpers for vertical and horizontal tools and enumerates cones of zero, 15 and 20 degrees.
 * @evidence contracts/development/testing.md#independent-expectations A 30-degree roll increment gives 12 base samples. Each nonzero tilt adds eight azimuths times 12 rolls, giving 204 total at two tilts.
 */
export function test_motions_striking_roll_hand(): void {
  const z = { x: 0, y: 0, z: 1 };
  const aside = StrikingRollHand.aside(z);
  TestValidator.predicate(
    "across",
    vclose(aside, { x: -1, y: 0, z: 0 }, 1e-12) &&
      vclose(
        StrikingRollHand.aside({ x: 0, y: 1, z: 0 }),
        { x: 1, y: 0, z: 0 },
        1e-12,
      ),
  );
  TestValidator.predicate(
    "the run",
    vclose(
      StrikingRollHand.run(z, aside, 90, 0),
      { x: 0, y: 1, z: 0 },
      1e-12,
    ) &&
      vclose(
        StrikingRollHand.run(z, aside, 90, 90),
        { x: -1, y: 0, z: 0 },
        1e-12,
      ) &&
      vclose(StrikingRollHand.run(z, aside, 0, 135), z, 1e-12),
  );
  const wide: number[][] = StrikingRollHand.grid(20);
  TestValidator.predicate(
    "the grid",
    StrikingRollHand.grid(0).length === 12 &&
      StrikingRollHand.grid(15).length === 108 &&
      wide.length === 204 &&
      wide.every(
        ([tilt, around, turn]) =>
          tilt! <= 20 &&
          around! < 360 &&
          turn! < 360 &&
          (tilt! > 0 || around === 0),
      ),
  );
}

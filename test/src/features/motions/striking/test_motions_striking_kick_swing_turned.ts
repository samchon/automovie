import { KickSwingTurned } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * The kick's swung offset (`KickSwingTurned`): the direction turns on the great
 * circle from one offset to the other while the length runs linearly, about a
 * perpendicular when the two point opposite ways, and linearly when one is
 * zero.
 *
 * Scenarios:
 *
 * 1. From (1, 0, 0) to (0, 0, 2), the ends are the offsets and halfway is 1.5 m
 *    along the bisector, 1.5 / sqrt 2 on x and z.
 * 2. From (1, 0, 0) to (-1, 0, 0), halfway turns about +Z to (0, 1, 0).
 * 3. From zero to (0, 0, 2), halfway is the linear (0, 0, 1).
 */
export function test_motions_striking_kick_swing_turned(): void {
  const r: number = 1.5 / Math.SQRT2;
  TestValidator.predicate(
    "the great circle",
    vclose(
      KickSwingTurned({ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 2 }, 0),
      { x: 1, y: 0, z: 0 },
      1e-12,
    ) &&
      vclose(
        KickSwingTurned({ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 2 }, 1),
        { x: 0, y: 0, z: 2 },
        1e-12,
      ) &&
      vclose(
        KickSwingTurned({ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 2 }, 0.5),
        { x: r, y: 0, z: r },
        1e-12,
      ),
  );
  TestValidator.predicate(
    "opposite and zero",
    vclose(
      KickSwingTurned({ x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, 0.5),
      { x: 0, y: 1, z: 0 },
      1e-9,
    ) &&
      vclose(
        KickSwingTurned({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 2 }, 0.5),
        { x: 0, y: 0, z: 1 },
        1e-12,
      ),
  );
}

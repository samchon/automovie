import type { IAutoMovieMotionHumanKickboxingRing } from "@automovie/interface";
import { KnockdownCount } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `KnockdownCount.corner` sends the standing fighter to the neutral corner
 * farther from the fallen one (GLORY Rules 5.05.B.2): neutral A at the ring's
 * `(+h, -h)`, neutral B at `(-h, +h)`.
 *
 * A 6 m ring at the origin, unturned.
 *
 * Scenarios:
 *
 * 1. A fighter fallen near neutral A sends the other to neutral B, a margin inside
 *    the ropes.
 * 2. One fallen near neutral B sends the other to neutral A.
 */
export function test_unit_motions_sport_knockdown_count_corner(): void {
  const ring: IAutoMovieMotionHumanKickboxingRing.IRing = {
    centre: { x: 0, y: 0, z: 0 },
    size: 6,
    yaw: 0,
  };
  TestValidator.predicate(
    "the farther neutral corner",
    vclose(
      KnockdownCount.corner(ring, { x: 2, y: 0, z: -2 }, 0.5),
      { x: -2.5, y: 0, z: 2.5 },
      1e-12,
    ) &&
      vclose(
        KnockdownCount.corner(ring, { x: -2, y: 0, z: 2 }),
        { x: 3, y: 0, z: -3 },
        1e-12,
      ),
  );
}

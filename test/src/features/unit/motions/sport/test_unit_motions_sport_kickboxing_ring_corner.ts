import type {
  IAutoMovieMotionHumanKickboxingRing,
  IAutoMovieVector3,
} from "@automovie/interface";
import { KickboxingRing } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `KickboxingRing.corner` is a corner's floor point a margin inside the ropes
 * along both sides: in the ring's own frame blue at `(+h, +h)`, red at `(-h,
 * -h)`, neutral A at `(+h, -h)` and neutral B at `(-h, +h)`, `h` half the size
 * less the margin, turned by the ring's heading about +Y.
 *
 * A 6 m ring centred at (1, 0.5, 2).
 *
 * Scenarios:
 *
 * 1. Unturned, the corners are 3 m out on both axes from the centre, at its
 *    height.
 * 2. With a 0.5 m margin they come 2.5 m out.
 * 3. Turned 90 degrees, the blue corner's `(+3, +3)` goes to `(+3, -3)`.
 */
export function test_unit_motions_sport_kickboxing_ring_corner(): void {
  const ring: IAutoMovieMotionHumanKickboxingRing.IRing = {
    centre: { x: 1, y: 0.5, z: 2 },
    size: 6,
    yaw: 0,
  };
  const at = (x: number, z: number): IAutoMovieVector3 => ({
    x: 1 + x,
    y: 0.5,
    z: 2 + z,
  });
  TestValidator.predicate(
    "the four corners",
    vclose(KickboxingRing.corner(ring, "blue"), at(3, 3), 1e-12) &&
      vclose(KickboxingRing.corner(ring, "red"), at(-3, -3), 1e-12) &&
      vclose(KickboxingRing.corner(ring, "neutralA"), at(3, -3), 1e-12) &&
      vclose(KickboxingRing.corner(ring, "neutralB"), at(-3, 3), 1e-12),
  );
  TestValidator.predicate(
    "a margin inside the ropes",
    vclose(KickboxingRing.corner(ring, "blue", 0.5), at(2.5, 2.5), 1e-12),
  );
  TestValidator.predicate(
    "turned with the ring",
    vclose(
      KickboxingRing.corner({ ...ring, yaw: 90 }, "blue"),
      at(3, -3),
      1e-12,
    ),
  );
}

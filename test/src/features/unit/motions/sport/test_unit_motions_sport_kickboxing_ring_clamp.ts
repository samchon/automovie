import type { IAutoMovieMotionHumanKickboxingRing } from "@automovie/interface";
import { KickboxingRing } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/**
 * `KickboxingRing.clamp` is the nearest floor point at least a margin inside
 * the ropes: each ring-frame coordinate clamped to the half size less the
 * margin, at the ring's floor height.
 *
 * A 6 m ring centred at (0, 0.4, 0), unturned.
 *
 * Scenarios:
 *
 * 1. A point inside stays, dropped to the floor's height.
 * 2. A point 5 m out along +X and 1 m along +Z comes to 2.5 m along +X with a 0.5
 *    m margin, keeping its +Z.
 * 3. A margin of half the size or more is a caller's defect and throws.
 */
export function test_unit_motions_sport_kickboxing_ring_clamp(): void {
  const ring: IAutoMovieMotionHumanKickboxingRing.IRing = {
    centre: { x: 0, y: 0.4, z: 0 },
    size: 6,
    yaw: 0,
  };
  TestValidator.predicate(
    "inside, and clamped",
    vclose(
      KickboxingRing.clamp(ring, { x: 1, y: 2, z: -1 }),
      { x: 1, y: 0.4, z: -1 },
      1e-12,
    ) &&
      vclose(
        KickboxingRing.clamp(ring, { x: 5, y: 0, z: 1 }, 0.5),
        { x: 2.5, y: 0.4, z: 1 },
        1e-12,
      ),
  );
  TestValidator.predicate(
    "no room left",
    throwsError(() => KickboxingRing.clamp(ring, { x: 0, y: 0, z: 0 }, 3.5)),
  );
}

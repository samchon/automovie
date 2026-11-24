import type { IAutoMovieMotionHumanKickboxingRing } from "@automovie/interface";
import { KickboxingRing } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `KickboxingRing.inside` tells whether a floor point lies at least a margin
 * inside the ropes of a square ring, in the ring's own frame.
 *
 * A 6 m ring centred at the origin, turned 45 degrees.
 *
 * Scenarios:
 *
 * 1. The centre is inside; a point 2.9 m along the ring's own x is inside.
 * 2. The same point is not 0.5 m inside the ropes.
 * 3. A world point 3.5 m along +X lies `3.5 / sqrt(2)` m along each ring axis:
 *    inside; one 4.5 m along +X is out.
 */
export function test_unit_motions_sport_kickboxing_ring_inside(): void {
  const ring: IAutoMovieMotionHumanKickboxingRing.IRing = {
    centre: { x: 0, y: 0, z: 0 },
    size: 6,
    yaw: 45,
  };
  const r: number = Math.PI / 4;
  const along = (d: number): { x: number; y: number; z: number } => ({
    x: d * Math.cos(r),
    y: 0,
    z: -d * Math.sin(r),
  });
  TestValidator.equals(
    "inside, short of the margin, and turned",
    [
      KickboxingRing.inside(ring, { x: 0, y: 0, z: 0 }),
      KickboxingRing.inside(ring, along(2.9)),
      KickboxingRing.inside(ring, along(2.9), 0.5),
      KickboxingRing.inside(ring, { x: 3.5, y: 0, z: 0 }),
      KickboxingRing.inside(ring, { x: 4.5, y: 0, z: 0 }),
    ],
    [true, true, false, true, false],
  );
}

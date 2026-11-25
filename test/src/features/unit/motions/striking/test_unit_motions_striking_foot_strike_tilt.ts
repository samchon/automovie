import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { FootStrikeTilt, KickForm } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/**
 * A kicking leg against the hip's range (`FootStrikeTilt.excess`, `knee`): a
 * straight leg level ahead rises 90 degrees against the share of the hip's
 * flexion, as the elliptical reach reads straight ahead; a leg straight down
 * has no level direction; a knee hint twisted past the share of the hip's twist
 * is turned back to it about the leg.
 *
 * Scenarios:
 *
 * 1. A right leg reaching 0.9 m level ahead with 0.45 m segments exceeds by `90
 *
 *    - 0.9 F`, F the hip's greatest flexion, along +Z; one reaching straight down
 *         has none.
 * 2. A hip over the ankle with the knee hinted ahead keeps the hint; hinted to the
 *    side, a quarter twist, it is turned back to the twist limit `L`: at `(0.3
 *    sin L, 0.5, 0.3 cos L)`, or kept when the quarter lies within it.
 */
export function test_unit_motions_striking_foot_strike_tilt(): void {
  const hip: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const flexion: number = DEFAULT_HUMANOID_ROM.rightUpperLeg!.flexion!.max;
  const ahead = FootStrikeTilt.excess(
    "right",
    0,
    hip,
    { x: 0, y: 1, z: 0.9 },
    0.45,
    0.45,
  );
  TestValidator.predicate(
    "level ahead",
    KickForm.RANGE_SHARE === 0.9 &&
      ahead !== undefined &&
      nclose(ahead.degrees, 90 - 0.9 * flexion, 1e-9) &&
      nclose(ahead.elevation, 90, 1e-9) &&
      vclose(ahead.across, { x: 0, y: 0, z: 1 }, 1e-12) &&
      FootStrikeTilt.excess(
        "right",
        0,
        hip,
        { x: 0, y: 0.1, z: 0 },
        0.45,
        0.45,
      ) === undefined,
  );
  const still = { x: 0, y: 0, z: 0, w: 1 };
  const ankle: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const twist = DEFAULT_HUMANOID_ROM.rightUpperLeg!.twist!;
  const limit: number =
    KickForm.RANGE_SHARE * Math.min(Math.abs(twist.min), Math.abs(twist.max));
  const l: number = (limit * Math.PI) / 180;
  const aside: IAutoMovieVector3 = { x: 0.3, y: 0.5, z: 0 };
  TestValidator.predicate(
    "the knee's twist",
    vclose(
      FootStrikeTilt.knee("right", still, hip, ankle, { x: 0, y: 0.5, z: 0.3 }),
      { x: 0, y: 0.5, z: 0.3 },
      1e-12,
    ) &&
      vclose(
        FootStrikeTilt.knee("right", still, hip, ankle, aside),
        limit >= 90
          ? aside
          : { x: 0.3 * Math.sin(l), y: 0.5, z: 0.3 * Math.cos(l) },
        1e-9,
      ),
  );
}

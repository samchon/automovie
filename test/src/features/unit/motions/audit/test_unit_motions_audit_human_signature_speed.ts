import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { resolvedBones } from "../../../internal/resolvedBones";

/** Rounding of a central difference over 1/120 s, metres per second. */
const ROUNDING: number = 1e-9;

/**
 * `HumanSignature.speed` reads a joint centre's peak speed over a window by
 * central differences on the 240 Hz series from the window's start.
 *
 * Scenarios over a 2 s motion:
 *
 * 1. A hand moving at 1.5 m/s along +X peaks at 1.5 m/s.
 * 2. A hand at `0.5 t^2` along +Y peaks over 0.5 to 1 s at the window's end, `1
 *    m/s` within the series' spacing, where a central difference of a quadratic
 *    is exact.
 * 3. A still hand peaks at 0.
 */
export function test_unit_motions_audit_human_signature_speed(): void {
  const peak = (
    path: (t: number) => IAutoMovieVector3,
    from: number,
    to: number,
  ): number =>
    HumanSignature.speed(
      {
        motion: {
          duration: 2,
          bones: (_subject: string, t: number) =>
            resolvedBones([["leftHand", path(t)]]),
        },
        subject: "a",
      },
      "leftHand",
      from,
      to,
    );
  TestValidator.predicate(
    "steady",
    nclose(
      peak((t: number) => ({ x: 1.5 * t, y: 1, z: 0 }), 0, 2),
      1.5,
      ROUNDING,
    ),
  );
  const accelerating: number = peak(
    (t: number) => ({ x: 0, y: 0.5 * t * t, z: 0 }),
    0.5,
    1,
  );
  TestValidator.predicate(
    "accelerating",
    accelerating <= 1 + ROUNDING && accelerating >= 1 - 1 / 240,
  );
  TestValidator.equals(
    "still",
    peak(() => ({ x: 0, y: 1, z: 0 }), 0, 2),
    0,
  );
}

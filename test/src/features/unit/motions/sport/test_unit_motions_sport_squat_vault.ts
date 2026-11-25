import { AutoMovieGravity } from "@automovie/engine";
import { squatVault } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * The `squatVault` law's flight (`squatVault.arc`): the least-speed ballistic
 * arc rising `h` over a run `d`, its speed squared `g (h + sqrt(h² + d²))` and
 * its angle's tangent `(h + sqrt(h² + d²)) / d`.
 *
 * Scenarios:
 *
 * 1. Level over 2 m: launched at `sqrt(2 g)` and 45 degrees, rising at `sqrt(g)`,
 *    flying `2 / sqrt(g)`, the time the rise takes to come back down.
 * 2. Rising 1.5 m over 2 m: the lift is 1.5 + 2.5 = 4 m.
 */
export function test_unit_motions_sport_squat_vault(): void {
  const g: number = AutoMovieGravity.STANDARD;
  const level: squatVault.IArc = squatVault.arc(0, 2);
  TestValidator.predicate(
    "the level arc",
    nclose(level.launch, Math.sqrt(2 * g), 1e-12) &&
      nclose(level.angle, Math.PI / 4, 1e-12) &&
      nclose(level.rise, Math.sqrt(g), 1e-12) &&
      nclose(level.flight, 2 / Math.sqrt(g), 1e-12) &&
      nclose(level.flight, (2 * level.rise) / g, 1e-12),
  );
  TestValidator.predicate(
    "a rising arc",
    nclose(squatVault.arc(1.5, 2).lift, 4, 1e-12),
  );
}

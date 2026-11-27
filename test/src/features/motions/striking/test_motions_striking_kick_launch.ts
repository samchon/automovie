import {
  KickForm
} from "../../../../../packages/motions/src/striking/internal/KickForm";
import {
  KickLaunch
} from "../../../../../packages/motions/src/striking/internal/KickLaunch";
import { TestValidator } from "@nestia/e2e";

/**
 * A kick's height band (`KickLaunch.band`): low below 0.85 of the waist's
 * height, middle below 1.02 of the shoulder's, high above.
 *
 * Scenario: for a waist at 1 m and shoulders at 1.4 m, a point at 0.8 m is low,
 * at 0.85 m and 1.4 m middle, at 1.428 m and above high.
 */
export function test_motions_striking_kick_launch(): void {
  const m = { waistHeight: 1, shoulderHeight: 1.4 };
  const at = (y: number) => KickLaunch.band(m, { x: 0, y, z: 0 });
  TestValidator.equals(
    "the bands",
    [
      KickForm.BAND.low,
      KickForm.BAND.middle,
      at(0.8),
      at(0.85),
      at(1.4),
      at(1.428),
      at(1.6),
    ],
    [0.85, 1.02, "low", "middle", "middle", "high", "high"],
  );
}

import { closeStrike } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The `closeStrike` law's drive and turn (`closeStrike.drive`, `turn`): out to
 * the reach over the time to the shown instant and back over the recoil, a
 * feint only its share of the way, a headbutt waiting half the way out before
 * it drives; the trunk turns the technique's degrees, fully toward the lead
 * from the rear side, 0.8 of them back from the lead side, a headbutt facing
 * the target the short way round.
 *
 * Scenarios:
 *
 * 1. Shown at 0.4 s, recoiling 0.4 s, the drive is half at 0.2 s, whole at 0.4 s
 *    and half back at 0.6 s; a 0.5 feint reaches 0.5; a headbutt has not moved
 *    at 0.2 s and is half out at 0.3 s.
 * 2. With the right rear, a right horizontal elbow turns 50 degrees, a left one
 *    -40; with the left rear the right one turns 40; a headbutt at a target 270
 *    degrees round turns -90.
 */
export function test_motions_striking_close_strike(): void {
  TestValidator.predicate(
    "the drive",
    closeStrike.TAKE === 0.5 &&
      nclose(closeStrike.drive(0.2, 0.4, 0.4, 1, false), 0.5, 1e-12) &&
      nclose(closeStrike.drive(0.4, 0.4, 0.4, 1, false), 1, 1e-12) &&
      nclose(closeStrike.drive(0.6, 0.4, 0.4, 1, false), 0.5, 1e-12) &&
      nclose(closeStrike.drive(0.4, 0.4, 0.4, 0.5, false), 0.5, 1e-12) &&
      nclose(closeStrike.drive(0.2, 0.4, 0.4, 1, true), 0, 1e-12) &&
      nclose(closeStrike.drive(0.3, 0.4, 0.4, 1, true), 0.5, 1e-12),
  );
  TestValidator.predicate(
    "the turn",
    closeStrike.TURN.horizontalElbow === 50 &&
      nclose(
        closeStrike.turn("horizontalElbow", "right", "right", 0),
        50,
        1e-12,
      ) &&
      nclose(
        closeStrike.turn("horizontalElbow", "left", "right", 0),
        -40,
        1e-12,
      ) &&
      nclose(
        closeStrike.turn("horizontalElbow", "right", "left", 0),
        40,
        1e-12,
      ) &&
      nclose(closeStrike.turn("headbutt", "right", "right", 270), -90, 1e-12),
  );
}

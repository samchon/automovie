import { StrikingStroke, punchGeometry } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * A punch's phases (`punchGeometry.phases`, `returned`): out to the shown
 * reach, back over the recoil, the guard sagging with the recoil and rising
 * over the drop, all on minimum-jerk shares; and a punch stopped at its contact
 * running its stroke back after the dwell over the rest of the punch.
 *
 * Scenarios:
 *
 * 1. Shown at 0.4 s, recoiling 0.4 s, dropping 0.2 s: half out at 0.2 s, half back
 *    at 0.6 s, the sag half in at 0.6 s, half out again at 0.9 s and gone at
 *    1.2 s; without a drop there is no sag.
 * 2. Stopped at 0.3 s of 1.315 s, the 15 ms dwell holds the stop; half the rest
 *    on, at 0.815 s, it has returned half and shows the stroke at 0.15 s.
 */
export function test_unit_motions_striking_punch_geometry(): void {
  const { out, back, sag } = punchGeometry.phases(0.4, 0.4, 0.2);
  TestValidator.predicate(
    "the phases",
    nclose(out(0.2), 0.5, 1e-12) &&
      nclose(back(0.6), 0.5, 1e-12) &&
      nclose(sag(0.6), 0.5, 1e-12) &&
      nclose(sag(0.9), 0.5, 1e-12) &&
      nclose(sag(1.2), 0, 1e-12) &&
      punchGeometry.phases(0.4, 0.4, 0).sag(0.6) === 0,
  );
  TestValidator.predicate(
    "the return",
    StrikingStroke.DWELL === 0.015 &&
      nclose(punchGeometry.returned(0.31, 0.3, 1.315).clock, 0.3, 1e-12) &&
      nclose(punchGeometry.returned(0.815, 0.3, 1.315).w, 0.5, 1e-12) &&
      nclose(punchGeometry.returned(0.815, 0.3, 1.315).clock, 0.15, 1e-12),
  );
}

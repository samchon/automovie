import {
  MartialArtStanceForms,
  martialArtStanceTurn,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `martialArtStanceTurn` turns the pelvis away from the lead by the form's
 * opening offset as it opens and its further turn over the back transfer.
 *
 * Scenarios:
 *
 * 1. Taekwondo's bladed reset, opened, heads -2 degrees before the back transfer
 *    and -18 after it for a left lead, +18 for a right lead.
 * 2. Muay Thai's square reset stays within its 2 degree opening.
 * 3. A form not yet opened has not turned.
 */
export function test_unit_motions_sport_martial_art_stance_turn(): void {
  const taekwondo = MartialArtStanceForms.FORM.taekwondoStanceReset;
  const muayThai = MartialArtStanceForms.FORM.muayThaiStanceReset;
  TestValidator.equals(
    "the bladed turn",
    [
      martialArtStanceTurn(taekwondo, "left", 1, 0),
      martialArtStanceTurn(taekwondo, "left", 1, 1),
      martialArtStanceTurn(taekwondo, "right", 1, 1),
    ],
    [-2, -18, 18],
  );
  TestValidator.equals(
    "the square stance and the closed form",
    [
      martialArtStanceTurn(muayThai, "left", 1, 1),
      martialArtStanceTurn(taekwondo, "left", 0, 1),
    ],
    [-2, 0],
  );
}

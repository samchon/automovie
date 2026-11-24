import { handToFaceDrinkable } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `handToFaceDrinkable` holds where the held thing's use is to be drunk at the
 * region touched: a use at the mouth drinks at the mouth, a use at a named
 * region drinks there, and no use, no place or a use ahead drinks nowhere.
 *
 * Scenarios:
 *
 * 1. A cup used at the mouth drinks at the mouth and not at the chin; a use at the
 *    chin drinks at the chin; no use, a use with no place and a use ahead drink
 *    nowhere.
 */
export function test_unit_motions_daily_hand_to_face_drinkable(): void {
  TestValidator.equals(
    "drinkable",
    [
      handToFaceDrinkable(
        { line: "forearm", tip: "rim", at: "mouth" },
        "mouth",
      ),
      handToFaceDrinkable({ line: "forearm", tip: "rim", at: "mouth" }, "chin"),
      handToFaceDrinkable(
        { line: "forearm", tip: "rim", at: { region: "chin" } },
        "chin",
      ),
      handToFaceDrinkable(undefined, "mouth"),
      handToFaceDrinkable({ line: "forearm", tip: "rim" }, "mouth"),
      handToFaceDrinkable(
        { line: "forearm", tip: "rim", at: "ahead" },
        "mouth",
      ),
    ],
    [true, false, true, false, false, false],
  );
}

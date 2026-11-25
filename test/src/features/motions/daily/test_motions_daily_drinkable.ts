import type { IAutoMovieMotionHumanGraspUse } from "@automovie/interface";
import { handToFaceDrinkable } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * Pin the drink's admission of a grip prepared for the mouth.
 *
 * Scenarios:
 * 1. The shorthand mouth and its explicit region admit a lip use, while that
 *    same grip is not a use at the forehead.
 * 2. A grip with no use, a tip with no destination and a reach-ahead use
 *    provide no drinking admission.
 */
export function test_motions_daily_drinkable(): void {
  const lip: IAutoMovieMotionHumanGraspUse.IUse = {
    tip: "lip",
    line: "square",
  };
  TestValidator.predicate(
    "the grip's named use must be at the drink's actual region",
    handToFaceDrinkable({ ...lip, at: "mouth" }, "mouth") &&
      handToFaceDrinkable({ ...lip, at: { region: "mouth" } }, "mouth") &&
      !handToFaceDrinkable({ ...lip, at: "mouth" }, "forehead") &&
      !handToFaceDrinkable({ ...lip, at: { region: "forehead" } }, "mouth"),
  );
  TestValidator.predicate(
    "a grip chosen for reach has no drinking use",
    !handToFaceDrinkable(undefined, "mouth") &&
      !handToFaceDrinkable(lip, "mouth") &&
      !handToFaceDrinkable({ ...lip, at: "ahead" }, "mouth"),
  );
}

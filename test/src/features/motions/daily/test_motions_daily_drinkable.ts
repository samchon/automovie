import type { IAutoMovieMotionHumanGraspUse } from "@automovie/interface";
import {
  handToFaceDrinkable
} from "../../../../../packages/motions/src/daily/internal/handToFaceDrinkable";
import { TestValidator } from "@nestia/e2e";

/**
 * Check which declared grip uses admit drinking at a body region.
 *
 * Scenarios:
 *
 * 1. Admit the shorthand mouth and explicit mouth region for the prepared lip
 *    use. Refuse the same use at the forehead.
 * 2. A grip without a use, a tip without a destination and a reach-ahead use
 *    all fail drinking admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases identify the receiving region and malformed grip uses.
 * @evidence contracts/development/testing.md#behavioral-verification The drinkable selector is evaluated directly with exact grip records and destination options.
 * @evidence contracts/development/testing.md#independent-expectations Keeping lip use fixed while changing region isolates target matching. Each negative record changes the stated use field.
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

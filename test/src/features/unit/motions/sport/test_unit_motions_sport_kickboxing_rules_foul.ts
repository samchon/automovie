import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionTarget,
} from "@automovie/interface";
import { KickboxingRules } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `KickboxingRules.foul` judges a strike's target by the GLORY Official Rules
 * V2.2 §5.07: the back of the head, the back and the groin are fouls (A.2,
 * A.3), a push kick may not strike the legs (A.4), and only strikes are
 * judged.
 *
 * Scenarios:
 *
 * 1. A punch to the jaw is legal; one to the nape is a foul.
 * 2. A knee to the groin is a foul.
 * 3. A push kick to the thigh is a foul; a round kick to it is legal.
 * 4. A defence, or a strike at no person, is not judged.
 */
export function test_unit_motions_sport_kickboxing_rules_foul(): void {
  const at = (
    region: AutoMovieHumanoidRegion,
  ): { at: IAutoMovieMotionTarget } => ({
    at: { kind: "person", subject: "b", region },
  });
  TestValidator.equals(
    "legal and foul targets",
    [
      KickboxingRules.foul("punch", at("jawLeft")),
      KickboxingRules.foul("punch", at("nape")),
      KickboxingRules.foul("knee", at("groin")),
      KickboxingRules.foul("kick", {
        ...at("thighOuterLeft"),
        technique: "push",
      }),
      KickboxingRules.foul("kick", {
        ...at("thighOuterLeft"),
        technique: "round",
      }),
      KickboxingRules.foul("defend", at("nape")),
      KickboxingRules.foul("punch", { at: { kind: "none" } }),
    ],
    [
      null,
      "a strike at the nape is a foul",
      "a strike at the groin is a foul",
      "a linear kick at the thighOuterLeft is a foul",
      null,
      null,
      null,
    ],
  );
}

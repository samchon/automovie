import { HumanPerformanceParams, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * An invalid anatomical region is reported on the region of the selected target form.
 *
 * Scenarios:
 * 1. A known region is accepted on oneself and on another person.
 * 2. Both forms refuse an unknown region at the nested path and identify the input.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which member of the selected target alternative owns the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Admits or rejects the authored target through the real parameter gate.
 * @evidence contracts/development/testing.md#independent-expectations A chin is an anatomical region and the invented name is outside the vocabulary.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks both target discriminators and both region values.
 * @evidence contracts/development/testing.md#execution-ownership Exercises parameter admission without staging a performer or a partner.
 */
export function test_human_motion_lexicon_absent_regions(): void {
  for (const target of [
    { kind: "self" },
    { kind: "person", subject: "partner" },
  ]) {
    HumanPerformanceParams.check("touchTap", {
      target: { ...target, region: "chin" },
    });
    const unknownRegion: string = "missingRegion";
    let refusal: unknown;
    try {
      HumanPerformanceParams.check("touchTap", {
        target: { ...target, region: unknownRegion },
      });
    } catch (error) {
      refusal = error;
    }
    TestValidator.predicate(
      target.kind + " region diagnostic",
      refusal instanceof HumanRefusal &&
        refusal.kind === "parameter" &&
        refusal.axis === "target.region" &&
        refusal.value === unknownRegion,
    );
  }
}

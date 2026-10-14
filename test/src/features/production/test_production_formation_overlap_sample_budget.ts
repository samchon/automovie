import { TestValidator } from "@nestia/e2e";

import { createFormationOverlapScenario } from "../internal/createFormationOverlapScenario";
import { namedFacts } from "../internal/predicates";

/**
 * Cue ends spend the original sampling budget without changing the measured motion.
 *
 * Scenarios:
 * 1. Retain the original eight filler cues and all nineteen cue ends.
 * 2. Preserve end-overlap refusal, budget-limited interior acceptance and unspent-budget crossing refusal.
 *
 * @evidence contracts/testing.md#behavioral-verification Validates the same crossing with and without eight filler cues, asserting endpoint refusal, budget-limited interior omission and recovered interior refusal when the budget is available.
 * @evidence contracts/testing.md#independent-expectations Eight disjoint filler windows add16 endpoints to0/1/3, yielding19 distinct ends beyond the16-sample interior budget. Translation0 to5 ends at the stationary center;0 to10 crosses only between its clear ends.
 * @evidence contracts/testing.md#distinguishing-cases Endpoint collision survives exhausted budget, an interior-only event is omitted, and the identical interior crossing is found without filler cues. These observations expose resolution limits rather than certifying continuous separation.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_production_formation_overlap_sample_budget owns portable synchronous cue/gate cases using the original filler fixture; it does not instrument performance or launch a real clock or renderer.
 */
export function test_production_formation_overlap_sample_budget(): void {
  const scenario: ReturnType<typeof createFormationOverlapScenario> = createFormationOverlapScenario();
  const { post, row, carry, filler, codes }: typeof scenario = scenario;
  const wide: ReturnType<typeof post> = post({ id: "post", radius: 0.4 });

  // 17. a shot whose ends already spend the budget is walked at its ends alone.
  const spent: ReturnType<typeof filler> = filler(8);
  const meetingAtAnEnd: ReturnType<typeof row>[] = [
    row({ id: "still", count: 1, spacing: 1 }),
    row({ id: "walker", count: 1, spacing: 1, anchor: { x: -5, y: 0, z: 0 } }),
  ];
  TestValidator.equals(
    "a shot with no sampling budget left is walked at its cue ends alone",
    namedFacts([
      // The walker finishes its cue standing on the still unit, which is an end
      // and is therefore always sampled.
      [
        "anEndIsAlwaysRead",
        (): boolean =>
          codes({
            models: [wide],
            formations: meetingAtAnEnd,
            formationMotions: [
              carry({ formation: "walker", from: 0, to: 5 }),
              ...spent,
            ],
          }).length === 1,
      ],
      // The same crossing happening only between two ends is the resolution the
      // budget states, rather than a claim that nothing crossed.
      [
        "theInteriorIsTheStatedLimit",
        (): boolean =>
          codes({
            models: [wide],
            formations: meetingAtAnEnd,
            formationMotions: [
              carry({ formation: "walker", from: 0, to: 10 }),
              ...spent,
            ],
          }).length === 0,
      ],
      // With the budget unspent that same crossing is found, so the acceptance
      // above is the ends being all that was left and not the walk failing.
      [
        "withBudgetItIsFound",
        (): boolean =>
          codes({
            models: [wide],
            formations: meetingAtAnEnd,
            formationMotions: [carry({ formation: "walker", from: 0, to: 10 })],
          }).length === 1,
      ],
    ]),
    {
      anEndIsAlwaysRead: true,
      theInteriorIsTheStatedLimit: true,
      withBudgetItIsFound: true,
    },
  );
}

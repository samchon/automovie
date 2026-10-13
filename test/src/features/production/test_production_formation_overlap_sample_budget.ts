import { TestValidator } from "@nestia/e2e";

import { createFormationOverlapScenario } from "../internal/createFormationOverlapScenario";
import { namedFacts } from "../internal/predicates";

/**
 * Cue ends spend the original sampling budget without changing the measured motion.
 *
 * Scenarios:
 * 1. Retain the original eight filler cues and all nineteen cue ends.
 * 2. Preserve end-overlap refusal, budget-limited interior acceptance and unspent-budget crossing refusal.
 */
export const test_production_formation_overlap_sample_budget = (): void => {
  const scenario = createFormationOverlapScenario();
  const { post, row, carry, filler, codes } = scenario;
  const wide = post({ id: "post", radius: 0.4 });

  // 17. a shot whose ends already spend the budget is walked at its ends alone.
  const spent = filler(8);
  const meetingAtAnEnd = [
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
        () =>
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
        () =>
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
        () =>
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
};

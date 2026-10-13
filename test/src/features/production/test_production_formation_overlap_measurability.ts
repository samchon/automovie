import { TestValidator } from "@nestia/e2e";

import { createFormationOverlapScenario } from "../internal/createFormationOverlapScenario";
import { namedFacts } from "../internal/predicates";
import { createFormationFlatModel } from "../internal/createFormationFlatModel";

/**
 * A size or shared height is measured only where the authored runtime can state it.
 *
 * Scenarios:
 * 1. Accept units separated vertically by the original model lift.
 * 2. Preserve missing-runtime, empty-tier, flat geometry and mixed measurable-unit outcomes.
 */
export const test_production_formation_overlap_measurability = (): void => {
  const scenario = createFormationOverlapScenario();
  const { post, row, codes } = scenario;
  const wide = post({ id: "post", radius: 0.4 });

  TestValidator.equals(
    "units in one place at heights that never meet are accepted",
    codes({
      models: [wide, post({ id: "upper", radius: 0.4, lift: 5 })],
      formations: [
        row({ id: "ground", count: 1, spacing: 1 }),
        row({ id: "sky", count: 1, spacing: 1, model: "upper" }),
      ],
    }),
    [],
  );

  const flat = createFormationFlatModel(wide);
  TestValidator.equals(
    "a unit this shot cannot measure is left alone rather than measured against a guess",
    namedFacts([
      [
        "missingRuntime",
        () =>
          codes({
            models: [],
            formations: [row({ spacing: 0.1 })],
          }).length === 0,
      ],
      [
        "noTierAtAll",
        () =>
          codes({
            models: [wide],
            formations: [{ ...row({ spacing: 0.1 }), lod: [] }],
          }).length === 0,
      ],
      [
        "noColumnAtAll",
        () =>
          codes({
            models: [flat],
            formations: [row({ spacing: 0.1, model: "flat" })],
          }).length === 0,
      ],
      [
        "oneMeasurableUnitStillAnswers",
        () =>
          codes({
            models: [wide, flat],
            formations: [
              row({ id: "paper", spacing: 0.1, model: "flat" }),
              row({ id: "crowd", spacing: 0.1 }),
            ],
          }).length === 1,
      ],
    ]),
    {
      missingRuntime: true,
      noTierAtAll: true,
      noColumnAtAll: true,
      oneMeasurableUnitStillAnswers: true,
    },
  );


};

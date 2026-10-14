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
 *
 * @evidence contracts/testing.md#behavioral-verification Runs actual overlap validation for vertically separate models and missing/empty/flat runtime carriers, checking that unsupported populations are omitted while a measurable packed unit still produces its finding.
 * @evidence contracts/testing.md#independent-expectations A five-metre lift separates the authored two-metre posts; a zero-thickness plane supplies no filled vertical core. Missing runtimes and absent tiers supply no supported size, while ordinary tightly spaced posts remain measurable.
 * @evidence contracts/testing.md#distinguishing-cases Measurable separated posts contrast with missing runtime, empty tiers and flat geometry, including a mixed shot where only its measurable unit answers. An empty result here is omission or sampled clearance, not proof that arbitrary geometry cannot overlap.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_production_formation_overlap_measurability owns synchronous CPU gate cases through existing fixture constructors and source imports, without mesh rendering or replacement of global implementations.
 */
export function test_production_formation_overlap_measurability(): void {
  const scenario: ReturnType<typeof createFormationOverlapScenario> = createFormationOverlapScenario();
  const { post, row, codes }: typeof scenario = scenario;
  const wide: ReturnType<typeof post> = post({ id: "post", radius: 0.4 });

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

  const flat: ReturnType<typeof createFormationFlatModel> = createFormationFlatModel(wide);
  TestValidator.equals(
    "a unit this shot cannot measure is left alone rather than measured against a guess",
    namedFacts([
      [
        "missingRuntime",
        (): boolean =>
          codes({
            models: [],
            formations: [row({ spacing: 0.1 })],
          }).length === 0,
      ],
      [
        "noTierAtAll",
        (): boolean =>
          codes({
            models: [wide],
            formations: [{ ...row({ spacing: 0.1 }), lod: [] }],
          }).length === 0,
      ],
      [
        "noColumnAtAll",
        (): boolean =>
          codes({
            models: [flat],
            formations: [row({ spacing: 0.1, model: "flat" })],
          }).length === 0,
      ],
      [
        "oneMeasurableUnitStillAnswers",
        (): boolean =>
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


}

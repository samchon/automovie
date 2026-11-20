import { TestValidator } from "@nestia/e2e";

import { archetypeCatalogueVesselContact } from "../internal/archetypeCatalogueVesselContact";
import { motionCoveringArray } from "../internal/motionCoveringArray";

/**
 * Real vessels remain in the same grasp during a still hold.
 *
 * Scenarios:
 * 1. Verify the exact strength-two actor/producers/relation tuples used by the hold, drink and carry entries.
 * 2. Use 200 seeded glass bodies and 200 seeded mug hooks in public pickup and hold compositions.
 * 3. Refuse a missing glass handle and the known infeasible mug hook drinking entry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the held contact, pairwise coverage and two concrete refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the hand and material at grip closure and tracks two material points in displayed wrist space.
 * @evidence contracts/development/testing.md#independent-expectations Physical grip and drift budgets are 10 mm and 1 mm from #3358. Maker dimensions, measured primitive extrema and the 80-percent coverage rule bound the seeded shape evidence.
 * @evidence contracts/development/testing.md#distinguishing-cases Retains both body and hook contacts, exact coverage tuples and independently specified handle and facing refusal axes.
 * @evidence contracts/development/testing.md#execution-ownership Discovers one portable hold scenario. Construction is confined to one seeded in-memory performance and its frames at a time.
 */
export function test_archetype_catalogue_actor_handheld(): void {
  const rows: Record<string, string>[] = motionCoveringArray(
    {
      vessel: ["glass", "mug"],
      action: ["hold", "use", "carry"],
      body: ["m-average", "f-average"],
    },
    2,
  );
  TestValidator.equals(
    "the authored vessel cells cover every required pair",
    rows
      .map(({ vessel, action, body }): string => `${vessel}/${action}/${body}`)
      .sort((left: string, right: string): number => left.localeCompare(right)),
    [
      "glass/carry/m-average",
      "glass/hold/m-average",
      "glass/use/f-average",
      "mug/carry/f-average",
      "mug/hold/f-average",
      "mug/use/m-average",
    ],
  );
  archetypeCatalogueVesselContact("glass", "hold", "m-average", 0, 200);
  archetypeCatalogueVesselContact("mug", "hold", "f-average", 0, 200);
  archetypeCatalogueVesselContact.refusals();
}

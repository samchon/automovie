import { archetypeCatalogueVesselContact } from "../internal/archetypeCatalogueVesselContact";

/**
 * A vessel keeps its material grip across the cut into travel.
 *
 * Scenarios:
 * 1. Carry 200 seeded glass bodies and 200 seeded mug hooks in the authored 1 m walk.
 * 2. Read continuity on both sides of the pickup cut and during travel.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the two vessel kinds, carried materials, cut and movement distance.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public wrist and vessel placements at the cut and through the walk, and demands at least 0.5 m of actual vessel translation.
 * @evidence contracts/development/testing.md#independent-expectations The 1 mm drift and 10 mm grip contact budgets come from #3358. A prop kept in the hand through a 1 m walk must itself move appreciably.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks the broad glass body and narrow actual mug hook on different surveyed bodies, with independent flow into a walking segment.
 * @evidence contracts/development/testing.md#execution-ownership This discovered scenario confines construction to one in-memory film and its frames at a time.
 */
export function test_archetype_catalogue_actor_handheld_carry(): void {
  archetypeCatalogueVesselContact("glass", "carry", "m-average", 0, 200);
  archetypeCatalogueVesselContact("mug", "carry", "f-average", 0, 200);
}

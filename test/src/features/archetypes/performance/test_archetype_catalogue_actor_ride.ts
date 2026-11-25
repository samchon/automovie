import { archetypeCatalogueRideContact } from "../../internal/archetypeCatalogueRideContact";

/**
 * A seated actor rides the moving sedan cushion for every admitted model seed.
 *
 * Scenarios:
 * 1. Exercise sedan seeds 0 through 99. The second scenario owns seeds 100 through 199.
 * 2. Transform the displayed seat region back into the measured driver cushion, which moves through a quarter turn, and compare the actor heading to the authored turn.
 * 3. Require the independently predicted low-seat refusal and a seated-entry refusal when the actor starts standing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the seeded model choice, actual surface and world heading and names the adjacent refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the actual archetype and actor with their public adapters. A misplaced, sliding or wrongly turned support fails without any plan-goal comparison.
 * @evidence contracts/development/testing.md#independent-expectations Read the actual cushion boundary and actor popliteal height. The ordinary-seat cutoff of 0.8 comes from #3363. The 10 mm seat and one-degree heading budgets come from the maintained rider attachment signature.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes stationary entry, acceleration-free translation and yaw, end support and standing refusal. The existing actual cycle and saddle take fixtures cover steering bank, stirrup contact and rising; this bounded row checks only sedan seat and heading.
 * @evidence contracts/development/testing.md#execution-ownership Runs the public SDK in memory one model and film at a time. Keeps band extrema and one worst example rather than every pose.
 */
export function test_archetype_catalogue_actor_ride(): void {
  archetypeCatalogueRideContact(0, 100);
}

import { archetypeCatalogueRideContact } from "../../../internal/archetypeCatalogueRideContact";

/**
 * A seated actor rides the moving sedan cushion for every admitted model seed.
 *
 * Scenarios:
 * 1. Exercise sedan seeds 0 through 99. The second scenario owns seeds 100 through 199.
 * 2. Transform the displayed seat region back into the measured driver cushion, which moves through a quarter turn, and compare the actor heading to the authored turn.
 * 3. Require the independently predicted low-seat refusal and a seated-entry refusal when the actor starts standing.
 */
export function test_unit_archetypes_props_catalogue_actor_ride(): void {
  archetypeCatalogueRideContact(0, 100);
}

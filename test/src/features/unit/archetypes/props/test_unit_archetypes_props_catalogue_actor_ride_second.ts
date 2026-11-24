import { archetypeCatalogueRideContact } from "../../../internal/archetypeCatalogueRideContact";

/**
 * Exercise the latter half of the same sedan seat and turn compositions.
 *
 * Scenarios:
 * 1. Build model seeds 100 through 199 and record all lawful contacts and low-seat refusals.
 * 2. Compare the real seated actor and cushion through the authored turn.
 */
export function test_unit_archetypes_props_catalogue_actor_ride_second(): void {
  archetypeCatalogueRideContact(100, 200);
}

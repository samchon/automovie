import { archetypeCatalogueVesselContact } from "../../../internal/archetypeCatalogueVesselContact";

/**
 * A vessel keeps its material grip across the cut into travel.
 *
 * Scenarios:
 * 1. Carry 200 seeded glass bodies and 200 seeded mug hooks in the authored 1 m walk.
 * 2. Read continuity on both sides of the pickup cut and during travel.
 */
export function test_unit_archetypes_props_catalogue_actor_handheld_carry(): void {
  archetypeCatalogueVesselContact("glass", "carry", "m-average", 0, 200);
  archetypeCatalogueVesselContact("mug", "carry", "f-average", 0, 200);
}

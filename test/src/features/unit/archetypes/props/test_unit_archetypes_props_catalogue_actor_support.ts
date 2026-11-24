import { archetypeCatalogueSeatContact } from "../../../internal/archetypeCatalogueSeatContact";

/**
 * Seeded stools preserve the physical seat dimensions and the fit boundary.
 *
 * Scenarios:
 * 1. Read the height and width of the actual seat disc from all 200 models of each variant.
 * 2. Place a real bar stool beyond reach and require a seat reach refusal.
 */
export function test_unit_archetypes_props_catalogue_actor_support(): void {
  archetypeCatalogueSeatContact.boundaries();
}

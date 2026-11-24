import { archetypeCatalogueSeatContact } from "../../../internal/archetypeCatalogueSeatContact";

/**
 * The actual ordinary stool supports the displayed actor during the held act.
 *
 * Scenarios:
 * 1. Use model seeds 175 through 199 on the surveyed m-average actor.
 * 2. Track the anatomical seat region across the seated phase and the following gesture.
 */
export function test_unit_archetypes_props_catalogue_actor_stool_8(): void {
  archetypeCatalogueSeatContact("stool", 175, 200);
}

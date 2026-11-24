import { archetypeCatalogueSeatContact } from "../../../internal/archetypeCatalogueSeatContact";

/**
 * The actual high bar stool supports the displayed actor during the held act.
 *
 * Scenarios:
 * 1. Use model seeds 0 through 24 on the surveyed m-average actor.
 * 2. Track the anatomical seat region across the seated phase and the following gesture.
 */
export function test_unit_archetypes_props_catalogue_actor_bar_stool_1(): void {
  archetypeCatalogueSeatContact("barStool", 0, 25);
}

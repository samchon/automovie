import { archetypeCatalogueSeatContact } from "../../../internal/archetypeCatalogueSeatContact";

/**
 * The actual high bar stool supports the displayed actor during the held act.
 *
 * Scenarios:
 * 1. Use model seeds 100 through 124 on the surveyed m-average actor.
 * 2. Track the anatomical seat region across the seated phase and the following gesture.
 */
export function test_unit_archetypes_props_catalogue_actor_bar_stool_5(): void {
  archetypeCatalogueSeatContact("barStool", 100, 125);
}

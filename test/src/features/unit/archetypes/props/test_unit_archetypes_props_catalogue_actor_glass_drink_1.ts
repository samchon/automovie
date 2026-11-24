import { archetypeCatalogueVesselContact } from "../../../internal/archetypeCatalogueVesselContact";

/**
 * A seeded glass drink keeps the physical glass body grasp and brings the actual glass rim to the mouth.
 *
 * Scenarios:
 * 1. Run model seeds 0 through 49 on f-average's authored public pickup and drink.
 * 2. Read the material at grip closure and the posed rim and lips at drinking contact.
 */
export function test_unit_archetypes_props_catalogue_actor_glass_drink_1(): void {
  archetypeCatalogueVesselContact("glass", "use", "f-average", 0, 50);
}

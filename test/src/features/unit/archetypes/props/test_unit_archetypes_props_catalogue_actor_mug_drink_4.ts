import { archetypeCatalogueVesselContact } from "../../../internal/archetypeCatalogueVesselContact";

/**
 * A seeded mug drink keeps the cylindrical mug body grasp and brings the actual mug rim to the mouth.
 *
 * Scenarios:
 * 1. Run model seeds 150 through 199 on m-average's authored public pickup and drink.
 * 2. Read the material at grip closure and the posed rim and lips at drinking contact.
 */
export function test_unit_archetypes_props_catalogue_actor_mug_drink_4(): void {
  archetypeCatalogueVesselContact("mug", "use", "m-average", 150, 200);
}

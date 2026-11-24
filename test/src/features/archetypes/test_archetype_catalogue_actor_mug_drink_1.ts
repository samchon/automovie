import { archetypeCatalogueVesselContact } from "../internal/archetypeCatalogueVesselContact";

/**
 * A seeded mug drink keeps the cylindrical mug body grasp and brings the actual mug rim to the mouth.
 *
 * Scenarios:
 * 1. Run model seeds 0 through 49 on m-average's authored public pickup and drink.
 * 2. Read the material at grip closure and the posed rim and lips at drinking contact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the actor, grip material, events and exact seed interval.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves the actor's actual bones and the produced vessel's actual shape, then measures grip, drift and rim position.
 * @evidence contracts/development/testing.md#independent-expectations The cylindrical rim comes from collider extrema. #3358 states 1 mm for rigid drift and 10 mm for contact placement.
 * @evidence contracts/development/testing.md#distinguishing-cases Tests a disjoint 50-seed interval. The hold scenario tests the full geometry band and the named adjacent refusals.
 * @evidence contracts/development/testing.md#execution-ownership The named scenario runs one public in-memory film at a time and retains extrema and a representative failure only.
 */
export function test_archetype_catalogue_actor_mug_drink_1(): void {
  archetypeCatalogueVesselContact("mug", "use", "m-average", 0, 50);
}

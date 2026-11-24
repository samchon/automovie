import { archetypeCatalogueSeatContact } from "../internal/archetypeCatalogueSeatContact";

/**
 * Seeded stools preserve the physical seat dimensions and the fit boundary.
 *
 * Scenarios:
 * 1. Read the height and width of the actual seat disc from all 200 models of each variant.
 * 2. Place a real bar stool beyond reach and require a seat reach refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both measured physical dimensions, the seed count and the specific invalid placement.
 * @evidence contracts/development/testing.md#behavioral-verification Independently measures emitted colliders and calls the actual composed sit on the distant seat.
 * @evidence contracts/development/testing.md#independent-expectations The ranges come from the existing Blackler and stool references and the stated 10 to 12 inch NKBA bar-height convention. Each nondegenerate physical band must span at least 80 percent.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both ordinary and high seat geometry and names the public refusal axis on a physically unreachable seat. Distinct seed ranges in the stool and bar-stool scenarios exercise admitted contacts.
 * @evidence contracts/development/testing.md#execution-ownership This discovered in-memory scenario builds each set of colliders, then one public refused composition. It retains scalar dimensions only.
 */
export function test_archetype_catalogue_actor_support(): void {
  archetypeCatalogueSeatContact.boundaries();
}

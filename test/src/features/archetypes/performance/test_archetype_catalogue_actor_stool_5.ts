import { archetypeCatalogueSeatContact } from "../../internal/archetypeCatalogueSeatContact";

/**
 * The actual ordinary stool supports the displayed actor during the held act.
 *
 * Scenarios:
 * 1. Use model seeds 100 through 124 on the surveyed m-average actor.
 * 2. Track the anatomical seat region across the seated phase and the following gesture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the seated actor, the model seeds and the observed support material.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public sit and held gesture composition and resolves the actual region from displayed bones.
 * @evidence contracts/development/testing.md#independent-expectations Measures the actual seat disc. The maximum contact gap is 10 mm from #3358.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises a disjoint 25-seed group and the support after the cut. The geometry-only companion scenario owns whole-band spread and the distant-seat refusal.
 * @evidence contracts/development/testing.md#execution-ownership This discovered scenario constructs each actual film and its collider snapshot in memory, releasing them after reading the pose.
 */
export function test_archetype_catalogue_actor_stool_5(): void {
  archetypeCatalogueSeatContact("stool", 100, 125);
}

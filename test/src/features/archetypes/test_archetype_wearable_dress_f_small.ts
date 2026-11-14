import { archetypeWearableDress } from "../internal/archetypeWearableDress";

/**
 * A hat and a pair of spectacles are put on by their own `wear` socket, on the small woman: taken up for their use, worn on the crown or the nose's bridge, they are carried until the socket lies there, and the head wears them. `archetypeWearableDress` states the stage and the scenarios with their bounds.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the pick-up and the dressing through the public chain with the real wearables and reads the displayed item and head; an item put on beside its place, one left behind as the head moves, or one put on from the table fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The socket is the archetype's own contact and the region the body's own; the bounds are the held-tool verdict's and the worn thing's rigid offset.
 * @evidence contracts/development/testing.md#distinguishing-cases A hat on the crown and spectacles on the nose, held and not; the other stature is `test_archetype_wearable_dress_m_average`, split so each runs alone in its time.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and four short films; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the body, where the scenarios are stated and the split.
 */
export function test_archetype_wearable_dress_f_small(): void {
  archetypeWearableDress("f-small");
}
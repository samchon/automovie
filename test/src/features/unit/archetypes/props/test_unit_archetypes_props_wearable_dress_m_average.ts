import { archetypeWearableDress } from "../../../internal/archetypeWearableDress";

/**
 * A hat and a pair of spectacles are put on by their own `wear` socket, on the average man: taken up for their use, worn on the crown or the nose's bridge, they are carried until the socket lies there, and the head wears them. `archetypeWearableDress` states the stage and the scenarios with their bounds.
 */
export function test_unit_archetypes_props_wearable_dress_m_average(): void {
  archetypeWearableDress("m-average");
}

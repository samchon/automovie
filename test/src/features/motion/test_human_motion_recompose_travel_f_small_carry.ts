import { motionRecomposeTravel } from "../internal/motionRecomposeTravel";

/**
 * The travel and carriage laws composed on the grammar
 * (`motionRecomposeTravel`'s twelve scenarios) on the f-small: the loads
 * and the coupled partner this body covers (scenarios 5 and 6); the other
 * bodies and groups are its sibling parts.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs this body's share of the matrix through the public chain (`motionRecomposeTravel`); a broken verdict fails with its cell.
 * @evidence contracts/development/testing.md#independent-expectations The verdicts and bounds are `motionRecomposeTravel`'s, each with its source there.
 * @evidence contracts/development/testing.md#distinguishing-cases One stature and one group of scenarios; the parts together are the whole matrix.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of the motions package on prepared polygon-man bodies and an archetype ladder, discovered by its exported name; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the body, the scenarios and where they are listed.
 */
export function test_human_motion_recompose_travel_f_small_carry(): void {
  motionRecomposeTravel(1, "f-small", "carry");
}

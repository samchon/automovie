import { motionComposeTrunk } from "../internal/motionComposeTrunk";

/**
 * The trunk's counterbalance on the m-long-armed body: the hips moved straight back under limbs held out ahead until the centre of mass stands over the feet, and a pose no place of the hips balances refused (`motionComposeTrunk.counterbalance` states
 * the scenarios and their bounds). One spec per body of the sweep, so every
 * body is read and each runs alone in its time.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the balance owner's measure on the written posture; a counterbalance that stops short, moves along the world axis, lifts the body, stays after its end, or refuses a balanceable pose or plans an unbalanceable one fails.
 * @evidence contracts/development/testing.md#independent-expectations Static balance is the centre of mass over the base of support and the direction is the heading's; whether a pose is balanceable is decided by this test's own scan of the hips' places within the legs' reach, not read from the phrase's solve.
 * @evidence contracts/development/testing.md#distinguishing-cases A pose that needs no shift, one that needs a moderate one, one whose hips start most of a leg's length ahead, and one whose balance the scan decides, at two headings, on one body of the sweep; the other bodies, the turn and the crouch are their own specs.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body, up to some fifty solved postures per balance search and one scan of the hips' places; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the phrase, the body, where the scenarios are stated and the split.
 */
export function test_human_motion_compose_trunk_counterbalance_m_long_armed(): void {
  motionComposeTrunk.counterbalance("m-long-armed");
}

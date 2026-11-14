import { motionComposeRise } from "../internal/motionComposeRise";

/**
 * The scenarios of `motionComposeRise` on the m-tall body: one spec per body of the
 * sweep, so every body is read and each runs alone in its time.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the placements and the resolver's bones; a turn about the ankle or the toe tip, a lever that stretches, a lift of one foot only, or toes that turn up with the foot fails.
 * @evidence contracts/development/testing.md#independent-expectations The ankle's height is the rigid turn's closed form on the flat lever, the joint's place is the flat one and the displayed toes are compared with the standing body's.
 * @evidence contracts/development/testing.md#distinguishing-cases Four raises including none, both feet, two headings and fourteen foot sizes; every failing cell is named with its body, its parameters and its measured numbers; one body of the sweep per spec, the other thirteen their own specs.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the body, where the scenarios and their bounds are stated and the split.
 */
export function test_human_motion_compose_rise_m_tall(): void {
  motionComposeRise("m-tall");
}

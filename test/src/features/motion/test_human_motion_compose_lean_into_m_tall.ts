import { motionComposeLeanInto } from "../internal/motionComposeLeanInto";

/**
 * The scenarios of `motionComposeLeanInto` on the m-tall body: one spec per body of the
 * sweep, so every body is read and each runs alone in its time.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the solved pitch against goals whose answer is known by construction, and the resolver's bones and the balance owner's margin on each written posture; a lean that overshoots, stops short, forgets the balance, drags a foot or stays down fails.
 * @evidence contracts/development/testing.md#independent-expectations Each goal is placed from the displayed shoulder at a chosen pitch, so the expected pitch is the chosen one; the refusal's distance is the 0.1 m the goal was placed beyond.
 * @evidence contracts/development/testing.md#distinguishing-cases Near, three far and one unreachable goal, both hands, two shares, five phases of the primitive, fourteen bodies; every failing cell is named with its body, its parameters and its measured numbers; one body of the sweep per spec, the other thirteen their own specs.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the body, where the scenarios and their bounds are stated and the split.
 */
export function test_human_motion_compose_lean_into_m_tall(): void {
  motionComposeLeanInto("m-tall");
}

import { motionComposeReachFit } from "../internal/motionComposeReachFit";

/**
 * The scenarios of `motionComposeReachFit` on the m-broad body: one spec per body of the
 * sweep, so every body is read and each runs alone in its time.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Compares the measurement with the displayed bones and each policy's result with its definition; a root read from the rest pose, a lean that stops short or overshoots, a clamp off the line or a leg that silently clamps fails.
 * @evidence contracts/development/testing.md#independent-expectations Roots and lengths come from the resolver's bones, lean answers from the construction of the point, the clamp from the line and the stated length.
 * @evidence contracts/development/testing.md#distinguishing-cases Four limbs, two postures, inside and outside reach, three chosen pitches, two limits, three policies, fourteen bodies; every failing cell is named with its body, its parameters and its measured numbers; one body of the sweep per spec, the other thirteen their own specs.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the body, where the scenarios and their bounds are stated and the split.
 */
export function test_human_motion_compose_reach_fit_m_broad(): void {
  motionComposeReachFit("m-broad");
}

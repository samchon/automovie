import { motionComposeReachFit } from "../internal/motionComposeReachFit";

/**
 * Reach is the sum of two link lengths. The least lean comes from the
 * shoulder's circular path, and every out-of-reach policy follows its own
 * geometric branch.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Compares the measurement with the displayed bones and each policy's result with its definition; a root read from the rest pose, a lean that stops short or overshoots, a clamp off the line or a leg that silently clamps fails.
 * @evidence contracts/development/testing.md#independent-expectations Roots and lengths come from the resolver's bones, lean answers from the construction of the point, the clamp from the line and the stated length.
 * @evidence contracts/development/testing.md#distinguishing-cases A reference body covers left and right arms and legs, pitched and upright roots, and three policies. The shortest and longest arm proportions cover the length-normalized clamp under a 90-degree turn.
 * @evidence contracts/development/testing.md#execution-ownership Uses three prepared rigs in memory. The test program discovers the public name.
 * @evidence contracts/development/common.md#meaningful-documentation States the link, lean and policy expectations.
 */
export function test_human_motion_compose_reach_fit_m_average(): void {
  motionComposeReachFit();
}

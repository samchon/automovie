import { motionComposeLean } from "../internal/motionComposeLean";

/**
 * The scenarios of `motionComposeLean` on the m-large body: one spec per body of the
 * sweep, so every body is read and each runs alone in its time.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the resolver's bones for each written posture; a tilt about the root, a shift applied in the world frame, a sway that lets a foot leave its plant, a bow without its balance shift or an unclamped weight fails.
 * @evidence contracts/development/testing.md#independent-expectations The hips' place is the standing one moved by the stated distance, the feet's places are the standing goals, the bow's shift ratio is the stated ratio of sines and the balance is the centre of mass over the soles.
 * @evidence contracts/development/testing.md#distinguishing-cases Pitch against roll, two headings, a shift with and without a height, weights at, inside and outside [0, 1], refused peaks at and under 0, three bow peaks, the fourteen bodies of the sweep; every failing cell is named with its body and its measured numbers; one body of the sweep per spec, the other thirteen their own specs.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the body, where the scenarios and their bounds are stated and the split.
 */
export function test_human_motion_compose_lean_m_large(): void {
  motionComposeLean("m-large");
}

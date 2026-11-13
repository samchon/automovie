import { motionComposeGaze } from "../internal/motionComposeGaze";

/**
 * The scenarios of `motionComposeGaze` on the m-large body: one spec per body of the
 * sweep, so every body is read and each runs alone in its time.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed eyes, head and chest; eyes that miss, a head that turns for a near target or not at all for a far one, a trunk that joins, or a weight that overshoots fails.
 * @evidence contracts/development/testing.md#independent-expectations The eyes' error is measured between a displayed axis and the line to the target; the shares are the cited constants.
 * @evidence contracts/development/testing.md#distinguishing-cases Targets inside the eyes' share, inside the head's, beyond the eyes' range and behind the shoulder, left and right, up and down, both recruitments, five weights, fourteen bodies; every failing cell is named with its body, its target and its measured numbers; one body of the sweep per spec, the other thirteen their own specs.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the body, where the scenarios and their bounds are stated and the split.
 */
export function test_human_motion_compose_gaze_m_large(): void {
  motionComposeGaze("m-large");
}

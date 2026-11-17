import { motionWalkFacing } from "../internal/motionWalkFacing";

/**
 * A walk that does not face its way, on the small woman (#3360): a backward arc round a point it faces.
 * `motionWalkFacing` states the walks and the scenarios with their bounds
 * and sources.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the walks through the public chain and reads the displayed pelvis, ankles and the shipped foot verdicts; a body that turns to its way, feet that cross going aside, a foot that slides, lifts or sinks while planted, a walk that misses its end or a backpedal as fast as a forward walk fails.
 * @evidence contracts/development/testing.md#independent-expectations The headings are the ones asked, the foot bounds the campaign's, and the backward time ratio follows from the cited cadence and speed.
 * @evidence contracts/development/testing.md#distinguishing-cases Round a point; the other walks and the other stature are the other `test_human_motion_walk_facing_*` specs, split so each runs alone in its time.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds one short walk with their verdicts; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the body, the walks, where the scenarios are stated and the split.
 */
export function test_human_motion_walk_facing_arc_f_small(): void {
  motionWalkFacing("f-small", "arc");
}

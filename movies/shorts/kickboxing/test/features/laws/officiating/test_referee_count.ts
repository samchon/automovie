import assert from "node:assert/strict";

import { RefereeShape } from "../../../../src/laws/officiating/RefereeShape";
import { polygonCast } from "../../../internal/polygonCast";

/**
 * The count's arm motion and the winner's raised hand.
 *
 * Scenarios: within each counted second the counting hand rises above the
 * shoulder, then comes down below it pointing at the fallen man, so every
 * number is one downward motion; at the winner signal the hand is raised
 * above the head toward the winner.
 */
export function test_referee_count(): void {
  const measure = polygonCast().referee.body.measure;
  const rest = {
    left: { x: 0, y: measure.ankle, z: measure.hipHalfWidth },
    right: { x: 0, y: measure.ankle, z: -measure.hipHalfWidth },
  };
  const toward = { x: 1, y: 0, z: 0 };
  const hand = (signal: RefereeShape.Signal, share: number) =>
    RefereeShape.posture(measure, rest, { signal, share, toward }).hands.right
      .point;
  const high = hand("count", 0.3);
  const low = hand("count", 0.7);
  const shoulder: number = measure.shoulder - RefereeShape.stance(measure).drop;
  assert.ok(high.y > shoulder, `${high.y} <= ${shoulder}`);
  assert.ok(low.y < high.y);
  assert.ok(low.x > high.x);
  // He walks to the winner first and raises the hand once beside him.
  assert.ok(hand("winner", 0.3).y < shoulder);
  const raised = hand("winner", 0.8);
  assert.ok(raised.y > measure.head);
  // The wave-off crosses both hands over the head.
  const wave = RefereeShape.posture(measure, rest, {
    signal: "knockout",
    share: 0.5,
    toward,
  }).hands;
  assert.ok(wave.left.point.y > measure.head);
  assert.ok(wave.right.point.y > measure.head);
}

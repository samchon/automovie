import assert from "node:assert/strict";
import type { IAutoMovieHumanPose } from "@automovie/human";

import { applyDuelImpactReaction } from "../../../src/applyDuelImpactReaction";

/**
 * @evidence contracts/testing.md#observable-behavior A visible brace follows actual event time, recovers and preserves every contact-bearing arm/leg channel. No admitted event means no invented reaction.
 * @evidence contracts/testing.md#independent-cases Distinct initial neck/right-arm/leg values protect additive semantics and input immutability; two overlapping events cannot double the configured single response. Before/after/empty event lists are exact originals. Reordered queries reproduce the same result and nonfinite event input refuses. These pure checks do not certify visible impact or physical force.
 */
export function test_duel_impact_reaction(): void {
  const original: IAutoMovieHumanPose = { neck: { cervical: { flexion: 2 } }, arms: { left: {}, right: { elbow: { flexion: 45 } } }, legs: { left: { knee: { flexion: 15 } }, right: {} } };
  assert.deepEqual(applyDuelImpactReaction(original, "Carina", 10.08, []), original);
  assert.deepEqual(applyDuelImpactReaction(original, "Harry", 9.9, [10]), original);
  assert.deepEqual(applyDuelImpactReaction(original, "Harry", 10.4, [10]), original);
  const peak: IAutoMovieHumanPose = applyDuelImpactReaction(original, "Harry", 10.08, [10]);
  assert.ok(Math.abs(peak.neck!.cervical!.flexion! - 7) < 1e-9);
  assert.deepEqual(peak.arms, original.arms);
  assert.deepEqual(peak.legs, original.legs);
  assert.ok(applyDuelImpactReaction(original, "Harry", 10.08, [10, 10.04]).neck!.cervical!.flexion! <= 7);
  applyDuelImpactReaction(original, "Harry", 10.3, [10]);
  assert.deepEqual(applyDuelImpactReaction(original, "Harry", 10.08, [10]), peak);
  assert.equal(original.neck!.cervical!.flexion, 2);
  assert.throws((): void => { applyDuelImpactReaction(original, "Carina", 10, [NaN]); });
}

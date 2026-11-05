import assert from "node:assert/strict";
import type { IAutoMovieHumanHandPose } from "@automovie/human";

import { blendNoteGrip } from "../../../src/actors/blendNoteGrip";

/**
 * Keep opening pose intent independent of the actual paper-loss predicate.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the real hand interpolator with thumb/finger clinical fields. The closed endpoint preserves the accepted angles, half weight halves those angles and open returns zero. Source data remains unchanged and malformed weight refuses; no timestamp-only release follows from these pose values.
 * @evidence contracts/testing.md#independent-cases Literal40degree finger/20degree thumb angles provide independent midpoint and endpoint expectations. Both thumb-specific and finger-specific fields are covered, without constructing fake Human contact or claiming a measured release.
 */
export function test_grip_opening(): void {
  const hand: IAutoMovieHumanHandPose = { index: { mcpFlexion: 40, pipFlexion: 30 }, thumb: { cmcAbduction: 20, cmcOpposition: 16 } };
  assert.deepEqual(blendNoteGrip(hand, 1), hand);
  assert.deepEqual(blendNoteGrip(hand, 0.5), { index: { mcpFlexion: 20, pipFlexion: 15 }, thumb: { cmcAbduction: 10, cmcOpposition: 8 } });
  assert.equal(blendNoteGrip(hand, 0).index!.mcpFlexion, 0);
  assert.equal(hand.index!.mcpFlexion, 40);
  assert.deepEqual(blendNoteGrip({ index: undefined }, 0), {});
  assert.throws((): void => { blendNoteGrip({ index: { mcpFlexion: NaN } }, 0); });
  assert.throws((): void => { blendNoteGrip(hand, NaN); }); assert.throws((): void => { blendNoteGrip(hand, 1.1); });
}

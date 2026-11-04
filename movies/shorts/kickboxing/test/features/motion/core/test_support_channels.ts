import assert from "node:assert/strict";
import { AutoMovieHumanRigControls } from "@automovie/human";
import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { MotionSupportChannels } from "../../../../src/motion/core/MotionSupportChannels";

/**
 * Pin functional support authority without opening structural toes or changing native bounds.
 *
 * Scenarios:
 * 1. Either side retains hip3, knee2 and ankle1, while planted alone permits subtalar.
 * 2. Midfoot, hallux MTP/IP and lesser-toe MTP/PIP/DIP remain preserved in both policies.
 * 3. Mutating one returned selection cannot alter another side or a later call.
 * 4. Unknown runtime policies/sides refuse; selection never rewrites Human's bounds.
 *
 * @evidence contracts/testing.md#observable-behavior The public selector's canonical path sets expose missing knee rotation, a blanket arch unlock, compensating toe freedoms and cross-call aliasing. No rig, host or GPU is constructed; actual full-foot feasibility and phase continuity remain the technique/consumer tests' responsibility.
 * @evidence contracts/testing.md#independent-cases Explicit anatomical path expectations distinguish functional subtalar from midfoot and toe articulation. Both sides and policies, malformed inputs, output mutation and the native flexion-dependent knee/ankle/subtalar bounds cover the local boundary. These arithmetic checks do not assert that seven channels admit a particular route.
 */
export function test_support_channels(): void {
  for (const side of ["left", "right"] as const) {
    const proximal: AutoMovieHumanRigControls.DegreeChannel[] = ["hip.flexion", "hip.abduction", "hip.rotation", "knee.flexion", "knee.rotation", "ankle.dorsiflexion"].map((path: string): AutoMovieHumanRigControls.DegreeChannel => AutoMovieHumanRigControls.channel(`legs.${side}.${path}`));
    const subtalar: AutoMovieHumanRigControls.DegreeChannel = AutoMovieHumanRigControls.channel(`legs.${side}.foot.subtalarInversion`);
    const midfoot: AutoMovieHumanRigControls.DegreeChannel = AutoMovieHumanRigControls.channel(`legs.${side}.foot.midfootSupination`);
    const planted: MotionSupportChannels.Selection = MotionSupportChannels.select(side, "planted");
    const authored: MotionSupportChannels.Selection = MotionSupportChannels.select(side, "authored");
    assert.deepEqual(planted.channels, [...proximal, subtalar]);
    assert.deepEqual(authored.channels, proximal);
    assert.equal(planted.preserved.includes(subtalar), false);
    assert.equal(authored.preserved.includes(subtalar), true);

    for (const result of [planted, authored]) {
      assert.equal(result.preserved.includes(midfoot), true);
      for (const leaf of ["hallux.mtpFlexion", "hallux.mtpAbduction", "hallux.ipFlexion", "second.mtpFlexion", "second.mtpAbduction", "second.pipFlexion", "second.dipFlexion", "fifth.dipFlexion"])
        assert.equal(result.preserved.includes(AutoMovieHumanRigControls.channel(`legs.${side}.foot.${leaf}`)), true);
      assert.equal(result.channels.some((path: AutoMovieHumanRigControls.DegreeChannel): boolean => result.preserved.includes(path)), false);
      assert.equal(new Set(result.preserved).size, result.preserved.length);
      assert.equal(result.preserved.every((path: AutoMovieHumanRigControls.DegreeChannel): boolean => path.startsWith(`legs.${side}.`)), true);
    }

    const ankleBounds: { minimum: number; maximum: number } = AutoMovieHumanRigControls.bounds(AutoMovieHumanRigControls.channel(`legs.${side}.ankle.dorsiflexion`));
    assert.equal(ankleBounds.minimum, -58.35);
    assert.equal(ankleBounds.maximum, 13.25);
    assert.deepEqual(AutoMovieHumanRigControls.bounds(subtalar), { minimum: -5, maximum: 5 });
    assert.deepEqual(AutoMovieHumanRigControls.bounds(AutoMovieHumanRigControls.channel(`legs.${side}.knee.rotation`), { legs: { left: { knee: { flexion: 0 } }, right: { knee: { flexion: 0 } } } }), { minimum: -0, maximum: 0 });
  }

  const first: MotionSupportChannels.Selection = MotionSupportChannels.select("left", "planted");
  first.channels.length = 0;
  first.preserved.length = 0;
  assert.equal(MotionSupportChannels.select("left", "planted").channels.length, 7);
  assert.equal(MotionSupportChannels.select("right", "authored").channels.length, 6);
  assert.ok(MotionSupportChannels.select("left", "planted").preserved.length > 0);
  assert.throws((): MotionSupportChannels.Selection => MotionSupportChannels.select("both" as MotionAction.Side, "planted"));
  assert.throws((): MotionSupportChannels.Selection => MotionSupportChannels.select("left", "automatic" as MotionSupportChannels.Policy));
}

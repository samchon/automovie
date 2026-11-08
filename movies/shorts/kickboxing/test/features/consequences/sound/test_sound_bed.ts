import assert from "node:assert/strict";

import { SoundBed } from "../../../../src/consequences/sound/SoundBed";
import { SoundCues } from "../../../../src/consequences/sound/SoundCues";
import { soundSchedule } from "./internal/soundSchedule";

/**
 * The crowd bed continues through the recording, ducks under every word
 * and roars for the knockout and the celebration.
 *
 * Scenarios, on the hand-placed schedule of `soundSchedule`: the segments
 * run from 0 to the film's end, each starting where the last ends or one
 * crossfade earlier, and the read wraps at each end of the recording
 * without a crossfade; each reads the recording from its film
 * second modulo the recording's length and never past its end; every
 * segment under a word, and the half second before it, is ducked; the count
 * from "One!" through the decision stays ducked as one span; the bed roars
 * while B falls and after he lands and through A's celebration, and holds
 * the murmur elsewhere; a duck wins over a roar.
 */
export function test_sound_bed(): void {
  const duration: number = 80;
  const cues = SoundCues.of("seed", soundSchedule(), [], duration);
  const bed = cues.filter((c) => c.asset === SoundCues.BED);
  let t: number = 0;
  for (const s of bed) {
    const lap: number = t - s.seconds;
    assert.ok(Math.abs(lap) < 1e-9 || Math.abs(lap - SoundBed.CROSSFADE) < 1e-9, `${s.seconds}`);
    assert.ok(Math.abs(s.offsetSeconds - (s.seconds % SoundBed.LENGTH)) < 1e-9);
    assert.ok(s.offsetSeconds + s.durationSeconds <= SoundBed.LENGTH + 1e-9);
    t = s.seconds + s.durationSeconds;
  }
  assert.ok(Math.abs(t - duration) < 1e-9);
  // The read wraps at 24 and 48 and 72 without a crossfade into its start.
  for (const wrap of [24, 48, 72])
    assert.ok(bed.some((s) => Math.abs(s.seconds + s.durationSeconds - wrap) < 1e-9));
  const at = (seconds: number): number =>
    bed.filter((s) => s.seconds <= seconds + 1e-9).at(-1)!.gain;
  const ducked: number = SoundBed.GAIN * SoundBed.DUCK;
  for (const w of cues.filter(SoundCues.spoken)) {
    for (const s of bed)
      if (s.seconds < w.seconds + w.durationSeconds && s.seconds + s.durationSeconds - SoundBed.CROSSFADE > w.seconds - SoundBed.LEAD)
        assert.equal(s.gain, ducked, `${w.asset} at ${w.seconds}`);
  }
  // From the duck's lead before "One!" to the decision's end, in 50 ms steps.
  for (let k: number = 0; 57.5 + k * 0.05 < 69.65 - 1e-6; k++)
    assert.equal(at(57.5 + k * 0.05), ducked, `${57.5 + k * 0.05}`);
  assert.equal(at(30), SoundBed.GAIN);
  assert.equal(at(51), SoundBed.GAIN * SoundBed.RISE);
  assert.equal(at(53.5), ducked);
  assert.equal(at(55), SoundBed.GAIN);
  assert.equal(at(75), SoundBed.GAIN * SoundBed.RISE);
  assert.ok(ducked < SoundBed.GAIN && SoundBed.GAIN < SoundBed.GAIN * SoundBed.RISE);
  assert.deepEqual(SoundBed.ducks([[2, 2.5], [1, 1.5], [10, 11]]), [
    [0.5, 2.5],
    [9.5, 11],
  ]);
}

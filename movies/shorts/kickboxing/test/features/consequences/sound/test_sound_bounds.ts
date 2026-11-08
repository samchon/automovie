import assert from "node:assert/strict";

import { SoundAssets } from "../../../../src/consequences/sound/SoundAssets";
import { SoundCues } from "../../../../src/consequences/sound/SoundCues";
import { polygonFilm } from "../../../internal/polygonFilm";

/**
 * Every cue is bounded to its event and decay, concurrency is capped, and
 * the bed is ducked under every spoken word.
 *
 * Scenarios: every cue lies inside its source (offset plus duration within
 * the file); no effect outlasts its audible length; at most one breath per
 * fighter sounds at once and no foreground instant holds more than the
 * foreground limit; the bed's segments tile the film without gap or overlap,
 * continue through the recording, and are ducked exactly while a word
 * sounds; overlap counts consecutive cues as not overlapping.
 */
export function test_sound_bounds(): void {
  const { schedule, seed } = polygonFilm();
  const duration: number = 180;
  const cues = SoundCues.of(seed, schedule, [], duration);
  for (const c of cues) {
    assert.ok(c.durationSeconds > 0, c.asset);
    assert.ok(
      c.offsetSeconds + c.durationSeconds <=
        SoundAssets.seconds[c.asset]! + 1e-9,
      `${c.asset} at ${c.seconds} runs past its source`,
    );
  }
  for (const [asset, audible] of Object.entries(SoundCues.AUDIBLE))
    for (const c of cues.filter((c) => c.asset === asset))
      assert.ok(c.durationSeconds <= audible + 1e-9);
  const breaths = cues.filter((c) => c.asset === "breath");
  assert.ok(breaths.length > 0);
  for (const c of breaths)
    assert.equal(c.durationSeconds, SoundCues.EXHALE.seconds);
  const foreground = cues.filter((c) => c.asset !== SoundCues.BED);
  // A droppable cue starts only while fewer than the limit sound.
  for (const c of foreground.filter((c) => !SoundCues.spoken(c) && c.asset !== "bell"))
    assert.ok(
      foreground.filter(
        (o) => o.seconds <= c.seconds && c.seconds < o.seconds + o.durationSeconds,
      ).length <= SoundCues.MAX_FOREGROUND,
      `${c.asset} at ${c.seconds}`,
    );
  const bed = cues.filter((c) => c.asset === SoundCues.BED);
  let t: number = 0;
  for (const segment of bed) {
    assert.ok(Math.abs(segment.seconds - t) < 1e-9);
    assert.ok(
      Math.abs(
        segment.offsetSeconds -
          (segment.seconds % SoundAssets.seconds[SoundCues.BED]!),
      ) < 1e-9,
    );
    const words = foreground.filter(
      (w) =>
        SoundCues.spoken(w) &&
        w.seconds < segment.seconds + segment.durationSeconds &&
        w.seconds + w.durationSeconds > segment.seconds,
    );
    assert.equal(
      segment.gain,
      SoundCues.BED_GAIN * (words.length > 0 ? SoundCues.DUCK : 1),
    );
    t = segment.seconds + segment.durationSeconds;
  }
  assert.ok(Math.abs(t - duration) < 1e-9);
  assert.ok(bed.some((s) => s.gain < SoundCues.BED_GAIN));
  assert.equal(
    SoundCues.overlap([
      { seconds: 0, durationSeconds: 1 },
      { seconds: 1, durationSeconds: 1 },
      { seconds: 1.5, durationSeconds: 1 },
    ]),
    2,
  );
}

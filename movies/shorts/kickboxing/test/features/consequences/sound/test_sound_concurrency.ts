import assert from "node:assert/strict";

import { SoundConcurrency } from "../../../../src/consequences/sound/SoundConcurrency";

/**
 * The cap keeps sources, sounds and the foreground within their limits.
 *
 * Scenarios: a source's second instance is dropped while its first sounds
 * and kept once it ends; a third impact at once is dropped while two other
 * impact takes sound; a fifth droppable cue is dropped while four sound; a
 * word and the bell are kept beyond every limit; earlier cues win; overlap
 * counts the most cues at one instant and consecutive cues as not
 * overlapping.
 */
export function test_sound_concurrency(): void {
  const cue = (asset: string, seconds: number, rank: number, source?: string) => ({
    asset,
    seconds,
    durationSeconds: 0.3,
    rank,
    ...(source === undefined ? {} : { source }),
  });
  const steps = SoundConcurrency.cap([
    cue("step", 0, 4, "step/a"),
    cue("step", 0.1, 4, "step/a"),
    cue("step", 0.1, 4, "step/b"),
    cue("step", 0.3, 4, "step/a"),
  ]);
  assert.deepEqual(
    steps.map((c) => `${c.source}@${c.seconds}`),
    ["step/a@0", "step/b@0.1", "step/a@0.3"],
  );
  const impacts = SoundConcurrency.cap([
    cue("punch1", 1, 1),
    cue("punch4", 1.01, 1),
    cue("punch2", 1.02, 1),
  ]);
  assert.deepEqual(impacts.map((c) => c.asset), ["punch1", "punch4"]);
  const crowded = SoundConcurrency.cap([
    cue("punch1", 2, 1),
    cue("fall", 2, 1),
    cue("air", 2, 3, "air/a"),
    cue("breath", 2, 2, "breath/a"),
    cue("step", 2.05, 4, "step/a"),
    cue("count1", 2.1, 0),
    cue("bell", 2.1, 0),
  ]);
  assert.deepEqual(
    crowded.map((c) => c.asset).sort((x, y) => x.localeCompare(y)),
    ["air", "bell", "breath", "count1", "fall", "punch1"],
  );
  assert.equal(SoundConcurrency.overlap(crowded), 6);
  assert.equal(
    SoundConcurrency.overlap([
      { seconds: 0, durationSeconds: 1 },
      { seconds: 1, durationSeconds: 1 },
      { seconds: 1.5, durationSeconds: 1 },
    ]),
    2,
  );
  assert.equal(SoundConcurrency.sound("punch3"), "impact");
}

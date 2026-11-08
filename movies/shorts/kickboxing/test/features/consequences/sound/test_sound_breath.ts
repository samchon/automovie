import assert from "node:assert/strict";

import { SoundBreath } from "../../../../src/consequences/sound/SoundBreath";
import { SoundCues } from "../../../../src/consequences/sound/SoundCues";
import { soundSchedule } from "./internal/soundSchedule";

/**
 * Breath is heard only where the story motivates it.
 *
 * Scenarios, on the hand-placed schedule of `soundSchedule`: A's
 * three-strike combination earns one exhale at its last strike's end and
 * B's two-strike one none; B breathes when he lands and every laboured
 * period while he lies, except where a breath would cover a word, so none
 * sounds through the count; A breathes at the excited period through his
 * celebration once the decision has been spoken; in the cues no fighter
 * breathes twice at once, and no breath overlaps a word.
 */
export function test_sound_breath(): void {
  const schedule = soundSchedule();
  const cues = SoundCues.of("seed", schedule, [], 80);
  const words: [number, number][] = cues
    .filter(SoundCues.spoken)
    .map((c) => [c.seconds, c.seconds + c.durationSeconds]);
  const breaths = SoundBreath.of(schedule, words);
  const of = (subject: string) => breaths.filter((b) => b.subject === subject);
  assert.deepEqual(
    of("a").filter((b) => b.seconds < 50).map((b) => [b.seconds, b.gain]),
    [[11.5, SoundBreath.EXERTION_GAIN]],
  );
  assert.deepEqual(
    of("b").map((b) => b.seconds),
    [51.6, 52, 54.5, 57],
  );
  assert.ok(of("b").every((b) => b.gain === SoundBreath.KNOCKDOWN_GAIN));
  const victory = of("a").filter((b) => b.seconds > 60);
  assert.ok(victory.every((b) => b.seconds >= 69.65 && b.gain === SoundBreath.VICTORY_GAIN));
  assert.ok(victory.some((b) => Math.abs(b.seconds - 70.1) < 1e-9));
  for (const b of breaths)
    assert.ok(!words.some(([s, e]) => b.seconds < e && b.seconds + SoundBreath.EXHALE.seconds > s));
  const heard = cues.filter((c) => c.asset === "breath");
  assert.ok(heard.length < breaths.length);
  for (const [k, c] of heard.entries())
    for (const o of heard.slice(k + 1))
      if (o.seconds < c.seconds + c.durationSeconds) {
        const subject = (x: { seconds: number }) =>
          breaths.find((b) => Math.abs(b.seconds - x.seconds) < 1e-9)!.subject;
        assert.notEqual(subject(o), subject(c), `${c.seconds} and ${o.seconds}`);
      }
}

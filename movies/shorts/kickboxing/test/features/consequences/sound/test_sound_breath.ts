import type { IAutoMovieSchedule } from "@automovie/engine";
import assert from "node:assert/strict";

import { SoundBreath } from "../../../../src/consequences/sound/SoundBreath";
import { SoundCues } from "../../../../src/consequences/sound/SoundCues";
import { KickboxingAction } from "../../../../src/laws/kickboxing/KickboxingAction";
import { OfficiatingAction } from "../../../../src/laws/officiating/OfficiatingAction";
import { soundSchedule } from "./internal/soundSchedule";

/**
 * Breath is heard only where a thrown strike or the story motivates it.
 *
 * Scenarios, on the hand-placed schedule of `soundSchedule`: every thrown
 * strike carries one strike-hiss excerpt at the hiss gain, its peak on the
 * contact, and the feint none; A's three-strike combination adds one exhale
 * at its last strike's end and B's two-strike one none; B breathes when he
 * lands and every laboured period while he lies, except where a breath would
 * cover a word, so none sounds through the count; A breathes at the excited
 * period through his celebration once the decision has been spoken; in the
 * cues no fighter breathes twice at once, and no breath overlaps a word.
 *
 * On a three-entry schedule: two of A's strikes whose hisses overlap sound
 * one hiss, B's strike hiss at the same instant still sounds, and a strike
 * thrown while the referee speaks has no hiss.
 */
export function test_sound_breath(): void {
  const schedule = soundSchedule();
  const cues = SoundCues.of("seed", schedule, [], 80);
  const words: [number, number][] = cues
    .filter(SoundCues.spoken)
    .map((c) => [c.seconds, c.seconds + c.durationSeconds]);
  const breaths = SoundBreath.of(schedule, words);
  const of = (subject: string) => breaths.filter((b) => b.subject === subject);
  const row = (b: SoundBreath.IBreath): [number, number, number] => [
    Math.round(b.seconds * 1e6) / 1e6,
    b.gain,
    b.offset,
  ];
  const hiss = SoundBreath.STRIKE_GAIN;
  const at = SoundBreath.STRIKE.offset;
  assert.deepEqual(of("a").filter((b) => b.seconds < 50).map(row), [
    [10.1, hiss, at],
    [10.55, hiss, at],
    [11.1, hiss, at],
    [11.5, SoundBreath.EXERTION_GAIN, SoundBreath.EXHALE.offset],
  ]);
  assert.deepEqual(of("b").filter((b) => b.seconds < 50).map(row), [
    [20.1, hiss, at],
    [20.5, hiss, at],
  ]);
  for (const b of breaths.filter((x) => x.offset === at))
    assert.equal(b.duration, SoundBreath.STRIKE.seconds);
  assert.deepEqual(
    of("b").filter((b) => b.seconds > 50).map((b) => b.seconds),
    [51.6, 52, 54.5, 57],
  );
  assert.ok(of("b").filter((b) => b.seconds > 50).every((b) => b.gain === SoundBreath.KNOCKDOWN_GAIN));
  const victory = of("a").filter((b) => b.seconds > 60);
  assert.ok(victory.every((b) => b.seconds >= 69.65 && b.gain === SoundBreath.VICTORY_GAIN));
  assert.ok(victory.some((b) => Math.abs(b.seconds - 70.1) < 1e-9));
  for (const b of breaths)
    assert.ok(!words.some(([s, e]) => b.seconds < e && b.seconds + b.duration > s));
  const heard = cues.filter((c) => c.asset === "breath");
  assert.ok(heard.length < breaths.length);
  for (const [k, c] of heard.entries())
    for (const o of heard.slice(k + 1))
      if (o.seconds < c.seconds + c.durationSeconds) {
        const subject = (x: { seconds: number }) =>
          breaths.find((b) => Math.abs(b.seconds - x.seconds) < 1e-9)!.subject;
        assert.notEqual(subject(o), subject(c), `${c.seconds} and ${o.seconds}`);
      }

  const tight: IAutoMovieSchedule = {
    duration: 10,
    entries: [
      [KickboxingAction.intent("a", { kind: "strike", technique: "jab" }), 1, 1.2, 1.2],
      [KickboxingAction.intent("b", { kind: "strike", technique: "jab" }), 1, 1.2, 1.2],
      [KickboxingAction.intent("a", { kind: "strike", technique: "cross" }), 1.2, 1.3, 1.3],
      [OfficiatingAction.intent("referee", { kind: "signal", signal: "fight", seconds: 1, words: "Fight!" }), 4, 5, undefined],
      [KickboxingAction.intent("a", { kind: "strike", technique: "jab" }), 4, 4.3, 4.3],
    ].map(([intent, start, end, contact], index) => ({
      index,
      subject: (intent as { subject: string }).subject,
      intent: intent as IAutoMovieSchedule.IEntry["intent"],
      start: start as number,
      end: end as number,
      ...(contact === undefined ? {} : { contact: contact as number }),
    })),
  };
  const hisses = SoundCues.of("seed", tight, [], 10).filter((c) => c.asset === "breath");
  assert.deepEqual(
    hisses.map((c) => Math.round(c.seconds * 1e6) / 1e6),
    [1.1, 1.1],
  );
}

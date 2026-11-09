import assert from "node:assert/strict";

import { SoundAssets } from "../../../../src/consequences/sound/SoundAssets";
import { SoundBreath } from "../../../../src/consequences/sound/SoundBreath";
import { SoundConcurrency } from "../../../../src/consequences/sound/SoundConcurrency";
import { SoundCues } from "../../../../src/consequences/sound/SoundCues";
import type { ContactReceipts } from "../../../../src/interactions/kickboxing/ContactReceipts";
import { soundSchedule } from "./internal/soundSchedule";

/**
 * Every cue is bounded to its event and decay, inside its source and the
 * film, and the one-shots respect their voice limits.
 *
 * Scenarios, on the hand-placed schedule of `soundSchedule`: every cue has a
 * positive duration, starts inside the film and ends by its end; no cue
 * reads past its asset (offset plus duration within the file); every
 * one-shot lasts at most its measured audible length and every breath is
 * the exhale or the strike-hiss excerpt; at no instant does a source sound twice or a sound
 * more than its limit, and a droppable cue starts only while fewer than
 * the foreground limit sound; the measured film overlap stays at most the
 * foreground limit plus the never-dropped words and bell; a film cut short
 * clips its last cues and drops those past its end.
 */
export function test_sound_bounds(): void {
  const schedule = soundSchedule();
  const receipts: ContactReceipts.IReceipt[] = [10.2, 10.65, 11.2, 11.21, 11.22].map(
    (seconds, k): ContactReceipts.IReceipt => ({
      anchor: `x/${k}`,
      striker: "a",
      receiver: "b",
      region: "ribs-left",
      outcome: k % 2 ? "blocked" : "landed",
      technique: "body-kick",
      seconds,
      separation: -0.01,
      contact: true,
    }),
  );
  const duration: number = 80;
  const cues = SoundCues.of("seed", schedule, receipts, duration);
  for (const c of cues) {
    assert.ok(c.durationSeconds > 0, c.asset);
    assert.ok(c.seconds >= 0 && c.seconds + c.durationSeconds <= duration + 1e-9);
    assert.ok(
      c.offsetSeconds + c.durationSeconds <= SoundAssets.seconds[c.asset]! + 1e-9,
      `${c.asset} at ${c.seconds} runs past its source`,
    );
    if (c.asset === "breath")
      assert.ok(
        [SoundBreath.EXHALE, SoundBreath.STRIKE].some(
          (x) => c.offsetSeconds === x.offset && c.durationSeconds === x.seconds,
        ),
        `breath at ${c.seconds} is not a measured excerpt`,
      ); else if (c.asset !== SoundCues.BED)
      assert.ok(c.durationSeconds <= SoundAssets.audible[c.asset]! + 1e-9, c.asset);
  }
  const foreground = cues.filter((c) => c.asset !== SoundCues.BED);
  const sounding = (t: number) =>
    foreground.filter((o) => o.seconds <= t && t < o.seconds + o.durationSeconds);
  for (const c of foreground) {
    const now = sounding(c.seconds);
    for (const [sound, limit] of Object.entries(SoundConcurrency.LIMITS))
      assert.ok(
        now.filter((o) => SoundConcurrency.sound(o.asset) === sound).length <= limit,
        `${sound} at ${c.seconds}`,
      );
    if (!SoundCues.spoken(c) && c.asset !== "bell")
      assert.ok(now.length <= SoundConcurrency.MAX_FOREGROUND, `${c.asset} at ${c.seconds}`);
  }
  // Three impacts within 20 ms: only two sound together.
  assert.equal(
    foreground.filter((c) => c.asset.startsWith("punch") && c.seconds > 11).length,
    2,
  );
  assert.ok(SoundCues.overlap(foreground) <= SoundConcurrency.MAX_FOREGROUND + 2);
  const short = SoundCues.of("seed", schedule, receipts, 70.3);
  const bell = short.find((c) => c.asset === "bell" && c.seconds > 70)!;
  assert.ok(Math.abs(bell.durationSeconds - 0.2) < 1e-9);
  assert.ok(short.every((c) => c.seconds < 70.3));
}

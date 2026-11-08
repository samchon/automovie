import assert from "node:assert/strict";

import { SoundCues } from "../../../../src/consequences/sound/SoundCues";
import type { ContactReceipts } from "../../../../src/interactions/kickboxing/ContactReceipts";
import { KickboxingAction } from "../../../../src/laws/kickboxing/KickboxingAction";
import { OfficiatingAction } from "../../../../src/laws/officiating/OfficiatingAction";
import { polygonFilm } from "../../../internal/polygonFilm";

/**
 * Every cue starts within one frame of the event it sounds.
 *
 * Scenarios, at the film's 30 fps (docs/body/settings/sound/ring-sound.md):
 * each bell cue at a ring of the bell (0 and 170.1); each spoken command at
 * the start of the signal that speaks it, the count's "One!" to "Ten!" at
 * 158 to 167; each impact at its measured contact, itself within one frame
 * of the strike's scheduled contact; each footfall at a step's landing;
 * each canvas landing inside the fall; each breath at a strike's launch;
 * each rush of air at an evaded strike's contact; no cue without its event.
 */
export function test_cue_alignment(): void {
  const { schedule, seed } = polygonFilm();
  const frame = 1 / 30;
  const finish = schedule.entries.find((e) => e.intent.anchor === "s10-b04/3")!;
  const receipts: ContactReceipts.IReceipt[] = [
    {
      anchor: "s10-b04/3",
      striker: "a",
      receiver: "b",
      region: "jaw-neck-left",
      outcome: "landed",
      technique: "brazilian-kick",
      seconds: finish.contact! + frame,
      separation: -0.004,
      contact: true,
    },
  ];
  const cues = SoundCues.of(seed, schedule, receipts, 180).filter((c) => c.asset !== SoundCues.BED);
  const events: Record<string, number[]> = {};
  const add = (kind: string, seconds: number): void => {
    (events[kind] ??= []).push(seconds);
  };
  for (const e of schedule.entries) {
    if (e.intent.capability === "ring") add("bell", e.start);
    else if (e.intent.capability === "signal") {
      const words = OfficiatingAction.read(e.intent).words;
      if (words !== undefined) add(`words:${words}`, e.start);
    } else if (e.intent.capability === "strike") add("breath", e.start);
    else if (e.intent.capability === "answer" && e.outcome === "evaded")
      add("air", e.contact!);
    else if (e.intent.capability === "move") {
      const action = KickboxingAction.read(e.intent);
      if (action.kind === "move")
        for (let k = 1; k <= action.steps; k++)
          add("step", e.start + (k * (e.end - e.start)) / action.steps);
    } else if (e.intent.capability === "phase") {
      const action = KickboxingAction.read(e.intent);
      if (action.kind === "phase" && action.phase === "fall")
        for (let t = e.start; t <= e.end + 1e-9; t += frame) add("fall", t);
    }
  }
  for (const r of receipts) add("impact", r.seconds);
  const kind = (asset: string): string => {
    if (asset.startsWith("punch")) return "impact";
    if (asset.startsWith("count"))
      return `words:${["One!", "Two!", "Three!", "Four!", "Five!", "Six!", "Seven!", "Eight!", "Nine!", "Ten!"][Number(asset.slice(5)) - 1]}`;
    const spoken: Record<string, string> = {
      fight: "words:Fight!",
      down: "words:Down!",
      neutral: "words:Neutral corner!",
      decision: "words:Knockout! Red wins!",
    };
    return spoken[asset] ?? asset;
  };
  let worst = 0;
  for (const cue of cues) {
    const candidates = events[kind(cue.asset)];
    assert.ok(candidates, `no event sounds ${cue.asset}`);
    const off = Math.min(...candidates.map((t) => Math.abs(t - cue.seconds)));
    worst = Math.max(worst, off);
    assert.ok(off <= frame + 1e-9, `${cue.asset} ${off} s off its event`);
  }
  for (const [k, words] of [
    "One!",
    "Two!",
    "Three!",
    "Four!",
    "Five!",
    "Six!",
    "Seven!",
    "Eight!",
    "Nine!",
    "Ten!",
  ].entries())
    assert.ok(
      cues.some(
        (c) =>
          kind(c.asset) === `words:${words}` &&
          Math.abs(c.seconds - (158 + k)) < 1e-9,
      ),
      `${words} at ${158 + k}`,
    );
  assert.ok(
    cues.some((c) => c.asset === "bell" && Math.abs(c.seconds - 170.1) < 1e-9),
  );
  assert.ok(
    Math.abs(
      cues.find((c) => c.asset.startsWith("punch"))!.seconds - finish.contact!,
    ) <=
      frame + 1e-9,
  );
  assert.ok(worst <= frame + 1e-9);
}

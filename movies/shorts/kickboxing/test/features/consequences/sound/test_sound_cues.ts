import assert from "node:assert/strict";

import { ImpactMarks } from "../../../../src/consequences/effects/ImpactMarks";
import { SoundCues } from "../../../../src/consequences/sound/SoundCues";
import type { ContactReceipts } from "../../../../src/interactions/kickboxing/ContactReceipts";
import { polygonFilm } from "../../../internal/polygonFilm";

/**
 * Sound and marks follow only what actually happened, and seeds vary takes
 * but never outcome classes or timing.
 *
 * Scenarios: an impact sounds for a measured contact and not for a decided
 * contact the bodies did not make, nor for any feint; the bell rings at 0 and
 * 170.1 and the count's words map to their recordings; two film seeds give
 * the same cue times, gains and asset classes; a landed receipt marks its
 * region from its second on and persists, a blocked one marks nothing.
 */
export function test_sound_cues(): void {
  const { schedule } = polygonFilm();
  const receipt = (
    anchor: string,
    outcome: string,
    contact: boolean,
    seconds: number,
  ): ContactReceipts.IReceipt => ({
    anchor,
    striker: "a",
    receiver: "b",
    region: "ribs-left",
    outcome,
    technique: "body-kick",
    seconds,
    separation: contact ? -0.01 : 0.05,
    contact,
  });
  const receipts = [
    receipt("x/0", "landed", true, 61),
    receipt("x/1", "blocked", true, 70),
    receipt("x/2", "landed", false, 80),
  ];
  const cues = SoundCues.of("seed-one", schedule, receipts, 180);
  const impacts = cues.filter((c) => c.asset.startsWith("punch"));
  assert.deepEqual(
    impacts.map((c) => c.seconds),
    [61, 70],
  );
  assert.deepEqual(
    cues
      .filter((c) => c.asset === "bell")
      .map((c) => Math.round(c.seconds * 10) / 10),
    [0, 170.1],
  );
  assert.ok(
    cues.some((c) => c.asset === "count10" && Math.abs(c.seconds - 167) < 1e-9),
  );
  const other = SoundCues.of("seed-two", schedule, receipts, 180);
  const classes = (list: SoundCues.ICue[]): string[] =>
    list
      .map((c) => `${c.seconds}:${c.gain}:${c.asset.replace(/\d$/, "")}`)
      .sort((x, y) => x.localeCompare(y));
  assert.deepEqual(classes(other), classes(cues));
  assert.deepEqual(ImpactMarks.at(receipts, "b", 60), {});
  assert.ok(ImpactMarks.at(receipts, "b", 90)["ribs-left"]! > 0);
  assert.equal(
    ImpactMarks.at(receipts, "b", 90)["ribs-left"],
    ImpactMarks.at(receipts, "b", 179)["ribs-left"],
  );
  assert.deepEqual(
    ImpactMarks.at([receipt("y", "blocked", true, 1)], "b", 10),
    {},
  );
}

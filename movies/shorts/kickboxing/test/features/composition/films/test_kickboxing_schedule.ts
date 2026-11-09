import type { IAutoMovieSchedule } from "@automovie/engine";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { composeKickboxing } from "../../../../src/composition/films/composeKickboxing";
import { BoutLaws } from "../../../../src/interactions/kickboxing/BoutLaws";
import { KickboxingAction } from "../../../../src/laws/kickboxing/KickboxingAction";
import { KickboxingTechnique } from "../../../../src/laws/kickboxing/KickboxingTechnique";
import { OfficiatingAction } from "../../../../src/laws/officiating/OfficiatingAction";
import { polygonCast } from "../../../internal/polygonCast";
import { polygonFilm } from "../../../internal/polygonFilm";

/**
 * The resolved film keeps the screenplay's anchors, outcomes and habits and
 * is legal and deterministic.
 *
 * Scenarios: no legality violation; every answer's outcome is one the table
 * permits (never illegal); the scene boundaries fall every fifteen seconds
 * to 150; the Brazilian kick's contact is 150.000 and it lands over the
 * elbow-block read; B falls from 150.000; the count's numbers land at
 * 158.000 to 167.000; the knockout signal at 167.600, the victory at 168.100
 * and the match-ending bell at 170.100; B drops his left arm to every rising
 * right knee of A after the first landed body kick, but for his one
 * high-guard adjustment, under which the body kick lands, and never before
 * it; no fighter performs two movements or whole-body phases at once, and
 * the standing fighter reaches the neutral corner before the count; resolving the same composition
 * with the same seed twice gives the same entries.
 */
export function test_kickboxing_schedule(): void {
  const { schedule, seed } = polygonFilm();
  assert.deepEqual(BoutLaws.check(schedule), []);
  assert.ok(!schedule.entries.some((e) => e.outcome === "illegal"));
  const near = (a: number | undefined, b: number): void =>
    assert.ok(a !== undefined && Math.abs(a - b) < 1e-9, `${a} != ${b}`);
  const anchored = (id: string): IAutoMovieSchedule.IEntry =>
    schedule.entries.find((e) => e.intent.anchor === id)!;
  for (let scene = 2; scene <= 10; scene++) {
    const first = schedule.entries.find((e) =>
      e.intent.anchor?.startsWith(`s${String(scene).padStart(2, "0")}-`),
    );
    assert.ok(
      first !== undefined &&
        first.start >= (scene - 1) * 15 - 1e-9 &&
        first.start < scene * 15,
      `scene ${scene}`,
    );
  }
  near(anchored("s10-b04/3").contact, 150);
  const finishAnswer = schedule.entries.find((e) => {
    const action =
      e.intent.capability === "answer" ? KickboxingAction.read(e.intent) : null;
    return action?.kind === "answer" && action.strike === "s10-b04/3";
  })!;
  assert.equal(finishAnswer.outcome, "landed");
  const fall = schedule.entries.find(
    (e) =>
      e.intent.capability === "phase" &&
      (KickboxingAction.read(e.intent) as { phase?: string }).phase === "fall",
  )!;
  near(fall.start, 150);
  const spoken = (words: string): number | undefined =>
    schedule.entries.find(
      (e) =>
        e.intent.capability === "signal" &&
        OfficiatingAction.read(e.intent).words === words,
    )?.start;
  [
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
  ].forEach((w, k) => near(spoken(w), 158 + k));
  near(spoken("Knockout! Red wins!"), 167.6);
  near(
    schedule.entries.find(
      (e) =>
        e.intent.capability === "phase" &&
        (KickboxingAction.read(e.intent) as { phase?: string }).phase ===
          "victory",
    )?.start,
    168.1,
  );
  const bells = schedule.entries
    .filter((e) => e.intent.capability === "ring")
    .map((e) => e.start);
  near(bells[0], 0);
  near(bells[1], 170.1);
  // B's tell: after A's first landed body kick, every rising right knee draws the elbow block.
  const answers = schedule.entries.filter(
    (e) => e.subject === "b" && e.intent.capability === "answer",
  );
  const knee = (action: KickboxingAction.IAction): boolean =>
    action.kind === "answer" &&
    ["body-kick", "feint-body-kick", "brazilian-kick"].includes(action.against);
  const learned: number = answers.find(
    (e) =>
      knee(KickboxingAction.read(e.intent)) &&
      e.outcome === "landed" &&
      (KickboxingAction.read(e.intent) as { against: string }).against ===
        "body-kick",
  )!.start;
  // Once, burned by the cross over the lowered arm, B keeps his guard high
  // instead, and the body kick lands under it.
  const adjusted: IAutoMovieSchedule.IEntry[] = [];
  for (const e of answers) {
    const action = KickboxingAction.read(e.intent);
    if (!knee(action) || e.start <= learned) continue;
    if ((action as { answer: string }).answer === "high-block") {
      adjusted.push(e);
      continue;
    }
    assert.equal(
      (action as { answer: string }).answer,
      "elbow-block",
      `tell at ${e.start}`,
    );
  }
  assert.equal(adjusted.length, 1, "B's one high-guard adjustment");
  assert.equal(adjusted[0]!.outcome, "landed");
  // No fighter performs two movements or whole-body phases at once.
  for (const subject of ["a", "b"]) {
    const body = schedule.entries
      .filter(
        (e) =>
          e.subject === subject &&
          (e.intent.capability === "move" || e.intent.capability === "phase"),
      )
      .sort((p, q) => p.start - q.start);
    for (let k = 1; k < body.length; k++)
      assert.ok(
        body[k]!.start >= body[k - 1]!.end - 1e-9,
        `${subject}'s ${body[k - 1]!.intent.capability} and ${body[k]!.intent.capability} overlap at ${body[k]!.start}`,
      );
  }
  // The standing fighter reaches the neutral corner before the count starts.
  const corner = schedule.entries.find(
    (e) =>
      e.intent.capability === "move" &&
      (KickboxingAction.read(e.intent) as { movement?: string }).movement ===
        "corner",
  )!;
  const firstCount = schedule.entries.find(
    (e) =>
      e.intent.capability === "signal" &&
      OfficiatingAction.read(e.intent).signal === "count",
  )!;
  assert.ok(
    corner.end <= firstCount.start + 1e-9,
    `corner reached at ${corner.end}, count from ${firstCount.start}`,
  );
  assert.ok(
    !answers.some((e) => {
      const action = KickboxingAction.read(e.intent);
      return (
        knee(action) &&
        e.start < learned &&
        (action as { answer: string }).answer === "elbow-block"
      );
    }),
  );
  assert.ok(Object.values(KickboxingTechnique.table).length > 0);
  const cast = polygonCast();
  const hash = (s: IAutoMovieSchedule): string =>
    createHash("sha256").update(JSON.stringify(s)).digest("hex");
  assert.equal(
    hash(BoutLaws.resolve(cast, composeKickboxing(cast, 180), seed)),
    hash(schedule),
  );
}

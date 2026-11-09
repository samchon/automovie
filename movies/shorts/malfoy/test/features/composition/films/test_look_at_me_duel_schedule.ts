import type { IAutoMovieSchedule } from "@automovie/engine";
import assert from "node:assert/strict";

import { composeLookAtMeDuel } from "../../../../src/composition/films/composeLookAtMeDuel";
import { CourtStage } from "../../../../src/composition/scenes/look-at-me-duel/CourtStage";
import { StageEffects } from "../../../../src/consequences/effects/StageEffects";
import { SpellTrack } from "../../../../src/interactions/duelling/SpellTrack";
import { MasonryTrack } from "../../../../src/interactions/physics/MasonryTrack";
import type { IStageWorld } from "../../../../src/interactions/staging/IStageWorld";
import { StageAction } from "../../../../src/laws/staging/StageAction";

/**
 * Resolves the whole `look-at-me-duel` composition on the court stage and
 * checks it against the screenplay's anchors and outcomes.
 *
 * Scenarios: the four scenes start at 0, 15, 27 and 36 s in screenplay
 * order and the film fills exactly 60 s; every dialogue line is spoken by
 * its speaker, in screenplay order, at its anchor; Harry's first grip closes
 * after Carina's run-in ends and opens 0.8??.2 s into her underarm turn
 * (the duel study's escape window); Harry's sweeps meet the jinxes at 12.750
 * and 29.550 and the high jinx releases at 29.250; in the rescue Carina's
 * palm meets his forearm before his grip closes there and the guide and the
 * guided steps start together at 31.500; Harry stands inside the support's
 * danger region before the strike and outside it when the cap reaches head
 * height, and the library's clearance audit finds nobody inside; the duel
 * law's outcome table deflects both jinxes and blocks the disarm; Harry lets
 * go of her forearm only after her line about the grab; and the same
 * composition resolves to identical entries twice.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the library's schedule resolver and performance index on the film's real composition and asserts the resolved times, speakers, order and positions.
 * @evidence contracts/development/testing.md#independent-expectations Expected seconds and lines are the screenplay's anchors; the escape window is the duel study's 0.8??.2 s; the danger test is the court's settings region; the body radius is Harry's settings half-shoulder width.
 * @evidence contracts/development/testing.md#distinguishing-cases Harry inside the danger region before the strike and outside after the guide; grip before and after the parry; release before and after the line.
 * @evidence contracts/development/testing.md#execution-ownership In-memory resolution without a browser, renderer or GPU; capture and playback are review.
 * @evidence contracts/development/common.md#meaningful-documentation States every scenario and the behaviour it pins.
 */
export function test_look_at_me_duel_schedule(): void {
  const stage: CourtStage = new CourtStage();
  const { court, carina, harry } = stage.cast;
  const { schedule, performance } = stage.resolve(composeLookAtMeDuel(stage.cast));
  const near = (actual: number | undefined, expected: number, label: string): void =>
    assert.ok(actual !== undefined && Math.abs(actual - expected) < 1e-6, `${label}: ${actual} != ${expected}`);
  const of = (subject: string, kind: StageAction.Kind): IAutoMovieSchedule.IEntry[] =>
    schedule.entries.filter((e) => e.subject === subject && e.intent.capability === kind).sort((a, b) => a.start - b.start);
  // An entry's own motion begins after the lead that holds the performer until its anchored second.
  const begins = (e: IAutoMovieSchedule.IEntry): number => e.start + (e.state as IStageWorld.IStudentStep).lead;

  // Scenes in order at their anchors, filling 60 s.
  ["s01", "s02", "s03", "s04"].forEach((id, k) =>
    near(schedule.entries.find((e) => e.intent.anchor === `scene:${id}`)?.end, [0, 15, 27, 36][k]!, `scene ${id}`),
  );
  near(Math.max(...schedule.entries.map((e) => e.end)), 60, "film end");

  // Every line, by its speaker, in order, at its anchor.
  const lines = schedule.entries
    .filter((e) => e.intent.capability === "say")
    .map((e) => {
      const action = StageAction.read(e.intent) as Extract<StageAction.Action, { kind: "say" }>;
      return { who: e.subject, words: action.words, at: begins(e) };
    })
    .sort((a, b) => a.at - b.at);
  // A null second is a line the screenplay places by its action, not by an anchor.
  const expected: [string, string, number | null][] = [
    [carina.id, "Wand up, Potter.", 1.5],
    [harry.id, "After you.", 2.8],
    [carina.id, "Look at me, Potter. Not the wand.", 6.2],
    [harry.id, "The wand's the dangerous part.", 8.1],
    [carina.id, "Flipendo!", 11.9],
    [harry.id, "Expelliarmus!", 13.5],
    [carina.id, "Protego!", 13.96],
    [harry.id, "That's new.", 18.7],
    [carina.id, "Stop grabbing, Potter.", 19.9],
    [harry.id, "Stop getting so close.", 21.4],
    [carina.id, "Flipendo!", 28.8],
    [carina.id, "Potter!", 30.23],
    [carina.id, "Protego!", null],
    [harry.id, "You all right?", 38.7],
    [carina.id, "You grabbed again.", 39.5],
    [harry.id, "You got close again.", 41.6],
    [carina.id, "This time, look at me.", 50.8],
    [harry.id, "I am.", 53.4],
  ];
  assert.equal(lines.length, expected.length);
  expected.forEach(([who, words, at], k) => {
    assert.equal(lines[k]!.who, who, words);
    assert.equal(lines[k]!.words, words);
    if (at !== null) near(lines[k]!.at, at, words);
  });

  // The first grip: closes after the run-in, opens 0.8??.2 s into the turn.
  const run = of(carina.id, "run")[0]!;
  const grip = of(harry.id, "grip")[0]!;
  const turn = of(carina.id, "turnUnder")[0]!;
  const letGo = of(harry.id, "letGo")[0]!;
  near(grip.contact, 16.55, "first grip");
  assert.ok(run.end <= grip.contact! + 1e-9, "the grip closes once she has arrived");
  near(letGo.contact, 17.5, "first release");
  const escape: number = letGo.contact! - begins(turn);
  assert.ok(escape >= 0.8 - 1e-9 && escape <= 1.2 + 1e-9, `release ${escape} s into the turn`);

  // The shots and their deflections.
  near(of(harry.id, "deflect")[0]?.contact, 12.75, "low sweep");
  near(of(carina.id, "cast").find((e) => e.start > 27)?.contact, 29.29, "high jinx");
  near(of(harry.id, "deflect")[1]?.contact, 29.59, "upward sweep");

  // The rescue: the palm first, then his grip on her forearm; guide and guided step together.
  const parry = of(carina.id, "parry")[0]!;
  const second = of(harry.id, "grip")[1]!;
  near(parry.contact, 31.22, "palm on forearm");
  near(second.contact, 31.27, "grip on forearm");
  assert.ok(parry.contact! < second.contact!, "her palm turns the reach before it closes");
  const guides = schedule.entries.filter((e) => e.intent.capability === "guide");
  assert.equal(guides.length, 2);
  near(begins(guides[0]!), 31.37, "guide");
  near(begins(guides[1]!), 31.37, "guided");

  // The crack: the deflected jinx strikes the cracked fillet and the cap fails at the
  // screenplay's 30.000, within one 24 fps frame.
  const resolved = stage.resolve(composeLookAtMeDuel(stage.cast));
  const spells = SpellTrack.resolve(resolved.world, resolved.schedule);
  const masonry = MasonryTrack.resolve(court, resolved.schedule, spells, CourtStage.SEED, stage.cast.cap.id);
  assert.ok(Math.abs(masonry.struck - 30) <= 1 / 24, `the crack at ${masonry.struck} s`);

  // Clearance: under the cap before the strike, outside the danger region when the cap
  // reaches head height (the strike + the slowest tipping 1.5 s + 0.45 s of fall, the
  // masonry study's values), and the library's clearance audit finds nobody inside.
  const radius: number = harry.measure.shoulderHalfWidth;
  assert.ok(court.inDanger(performance.position(harry.id, 29.0)!, radius), "under the cap before the strike");
  const headHeight: number = masonry.struck + 1.5 + 0.45;
  const clear = performance.position(harry.id, headHeight)!;
  assert.ok(!court.inDanger(clear, radius), `Harry clear at ${headHeight} s: ${JSON.stringify(clear)}`);
  const findings: string[] = StageEffects.duel({ cap: stage.cast.cap, seed: CourtStage.SEED })(resolved).flatMap((e) => e.findings ?? []);
  assert.deepEqual(findings, []);

  // The outcome table: both of Carina's jinxes are deflected (the second is what strikes
  // the fillet), the disarming charm is blocked by her shield.
  const impacts = spells.impacts;
  const jinxes = impacts.filter((i) => i.spell === "jinx").sort((a, b) => a.at - b.at);
  assert.deepEqual(
    jinxes.map((i) => i.outcome),
    ["deflected", "deflected"],
  );
  assert.deepEqual(
    impacts.filter((i) => i.spell === "disarm").map((i) => i.outcome),
    ["blocked"],
  );

  // He lets go only after her line about the grab.
  const grabbed = lines.find((l) => l.words === "You grabbed again.")!;
  assert.ok(of(harry.id, "letGo")[1]!.contact! > grabbed.at, "release after her look and line");

  // Determinism.
  const again = new CourtStage();
  assert.equal(JSON.stringify(again.resolve(composeLookAtMeDuel(again.cast)).schedule), JSON.stringify(schedule));
}

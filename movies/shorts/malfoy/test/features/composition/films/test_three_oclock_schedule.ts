import type { IAutoMovieSchedule } from "@automovie/engine";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { composeThreeOclock } from "../../../../src/composition/films/composeThreeOclock";
import { threeOclock } from "../../../../src/composition/films/threeOclock";
import { CourtyardStage } from "../../../../src/composition/scenes/three-oclock/CourtyardStage";
import { StageMount } from "../../../../src/interactions/staging/StageMount";

/**
 * The resolved `three-oclock` film keeps the screenplay's scene order,
 * anchors, outcomes and the note's ownership, and is deterministic.
 *
 * Scenarios: the film is 60 s at 24 fps on 720 × 1280; the scene markers
 * fall at 0, 24.9 and 50.7 s in screenplay order; every beat's anchored action
 * starts its motion at the second the screenplay states, and the handover's
 * grip and release land on 49.7 and 50.1 s; Harry is off the stage during
 * the first two tries and on it when she speaks at 23.1 s; Carina's first
 * offer to Harry in scene
 * 2 is withdrawn and her second is not; the note is in Carina's hand before
 * the drop, on the paving between the drop and the pick-up, in her hand
 * again before the handover and in Harry's hand after it to the end; every
 * line of dialogue the screenplay writes is spoken once, in order;
 * resolving the same composition twice gives the same entries.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves the film's composition through the stage laws and the prop track and asserts the resolved schedule, ownership and presence.
 * @evidence contracts/development/testing.md#independent-expectations Every second, line and ownership state is the screenplay's (docs/body/screenplay/three-oclock.md), and the delivery profile is the commission's; none is read from the code.
 * @evidence contracts/development/testing.md#distinguishing-cases The first offer withdrawn against the second completed; the note owned, resting and transferred; Harry absent before his entrance and present after it.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory resolution through `npm test`, with no mount, browser or GPU; the capture command owns pictures.
 * @evidence contracts/development/common.md#meaningful-documentation States every scenario and the behavior it pins.
 */
export function test_three_oclock_schedule(): void {
  const film = threeOclock();
  assert.equal(film.durationSeconds, 60);
  assert.equal(film.fps, 24);
  assert.equal(film.width, 720);
  assert.equal(film.height, 1280);

  const stage: CourtyardStage = new CourtyardStage();
  const resolve = () =>
    StageMount.resolve({
      ...stage.world(),
      composition: composeThreeOclock(stage.cast),
    });
  const { schedule, props, performance } = resolve();
  const near = (actual: number | undefined, expected: number, what: string): void =>
    assert.ok(
      actual !== undefined && Math.abs(actual - expected) < 1e-6,
      `${what}: ${actual} != ${expected}`,
    );

  // Scene markers in screenplay order.
  const scene = (id: string): number | undefined =>
    schedule.entries.find((e) => e.intent.anchor === `scene:${id}`)?.end;
  near(scene("s01"), 0, "s01");
  near(scene("s02"), 24.9, "s02");
  near(scene("s03"), 50.7, "s03");
  const last: number = Math.max(...schedule.entries.map((e) => e.end));
  near(last, 60, "the film's end");

  // Each beat's anchored action starts its own motion on the screenplay's
  // second: an entry waits out its lead before its own motion begins.
  const begins = (e: IAutoMovieSchedule.IEntry): number =>
    e.start + ((e.state as { lead?: number } | undefined)?.lead ?? 0);
  const motion = (anchor: string): number | undefined => {
    const e: IAutoMovieSchedule.IEntry | undefined = schedule.entries.find(
      (x) => x.intent.anchor === anchor,
    );
    return e === undefined ? undefined : begins(e);
  };
  const anchors: Record<string, number> = {
    "s01-b01": 0,
    "s01-b02": 6.3,
    "s01-b03": 18,
    "s02-b01": 24.9,
    "s02-b02": 27.9,
    "s02-b03": 33,
    "s02-b04": 37.4,
    "s02-b05": 41.2,
    "s02-b06": 45,
    "s03-b01": 50.7,
    "s03-b02": 54.5,
  };
  for (const [anchor, seconds] of Object.entries(anchors))
    near(motion(anchor), seconds, anchor);

  // The handover's grip and release anchors.
  const contactOf = (subject: string, kind: string): number | undefined =>
    schedule.entries.find(
      (e) =>
        e.subject === subject &&
        (e.intent.parameters?.action as { kind?: string } | undefined)?.kind === kind,
    )?.contact;
  near(contactOf("harry", "receive"), 49.7, "Harry's grip");
  near(contactOf("carina", "release"), 50.1, "Carina's release");

  // Harry is nowhere during the first two tries (the gap "has been empty so
  // far") and stands in the recess when she speaks at 23.1 s.
  assert.equal(performance.position("harry", 17.2), undefined);
  assert.ok(performance.position("harry", 23.1) !== undefined);

  // The first offer to Harry in scene 2 is withdrawn by habit; the second completes.
  const offers = schedule.entries.filter((e) => {
    const action = e.intent.parameters?.action as { kind?: string; to?: { subject?: string } } | undefined;
    return e.subject === "carina" && action?.kind === "offer" && action.to?.subject === "harry";
  });
  assert.equal(offers.length, 2);
  assert.equal(offers[0]!.outcome, "withdrawn");
  assert.notEqual(offers[1]!.outcome, "withdrawn");

  // The note's owner over the film.
  for (const t of [0, 10, 20, 28, 32.5])
    assert.equal(props.owner("note", t), "carina", `owner at ${t}`);
  for (const t of [36, 38.5, 42, 45.5])
    assert.equal(props.owner("note", t), null, `owner at ${t}`);
  assert.equal(props.owner("note", 47.5), "carina", "owner after the pick-up");
  for (const t of [50.2, 52, 56, 59.9])
    assert.equal(props.owner("note", t), "harry", `owner at ${t}`);

  // Every line, once and in order of when it is spoken.
  const lines: string[] = schedule.entries
    .filter((e) => e.intent.capability === "say")
    .sort((a, b) => begins(a) - begins(b))
    .map((e) => (e.intent.parameters?.action as { words: string }).words);
  assert.deepEqual(lines, [
    "Potter—",
    "Saturday. Three o'clock. If you're free.",
    "...Please.",
    "I just want you to come.",
    "Come where?",
    "Nowhere.",
    "No hurry.",
    "You dropped something.",
    "Did I.",
    "Sorry.",
    "Saturday. Three o'clock.",
    "Courtyard.",
    "This one?",
    "This one.",
  ]);

  // Determinism.
  const hash = (s: IAutoMovieSchedule): string =>
    createHash("sha256").update(JSON.stringify(s)).digest("hex");
  assert.equal(hash(resolve().schedule), hash(schedule));
}

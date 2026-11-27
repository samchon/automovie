import { AutoMovieMotionHumanPerformance } from "@automovie/motions";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

import { openMotionTake } from "../../src/executable/motionTake/openMotionTake";
import { draw } from "./draw";
import {
  assertObserved,
  cues,
  observe,
  playbackOrder,
  sampleTimes,
} from "./observe";
import { createMotionTakeSource, fixture } from "./source";

/**
 * Create an uninterrupted reference, then save while the ball is still in
 * flight.
 */
async function save(): Promise<void> {
  const recipe: ReturnType<typeof createMotionTakeSource> =
    createMotionTakeSource();
  const uninterrupted: AutoMovieMotionHumanPerformance = new AutoMovieMotionHumanPerformance(
    recipe.human["staged-catch"]!,
  );
  const reference: ReturnType<typeof observe>[] = sampleTimes.map(
    (seconds: number): ReturnType<typeof observe> =>
      observe(uninterrupted, seconds),
  );
  const anchor: ReturnType<typeof observe> = reference[1]!;
  assert.deepEqual(anchor.feet, [0, 1], "both stance feet are active at save");
  assert.equal(anchor.grip, true, "the emitter has an active parcel grip");
  assertObserved(
    anchor.parcelInHand,
    reference[0]!.parcelInHand,
    "carrier-local grip offset",
  );
  assertObserved(
    reference[2]!.parcel.z - reference[0]!.parcel.z,
    0.12 * (sampleTimes[2]! - sampleTimes[0]!),
    "the gripped parcel moves with the standing carrier",
  );
  assertObserved(
    anchor.ball.position.z,
    0.5,
    "ball in flight at the retimed boundary",
  );
  assertObserved(anchor.hinge, 15, "door hinge travel at save");
  assertObserved(
    anchor.door.position.z,
    0.06,
    "mounted door carrier translation at save",
  );
  assert.notDeepEqual(
    anchor.doorPull,
    reference[0]!.doorPull,
    "the articulated socket is moving",
  );
  const events: ReturnType<typeof cues> = cues(uninterrupted);
  const images: string[] = await draw(null);
  const { take, replay } = await openMotionTake({
    root: process.cwd(),
    source: fixture.source,
    artifact: fixture.artifact,
    create: { mode: "save", outputSeconds: fixture.seconds, side: "after" },
  });
  assert.deepEqual(
    take.provenance.seeds.find(({ id }) => id === "door"),
    {
      id: "door",
      value: String(fixture.doorSeed),
    },
  );
  assert.deepEqual(
    take.provenance.providers.find(({ id }) => id === "door-articulation"),
    { id: "door-articulation", version: "1" },
  );
  for (const index of playbackOrder) {
    const seconds: number = sampleTimes[index]!;
    assertObserved(
      observe(replay.performanceAt(seconds), seconds),
      reference[index],
      `saved at ${seconds}`,
    );
  }
  await writeFile(
    fixture.reference,
    JSON.stringify({
      samples: reference,
      events,
      images,
      artifact: await readFile(fixture.artifact, "utf8"),
    }),
  );
}

await save();

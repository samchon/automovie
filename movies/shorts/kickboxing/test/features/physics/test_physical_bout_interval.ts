import assert from "node:assert/strict";

import { FilmTransport } from "../../../src/runtime/FilmTransport";
import { readFilmReviewInterval } from "../../../src/runtime/readFilmReviewInterval";
import type { MovieAudio } from "../../../src/sound/MovieAudio";

/** Bounded real-host review starts at its actual archive offset and refuses out-of-range UI, capture and playback requests without falsifying the displayed timestamp. */
export async function test_physical_bout_interval(): Promise<void> {
  const available: readonly [number, number] = [149, 152];
  const selected: ReturnType<typeof readFilmReviewInterval> =
    readFilmReviewInterval(new URLSearchParams("review=1"), available);
  assert.deepEqual(selected, { start: 149, end: 152, speed: 1 });
  assert.deepEqual(readFilmReviewInterval(new URLSearchParams(), [0, 180]), {
    start: 0,
    end: 180,
    speed: 1,
  });
  for (const query of [
    "start=0",
    "end=180",
    "start=150&end=149",
    "start=",
    "end=NaN",
  ])
    assert.throws(
      (): ReturnType<typeof readFilmReviewInterval> =>
        readFilmReviewInterval(new URLSearchParams(query), available),
    );
  const placed: number[] = [];
  const audible: number[] = [];
  const audio: Pick<MovieAudio, "play" | "pause" | "diagnostics"> = {
    play: async (seconds: number): Promise<void> => {
      audible.push(seconds);
    },
    pause: (): void => {},
    diagnostics: (): ReturnType<MovieAudio["diagnostics"]> => ({
      state: "playing",
      contextState: "pure-capability",
      error: null,
      active: true,
      listeningStatus: "not-native-audio",
      manifest: null,
    }),
  };
  const clock: FilmTransport = new FilmTransport(
    audio,
    (seconds: number): void => {
      if (seconds < available[0] || seconds > available[1])
        throw new Error("Producer received an unavailable second");
      placed.push(seconds);
    },
    available,
  );
  assert.equal(clock.seconds, 149);
  clock.setInterval(selected.start, selected.end);
  clock.seek(150);
  for (const seconds of [0, 148.999, 152.001, 180])
    assert.throws((): void => clock.seek(seconds), /inside \[149,152\]/);
  assert.equal(clock.seconds, 150);
  assert.deepEqual(placed, [149, 150]);
  assert.throws((): void => clock.setInterval(0, 180));
  assert.deepEqual(clock.interval, [149, 152]);
  await clock.play();
  assert.deepEqual(audible, [150]);
  clock.pause();
  clock.seek(152);
  await clock.play();
  assert.equal(clock.seconds, 149);
  assert.deepEqual(audible, [150, 149]);
  clock.pause();
}

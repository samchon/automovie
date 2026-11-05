import assert from "node:assert/strict";

import type { MovieAudio } from "../../../src/audio/MovieAudio";
import { FilmTransport } from "../../../src/film/FilmTransport";

/**
 * Exercise successful-clock publication, atomic refusal and asynchronous cancellation.
 *
 * Scenarios:
 * 1. An exact successful placement commits only after the original producer returns.
 * 2. Invalid ranges/rates and failed placement preserve the old time and interval.
 * 3. Idle tick does not evaluate; a fractional review start never advances backwards.
 * 4. Pause during pending native start prevents a late Promise from restarting playback.
 * 5. Freeze releases at most once and never changes the committed time.
 *
 * @evidence contracts/testing.md#observable-behavior Uses the actual FilmTransport with a caller-owned pure audio capability and deterministic placement callback, observing committed time, intervals, cancellation and evaluator calls. No foreign method, global clock, process, browser or native audio device is replaced.
 * @evidence contracts/testing.md#independent-cases Exact boundary seconds0/180, invalid nonfinite/range/rate inputs and a producer that refuses42 distinguish successful publication from attempted placement. A caller-controlled Promise supplies cancellation order independently of wall-clock delay. Actual native audio and rendering are separate consumer inspection obligations.
 */
export async function test_film_transport(): Promise<void> {
  const placed: number[] = [];
  const observed: number[] = [];
  let nativeState: string = "paused";
  let pending: Promise<void> = Promise.resolve();
  const audio: Pick<MovieAudio, "play" | "pause" | "diagnostics"> = {
    play: async (_seconds: number, _speed: number): Promise<void> => {
      nativeState = "playing";
      await pending;
    },
    pause: (): void => {
      nativeState = "paused";
    },
    diagnostics: (): ReturnType<MovieAudio["diagnostics"]> => ({
      state: nativeState,
      contextState: "pure-capability",
      error: null,
      active: nativeState === "playing",
      listeningStatus: "not-native-audio",
      manifest: null,
    }),
  };
  const clock: FilmTransport = new FilmTransport(
    audio,
    (seconds: number): void => {
      observed.push(clock.seconds);
      if (seconds === 42) throw new Error("Actual producer refusal");
      placed.push(seconds);
    },
  );
  clock.seek(12.345);
  assert.equal(clock.seconds, 12.345);
  assert.deepEqual(placed, [12.345]);
  assert.equal(observed[0], 0);
  assert.throws((): void => clock.seek(42));
  assert.equal(clock.seconds, 12.345);
  assert.match(clock.error!, /producer refusal/);
  const before: number = placed.length;
  assert.equal(clock.tick(), false);
  assert.equal(placed.length, before);
  for (const seconds of [-1, 180.1, NaN, Infinity])
    assert.throws((): void => clock.seek(seconds));
  for (const speed of [0, 0.1, 2, NaN, Infinity])
    assert.throws((): void => {
      clock.speed = speed;
    });
  assert.equal(clock.speed, 1);
  clock.setInterval(0.123, 0.5);
  assert.deepEqual(clock.interval, [0.123, 0.5]);
  assert.equal(clock.seconds, 0.123);
  assert.throws((): void => clock.setInterval(42, 50));
  assert.deepEqual(clock.interval, [0.123, 0.5]);
  assert.equal(clock.seconds, 0.123);
  for (const bounds of [
    [0, 0],
    [-1, 2],
    [0, 181],
    [Infinity, 2],
  ])
    assert.throws((): void => clock.setInterval(bounds[0]!, bounds[1]!));
  await clock.play();
  assert.equal(clock.playing, true);
  clock.tick();
  assert.ok(clock.seconds >= 0.123);
  clock.pause();
  let release: (() => void) | undefined;
  pending = new Promise<void>((resolve: () => void): void => {
    release = resolve;
  });
  const starting: Promise<void> = clock.play();
  clock.pause();
  release!();
  await starting;
  assert.equal(clock.playing, false);
  assert.equal(nativeState, "paused");
  const releaseFreeze: (resume: boolean) => void = clock.freeze();
  const frozen: number = clock.seconds;
  releaseFreeze(false);
  releaseFreeze(true);
  assert.equal(clock.playing, false);
  assert.equal(clock.seconds, frozen);
  clock.seek(180);
  assert.equal(clock.seconds, 180);
  assert.equal(placed.at(-1), 180);
}

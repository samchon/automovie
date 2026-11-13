import { AutoMovieInspectorPlayhead } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * The inspector's playhead is an external store whose snapshot changes identity only when a member changes, keeps its second within the subject, plays at its rate and stops at the end.
 *
 * Scenarios:
 *
 * 1. Before a duration is set, play does nothing; after `setDuration(2)` a seek past either end lands on 0 or 2, and a seek that does not move keeps the snapshot object and notifies no listener.
 * 2. Playing at rate 0.5, one wall second advances half a subject second; a negative or non-finite wall time moves nothing; a paused playhead does not move.
 * 3. Advancing past the end stops at the duration and pauses; play from the end restarts at zero.
 * 4. A listener hears each change until it unsubscribes, and a duration, rate or second that is not a positive (or finite) number is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Drives the public playhead and reads its snapshots and listener calls.
 * @evidence contracts/development/testing.md#independent-expectations Expected seconds are the products of the stated rate and wall times and the clamps of the stated range, worked out in the test.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a moving against a still change, both ends of the range, playing against paused, a valid against a negative and non-finite wall time, the end against the middle, and accepted against refused values.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_inspector_playhead`; no React is rendered. The loop that advances it belongs to `test_inspector_mount_lifecycle`.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming its input and the behaviour it pins.
 */
export function test_inspector_playhead(): void {
  const playhead: AutoMovieInspectorPlayhead = new AutoMovieInspectorPlayhead();
  let heard: number = 0;
  const unsubscribe: () => void = playhead.subscribe((): void => {
    ++heard;
  });

  // 1. Duration, clamps and identity.
  playhead.play();
  TestValidator.equals(
    "play before a duration does nothing",
    playhead.getSnapshot().playing,
    false,
  );
  playhead.setDuration(2);
  playhead.seek(5);
  TestValidator.equals(
    "a seek past the end lands on it",
    playhead.getSnapshot().seconds,
    2,
  );
  playhead.seek(-1);
  TestValidator.equals(
    "a seek before zero lands on zero",
    playhead.getSnapshot().seconds,
    0,
  );
  const still: AutoMovieInspectorPlayhead.ISnapshot = playhead.getSnapshot();
  const before: number = heard;
  playhead.seek(0);
  playhead.pause();
  TestValidator.predicate(
    "a change that moves nothing keeps the snapshot",
    playhead.getSnapshot() === still && heard === before,
  );

  // 2. Rate and wall time.
  playhead.setRate(0.5);
  playhead.advance(1);
  TestValidator.equals(
    "a paused playhead does not move",
    playhead.getSnapshot().seconds,
    0,
  );
  playhead.play();
  playhead.advance(1);
  TestValidator.equals(
    "one wall second at half rate",
    playhead.getSnapshot().seconds,
    0.5,
  );
  playhead.advance(-1);
  playhead.advance(Number.NaN);
  TestValidator.equals(
    "negative and NaN wall time move nothing",
    playhead.getSnapshot().seconds,
    0.5,
  );

  // 3. The end.
  playhead.advance(10);
  TestValidator.equals(
    "the end stops and pauses",
    [playhead.getSnapshot().seconds, playhead.getSnapshot().playing],
    [2, false],
  );
  playhead.play();
  TestValidator.equals(
    "play from the end restarts",
    [playhead.getSnapshot().seconds, playhead.getSnapshot().playing],
    [0, true],
  );

  // 4. Listeners and refusals.
  const counted: number = heard;
  playhead.pause();
  TestValidator.equals("a listener hears a change", heard, counted + 1);
  unsubscribe();
  playhead.seek(1);
  TestValidator.equals(
    "an unsubscribed listener hears nothing",
    heard,
    counted + 1,
  );
  for (const [name, call] of [
    ["duration 0", (): void => playhead.setDuration(0)],
    ["rate -1", (): void => playhead.setRate(-1)],
    ["rate Infinity", (): void => playhead.setRate(Number.POSITIVE_INFINITY)],
    ["second NaN", (): void => playhead.seek(Number.NaN)],
  ] as const)
    TestValidator.error(`${name} is refused`, call);
}

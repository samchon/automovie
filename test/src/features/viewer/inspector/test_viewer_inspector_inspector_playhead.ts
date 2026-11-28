import { AutoMovieViewerInspectorPlayhead } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * The inspector's playhead is an external store whose snapshot changes identity
 * only when a member changes, keeps its second within the subject, plays at its
 * rate and stops at the end.
 *
 * Scenarios:
 *
 * 1. Before a duration is set, play does nothing; after `setDuration(2)` a seek
 *    past either end lands on 0 or 2, and a seek that does not move keeps the
 *    snapshot object and notifies no listener.
 * 2. Playing at rate 0.5, one wall second advances half a subject second; a
 *    negative wall time moves nothing; a paused playhead does not move. The two
 *    moving seeks counted as jumps and playing did not.
 * 3. Advancing past the end stops at the duration and pauses; play from the end
 *    restarts at zero as a third jump.
 * 4. A listener hears each change until it unsubscribes, and a duration or rate
 *    that is not positive is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes progress, clamping, rate, endpoint restart and subscribers.
 * @evidence contracts/development/testing.md#behavioral-verification Drives the public playhead with literal wall time and seek commands, then checks state identity, notifications and jump semantics.
 * @evidence contracts/development/testing.md#independent-expectations One wall second at half speed advances half a film second. Literal zero and duration are the clamps, and an unchanged snapshot or negative tick has no elapsed motion.
 */
export function test_viewer_inspector_inspector_playhead(): void {
  const playhead: AutoMovieViewerInspectorPlayhead = new AutoMovieViewerInspectorPlayhead();
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
  const still: AutoMovieViewerInspectorPlayhead.ISnapshot = playhead.getSnapshot();
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
  TestValidator.equals(
    "negative wall time moves nothing",
    playhead.getSnapshot().seconds,
    0.5,
  );
  TestValidator.equals(
    "the two moving seeks are jumps and playing is not",
    playhead.getSnapshot().jump,
    2,
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
    "play from the end restarts with a jump",
    [
      playhead.getSnapshot().seconds,
      playhead.getSnapshot().playing,
      playhead.getSnapshot().jump,
    ],
    [0, true, 3],
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
  ] as const)
    TestValidator.error(`${name} is refused`, call);
}

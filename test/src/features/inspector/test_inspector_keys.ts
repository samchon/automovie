import {
  AutoMovieInspectorPlayhead,
  handleAutoMovieInspectorKey,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * The inspector's playback keys move the playhead as a video player's do and hand back the second a seek leaves it on.
 *
 * Scenarios:
 *
 * 1. Space starts a stopped playhead and stops a playing one, and K does the same; neither hands back a second.
 * 2. On a 4 s film at 0.5 s, L seeks to 1.5 s and J back to 0.5 s; at 0.2 s J lands on 0, and at 3.6 s L lands on 4, each handing back that second.
 * 3. At 24 frames a second, full stop steps one frame forward and comma one back, pausing a playing playhead; with no frame rate known they step a twenty-fourth of a second.
 * 4. Home goes to 0 and End to 4; a letter the inspector does not use is not handled and moves nothing.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Drives the public key handler on a public playhead and reads the playhead's snapshot and the handler's result.
 * @evidence contracts/development/testing.md#independent-expectations Each expected second is the starting second plus or minus the step the key names, clamped to the film, worked out in the test.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts playing against stopped, seeks inside against seeks past either end, a known frame rate against none, and used against unused keys.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_inspector_keys`; no React is rendered and no DOM event is made.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming its input and the behaviour it pins.
 */
export function test_inspector_keys(): void {
  const playhead: AutoMovieInspectorPlayhead = new AutoMovieInspectorPlayhead();
  playhead.setDuration(4);
  const near = (title: string, actual: number | null, expected: number): void =>
    TestValidator.predicate(
      `${title}: ${actual} is ${expected}`,
      actual !== null && Math.abs(actual - expected) < 1e-9,
    );

  // 1. Play and pause.
  for (const key of [" ", "k"]) {
    TestValidator.equals(
      `${JSON.stringify(key)} starts and hands back no second`,
      handleAutoMovieInspectorKey(key, playhead, 24),
      { handled: true, seconds: null },
    );
    TestValidator.equals(`${JSON.stringify(key)} plays`, playhead.getSnapshot().playing, true);
    handleAutoMovieInspectorKey(key, playhead, 24);
    TestValidator.equals(`${JSON.stringify(key)} stops`, playhead.getSnapshot().playing, false);
  }

  // 2. A second back and forward, clamped to the film.
  playhead.seek(0.5);
  near("L from 0.5", handleAutoMovieInspectorKey("l", playhead, 24).seconds, 1.5);
  near("J from 1.5", handleAutoMovieInspectorKey("j", playhead, 24).seconds, 0.5);
  playhead.seek(0.2);
  near("J from 0.2", handleAutoMovieInspectorKey("j", playhead, 24).seconds, 0);
  playhead.seek(3.6);
  near("L from 3.6", handleAutoMovieInspectorKey("l", playhead, 24).seconds, 4);

  // 3. Frame steps pause and step one frame.
  playhead.seek(1);
  playhead.play();
  near("full stop from 1", handleAutoMovieInspectorKey(".", playhead, 24).seconds, 1 + 1 / 24);
  TestValidator.equals("a frame step pauses", playhead.getSnapshot().playing, false);
  near("comma back", handleAutoMovieInspectorKey(",", playhead, 24).seconds, 1);
  near("comma without a rate", handleAutoMovieInspectorKey(",", playhead, null).seconds, 1 - 1 / 24);

  // 4. The ends, and an unused key.
  near("Home", handleAutoMovieInspectorKey("Home", playhead, 24).seconds, 0);
  near("End", handleAutoMovieInspectorKey("End", playhead, 24).seconds, 4);
  TestValidator.equals(
    "an unused key is not handled",
    handleAutoMovieInspectorKey("q", playhead, 24),
    { handled: false, seconds: null },
  );
  TestValidator.equals("an unused key moves nothing", playhead.getSnapshot().seconds, 4);
}

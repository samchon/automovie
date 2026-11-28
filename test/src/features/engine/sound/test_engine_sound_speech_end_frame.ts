import { AutoMovieEngineSound } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/**
 * `AutoMovieEngineSound.speechEndFrame` is the first frame whose boundary lies
 * at or after the line's last sample.
 *
 * Clock: 30 fps, 48000 Hz, so one frame is 1600 samples.
 *
 * Scenarios:
 *
 * 1. From frame 0, 48000 samples end at frame 30 and 1 sample at frame 1.
 * 2. From frame 30, 24000 samples end at frame 45.
 * 3. A line of no samples is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the first frame boundary after or at a line's last sample, including later start and empty refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads line endings for one second, one sample and a half-second line beginning at frame 30, then tries an empty line.
 * @evidence contracts/development/testing.md#independent-expectations A 48 kHz sample clock at 30 fps has 1600 samples per frame. The three line cases therefore end at frames 30, 1 and 45.
 */
export function test_engine_sound_speech_end_frame(): void {
  const clock: Parameters<typeof AutoMovieEngineSound.speechEndFrame>[0] = {
    fps: 30,
    sampleRate: 48000,
  };
  TestValidator.equals(
    "one second",
    AutoMovieEngineSound.speechEndFrame(clock, 0, 48000),
    30,
  );
  TestValidator.equals(
    "one sample",
    AutoMovieEngineSound.speechEndFrame(clock, 0, 1),
    1,
  );
  TestValidator.equals(
    "half second later",
    AutoMovieEngineSound.speechEndFrame(clock, 30, 24000),
    45,
  );
  TestValidator.predicate(
    "empty",
    throwsError(() => AutoMovieEngineSound.speechEndFrame(clock, 0, 0)),
  );
}

import { productionSpeechEndFrame } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/**
 * `productionSpeechEndFrame` is the first frame whose boundary lies at or after
 * the line's last sample.
 *
 * Clock: 30 fps, 48000 Hz, so one frame is 1600 samples.
 *
 * Scenarios:
 *
 * 1. From frame 0, 48000 samples end at frame 30 and 1 sample at frame 1.
 * 2. From frame 30, 24000 samples end at frame 45.
 * 3. A line of no samples is refused.
 */
export function test_unit_engine_sound_speech_end_frame(): void {
  const clock = { fps: 30, sampleRate: 48000 } as const;
  TestValidator.equals(
    "one second",
    productionSpeechEndFrame(clock, 0, 48000),
    30,
  );
  TestValidator.equals("one sample", productionSpeechEndFrame(clock, 0, 1), 1);
  TestValidator.equals(
    "half second later",
    productionSpeechEndFrame(clock, 30, 24000),
    45,
  );
  TestValidator.predicate(
    "empty",
    throwsError(() => productionSpeechEndFrame(clock, 0, 0)),
  );
}

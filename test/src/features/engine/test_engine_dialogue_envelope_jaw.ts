import {
  autoMovieDialogueEnvelopeJaw,
  productionDialogueFrameLevels,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * A line without phonemes opens its speaker's jaw from its frame level.
 *
 * Scenarios:
 *
 * 1. A silent frame gives 0 mm.
 * 2. A frame at the full level, −20 dBFS RMS, gives the 12 mm full speech opening,
 *    and a louder frame gives no more.
 * 3. A frame between the floor and the full level gives an opening strictly
 *    between 0 and 12 mm.
 * 4. Frame levels follow the line's own samples per frame interval: at 24 fps and
 *    48 kHz a line of one silent frame and one 1.2 kHz frame at −20 dBFS RMS
 *    reads 0 and 0.1.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the frame levels and the openings they give.
 * @evidence contracts/development/testing.md#behavioral-verification Computes frame levels with `productionDialogueFrameLevels` and openings with `autoMovieDialogueEnvelopeJaw`. A jaw driven by sample peak or by the whole line's level, or one that never closes, fails.
 * @evidence contracts/development/testing.md#independent-expectations −20 dBFS RMS is an amplitude of 0.1, which a sine of peak 0.1 × √2 has over whole cycles; 2000 samples make one frame at 24 fps and 48 kHz and hold exactly 50 cycles at 1.2 kHz; the bounds are the 0 to 12 mm range #4054 asks for within the jaw's 0 to 52.9 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers silence, the floor side, a level between, the full level and above it; lip-sync lag belongs to `test_engine_lip_sync_lag`.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_engine_dialogue_envelope_jaw`; it starts no process.
 */
export function test_engine_dialogue_envelope_jaw(): void {
  const samples: Float32Array = Float32Array.from(
    { length: 4000 },
    (_: unknown, index: number): number =>
      index < 2000
        ? 0
        : 0.1 * Math.SQRT2 * Math.sin((2 * Math.PI * 1200 * index) / 48_000),
  );
  const levels: Float64Array = productionDialogueFrameLevels(
    { fps: 24, sampleRate: 48_000 },
    { startFrame: 10, endFrame: 12 },
    samples,
  );
  TestValidator.predicate(
    "frame levels read each frame's own samples",
    levels.length === 2 &&
      levels[0] === 0 &&
      Math.abs(levels[1]! - 0.1) <= 1e-6,
  );

  const middle: number = autoMovieDialogueEnvelopeJaw(10 ** (-35 / 20));
  TestValidator.predicate(
    "silence closes the jaw, the full level opens it fully, and between lies between",
    autoMovieDialogueEnvelopeJaw(0) === 0 &&
      Math.abs(autoMovieDialogueEnvelopeJaw(levels[1]!) - 12) <= 1e-6 &&
      autoMovieDialogueEnvelopeJaw(0.5) === 12 &&
      middle > 0 &&
      middle < 12,
  );
}

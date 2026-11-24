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
 */
export function test_unit_engine_sound_dialogue_envelope_jaw_cases(): void {
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

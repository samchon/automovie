import { autoMovieDialogueEnvelopeJaw } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `autoMovieDialogueEnvelopeJaw` opens the jaw with the frame level: 0 at
 * silence, rising with level, capped at its full opening.
 *
 * Scenarios:
 *
 * 1. Silence (level 0) and a level far below any audible floor (1e-9, -180 dBFS)
 *    give 0.
 * 2. A full-scale level (1) gives an opening above 0, equal to that of a louder
 *    level (10) because the opening is capped.
 * 3. The opening never falls as the level rises: 0.001, 0.01, 0.1 and 1 are
 *    non-decreasing.
 */
export function test_unit_engine_sound_dialogue_envelope_jaw(): void {
  TestValidator.equals("silence", autoMovieDialogueEnvelopeJaw(0), 0);
  TestValidator.equals("floor", autoMovieDialogueEnvelopeJaw(1e-9), 0);
  const full: number = autoMovieDialogueEnvelopeJaw(1);
  TestValidator.predicate("open", full > 0);
  TestValidator.equals("cap", autoMovieDialogueEnvelopeJaw(10), full);
  const openings: number[] = [0.001, 0.01, 0.1, 1].map(
    autoMovieDialogueEnvelopeJaw,
  );
  TestValidator.predicate(
    "monotone",
    openings.every(
      (value: number, index: number): boolean =>
        index === 0 || value >= openings[index - 1]!,
    ),
  );
}

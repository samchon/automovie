import type { IAutoMovieMotionHumanDanceBeats } from "@automovie/interface";
import { danceGrooveEnvelope } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Four beats half a second apart, the first at 0.5 s. */
const BEATS: Pick<IAutoMovieMotionHumanDanceBeats, "at" | "count"> = {
  count: 4,
  at: (k: number): number => 0.5 * k,
};

/**
 * `danceGrooveEnvelope` rises on a minimum-jerk share to the first beat, is
 * full to the last and falls the same way to the end.
 *
 * Scenarios, beats at 0.5 to 2 s in a dance ending at 3 s:
 *
 * 1. None before the start and at it; half at 0.25 s, the share's middle.
 * 2. Full from the first beat to the last.
 * 3. Half at 2.5 s, half way to the end, and none at the end.
 */
export function test_unit_motions_exercise_dance_groove_envelope(): void {
  TestValidator.predicate(
    "the rise",
    danceGrooveEnvelope(-1, BEATS, 3) === 0 &&
      danceGrooveEnvelope(0, BEATS, 3) === 0 &&
      nclose(danceGrooveEnvelope(0.25, BEATS, 3), 0.5, 1e-12),
  );
  TestValidator.predicate(
    "full",
    danceGrooveEnvelope(0.5, BEATS, 3) === 1 &&
      danceGrooveEnvelope(1.2, BEATS, 3) === 1 &&
      danceGrooveEnvelope(2, BEATS, 3) === 1,
  );
  TestValidator.predicate(
    "the fall",
    nclose(danceGrooveEnvelope(2.5, BEATS, 3), 0.5, 1e-12) &&
      nclose(danceGrooveEnvelope(3, BEATS, 3), 0, 1e-12),
  );
}

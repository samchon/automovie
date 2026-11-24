import { cutSequence } from "@automovie/engine";
import { IAutoMovieShot } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation, namedFacts } from "../../../internal/predicates";

const shot: (id: string, duration: number) => IAutoMovieShot = (
  id: string,
  duration: number,
): IAutoMovieShot => ({
  id,
  name: null,
  scene: "scene-duel",
  camera: "cam-main",
  cameraMotion: null,
  performances: [],
  objectMotions: [],
  duration,
});

/**
 * Assembly computes played spans and runtime from the referenced built shots.
 * Direct callers can supply shot objects, so the ASSEMBLE consumer must not
 * trust non-finite or non-positive shot durations.
 *
 * Scenarios:
 *
 * 1. An untrimmed zero-duration shot refuses at its source duration.
 */
export function test_unit_engine_film_film_cut_sequence_shot_duration_gate(): void {
  const cut: ReturnType<typeof cutSequence> = cutSequence(
    {
      sequence: { id: "seq-bad-shot-duration", name: "bad source shots" },
      fps: 24,
      entries: [
        { shot: "shot:infinite", trim: null, transition: null },
        { shot: "shot:zero", trim: null, transition: null },
        {
          shot: "shot:trimmed-infinite",
          trim: { start: 0, duration: 1 },
          transition: null,
        },
      ],
      pacing: "n/a",
      continuity: "n/a",
    },
    [
      shot("shot:infinite", 1),
      shot("shot:zero", 0),
      shot("shot:trimmed-infinite", 1),
    ],
  );

  TestValidator.equals(
    "invalid source shot durations fail",
    cut.success,
    false,
  );
  TestValidator.equals(
    "non-positive source shot duration rejected",
    namedFacts([
      ["refused", (): boolean => cut.success === false],
      [
        "violated",
        (): boolean =>
          cut.success === false &&
          hasViolation(cut, "range", "$shots[1].duration"),
      ],
    ]),
    { refused: true, violated: true },
  );
}

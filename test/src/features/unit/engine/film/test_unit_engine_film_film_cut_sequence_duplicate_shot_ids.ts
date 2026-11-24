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
 * Assembly joins entries to built shots by id. Duplicate built shot ids make
 * the selected duration/order ambiguous because a map would silently keep one
 * of them.
 *
 * Scenarios:
 *
 * 1. Two supplied shots share shot:beat-1; assembly refuses the duplicate source id at $shots[1].id rather than implicitly choosing either duration.
 */
export function test_unit_engine_film_film_cut_sequence_duplicate_shot_ids(): void {
  const cut: ReturnType<typeof cutSequence> = cutSequence(
    {
      sequence: { id: "seq-duplicate-shot", name: "ambiguous source shots" },
      fps: 24,
      entries: [
        {
          shot: "shot:beat-1",
          trim: { start: 0, duration: 2.5 },
          transition: null,
        },
      ],
      pacing: "n/a",
      continuity: "n/a",
    },
    [shot("shot:beat-1", 1), shot("shot:beat-1", 3)],
  );

  TestValidator.equals("duplicate shot ids fail", cut.success, false);
  TestValidator.equals(
    "duplicate shot id violation",
    namedFacts([
      ["refused", (): boolean => cut.success === false],
      [
        "violated",
        (): boolean =>
          cut.success === false && hasViolation(cut, "type", "$shots[1].id"),
      ],
    ]),
    { refused: true, violated: true },
  );
}

import { cutSequence } from "@automovie/engine";
import { IAutoMovieShot } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation, namedFacts } from "../internal/predicates";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls cutSequence with colliding source shot ids and requires unsuccessful assembly plus a type violation at the duplicate source path, detecting silent map overwrite even if choosing the later three-second shot would admit the trim.
 * @evidence contracts/testing.md#independent-expectations The two literal ids are identical and occupy source indices zero and one, so the second is the duplicate independently of duration arithmetic; the assertion checks kind and path fragment rather than the full explanatory text.
 * @evidence contracts/testing.md#distinguishing-cases Uses one- and three-second duplicate shots with a 2.5-second trim, distinguishing duplicate rejection from an accidental successful last-write winner; unique source reuse belongs to test_film_cut_sequence_valid.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_cut_sequence_duplicate_shot_ids entry owns one portable admission case and calls the engine directly; namedFacts owns no dynamic registration and no process or render host is started.
 */
export function test_film_cut_sequence_duplicate_shot_ids(): void {
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

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
 * Assembly computes played spans and runtime from the referenced built shots.
 * Direct callers can supply shot objects, so the ASSEMBLE consumer must not
 * trust non-finite or non-positive shot durations.
 *
 * Scenarios:
 *
 * 1. An untrimmed infinite-duration shot refuses at its source duration.
 * 2. An untrimmed zero-duration shot refuses at its source duration.
 * 3. An infinite-duration source remains invalid when its entry trims to one finite second.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls cutSequence with three invalid source durations and requires a range finding at each source index, detecting unchecked source metadata and a trim that accidentally hides a nonfinite source duration.
 * @evidence contracts/testing.md#independent-expectations Source durations must be finite and positive before editorial trimming; literal Infinity and zero violate that contract independently of the cut's runtime, and the supplied array positions determine the expected source paths.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts untrimmed Infinity, zero, and trimmed Infinity in one result so all independent faults remain visible; finite positive source shots and invalid trim or transition spans have separate assembly tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_cut_sequence_shot_duration_gate entry owns these three authored source cases in one portable engine call, with shared lazy predicates and no consumer installation or real host.
 */
export function test_film_cut_sequence_shot_duration_gate(): void {
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
      shot("shot:infinite", Number.POSITIVE_INFINITY),
      shot("shot:zero", 0),
      shot("shot:trimmed-infinite", Number.POSITIVE_INFINITY),
    ],
  );

  TestValidator.equals(
    "invalid source shot durations fail",
    cut.success,
    false,
  );
  TestValidator.equals(
    "non-finite source shot duration rejected",
    namedFacts([
      ["refused", (): boolean => cut.success === false],
      [
        "violated",
        (): boolean =>
          cut.success === false &&
          hasViolation(cut, "range", "$shots[0].duration"),
      ],
    ]),
    { refused: true, violated: true },
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
  TestValidator.equals(
    "trimmed non-finite source shot duration rejected",
    namedFacts([
      ["refused", (): boolean => cut.success === false],
      [
        "violated",
        (): boolean =>
          cut.success === false &&
          hasViolation(cut, "range", "$shots[2].duration"),
      ],
    ]),
    { refused: true, violated: true },
  );
}

import { cutSequence } from "@automovie/engine";
import {
  type IAutoMovieConstraintViolation,
  type IAutoMovieEditEntry,
  type IAutoMovieShot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation } from "../internal/predicates";

const SHOT: IAutoMovieShot = {
  id: "shot:beat-1",
  name: null,
  scene: "scene-duel",
  camera: "cam-main",
  cameraMotion: null,
  performances: [],
  objectMotions: [],
  duration: 3,
};

const run: (props: {
  fps?: number;
  entries?: IAutoMovieEditEntry[];
}) => ReturnType<typeof cutSequence> = (props: {
  fps?: number;
  entries?: IAutoMovieEditEntry[];
}): ReturnType<typeof cutSequence> =>
  cutSequence(
    {
      sequence: { id: "seq-finite", name: "finite timing" },
      fps: props.fps ?? 24,
      entries: props.entries ?? [
        { shot: "shot:beat-1", trim: null, transition: null },
      ],
      pacing: "n/a",
      continuity: "n/a",
    },
    [SHOT],
  );

const hasFiniteViolation: (
  cut: ReturnType<typeof run>,
  path: string,
) => boolean = (cut: ReturnType<typeof run>, path: string): boolean =>
  cut.success === false &&
  hasViolation(cut, "range", path) &&
  cut.violations.some(
    (v: IAutoMovieConstraintViolation): boolean =>
      v.kind === "range" &&
      v.path.includes(path) &&
      v.expected.includes("finite"),
  );

/**
 * Pins non-finite timing gates in the ASSEMBLE consumer before they feed
 * runtime arithmetic or sequence emission.
 *
 * Scenarios:
 *
 * 1. `fps: Infinity` yields `range` on `$input.fps`.
 * 2. `trim.start: NaN` yields `range` on `.trim.start`.
 * 3. `trim.duration: Infinity` yields `range` on `.trim.duration`.
 * 4. `transition.duration: Infinity` yields `range` on `.transition.duration`.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls cutSequence separately with four nonfinite timing fields and requires failure plus a range finding naming finite admission at that field, detecting comparisons that accidentally admit NaN or positive Infinity.
 * @evidence contracts/testing.md#independent-expectations Editorial frame rate and time operands must be finite; the literal Infinity and NaN cases violate that premise without needing a derived runtime. Expected paths follow authored field positions and the finite message fragment distinguishes the intended gate from another range refusal.
 * @evidence contracts/testing.md#distinguishing-cases Isolates infinite fps, NaN trim start, infinite trim duration and infinite transition duration; the transition has a preceding entry so first-entry refusal cannot explain the finding. Finite out-of-bounds and nonpositive cases belong to the other cutSequence tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_cut_sequence_non_finite_timing entry owns four direct in-process assembly cases through its private run helper, creating no native artifact, installed consumer or real host.
 */
export function test_film_cut_sequence_non_finite_timing(): void {
  const infiniteFps: ReturnType<typeof run> = run({
    fps: Number.POSITIVE_INFINITY,
  });
  TestValidator.equals("infinite fps fails", infiniteFps.success, false);
  TestValidator.predicate(
    "infinite fps rejected",
    hasFiniteViolation(infiniteFps, "$input.fps"),
  );

  const nanTrimStart: ReturnType<typeof run> = run({
    entries: [
      {
        shot: "shot:beat-1",
        trim: { start: Number.NaN, duration: 1 },
        transition: null,
      },
    ],
  });
  TestValidator.equals(
    "non-finite trim start fails",
    nanTrimStart.success,
    false,
  );
  TestValidator.predicate(
    "non-finite trim start rejected",
    hasFiniteViolation(nanTrimStart, "$input.entries[0].trim.start"),
  );

  const infiniteTrimDuration: ReturnType<typeof run> = run({
    entries: [
      {
        shot: "shot:beat-1",
        trim: { start: 0, duration: Number.POSITIVE_INFINITY },
        transition: null,
      },
    ],
  });
  TestValidator.equals(
    "non-finite trim duration fails",
    infiniteTrimDuration.success,
    false,
  );
  TestValidator.predicate(
    "non-finite trim duration rejected",
    hasFiniteViolation(infiniteTrimDuration, "$input.entries[0].trim.duration"),
  );

  const infiniteTransitionDuration: ReturnType<typeof run> = run({
    entries: [
      { shot: "shot:beat-1", trim: null, transition: null },
      {
        shot: "shot:beat-1",
        trim: null,
        transition: {
          kind: "crossDissolve",
          duration: Number.POSITIVE_INFINITY,
        },
      },
    ],
  });
  TestValidator.equals(
    "non-finite transition duration fails",
    infiniteTransitionDuration.success,
    false,
  );
  TestValidator.predicate(
    "non-finite transition duration rejected",
    hasFiniteViolation(
      infiniteTransitionDuration,
      "$input.entries[1].transition.duration",
    ),
  );
}

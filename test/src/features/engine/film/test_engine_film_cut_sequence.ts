import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieSequenceEntry,
  IAutoMovieShot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation, nclose } from "../../internal/predicates";

/**
 * `cutSequence` assembles entries over built shots into a sequence and its
 * runtime, refusing what cannot be played.
 *
 * Shots are 1 s, 3 s or 4 s long as stated; entries refer to them by id.
 *
 * Scenarios:
 *
 * 1. Three entries over `shot:beat-1` (3 s) and `shot:beat-2` (4 s) - the first
 *    played whole (3 s), the second trimmed to start 0.5 for 2 s, the first
 *    again with a 0.5 s cross-dissolve - succeed; the sequence keeps the id
 *    "seq-duel", 24 fps and the shot order beat-1, beat-2, beat-1; the runtime
 *    is 3 + 2 + 3 - 0.5 = 7.5 s.
 * 2. Two built shots with the same id are refused as a type finding at
 *    `$shots[1].id` rather than choosing either duration.
 * 3. An untrimmed shot of duration 0 is refused as a range finding at
 *    `$shots[1].duration`.
 * 4. A frame rate of 0 with no entries is refused with a range finding at
 *    `$input.fps` and a type finding at `$input.entries`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify the source shots, trim and overlap for the successful cut and the indexed findings for malformed shots and edit plans.
 * @evidence contracts/development/testing.md#behavioral-verification The test calls cutSequence on the authored shot records and observes timeline identity, shot order, rate and runtime. It submits duplicate identities, a zero-duration shot and an empty edit with a zero rate separately.
 * @evidence contracts/development/testing.md#independent-expectations Three authored play lengths of 3, 2 and 3 seconds overlap for 0.5 seconds, giving 7.5 seconds in order. The duplicate and zero durations follow from the supplied records, and the empty zero-fps case owes one finding at each corresponding input field.
 */
export function test_engine_film_cut_sequence(): void {
  const shot = (id: string, duration: number): IAutoMovieShot => ({
    id,
    name: null,
    scene: "scene-duel",
    camera: "cam-main",
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    duration,
  });

  const cut = AutoMovieEngineFilm.cutSequence(
    {
      sequence: { id: "seq-duel", name: "the duel" },
      fps: 24,
      entries: [
        { shot: "shot:beat-1", trim: null, transition: null },
        {
          shot: "shot:beat-2",
          trim: { start: 0.5, duration: 2 },
          transition: null,
        },
        {
          shot: "shot:beat-1",
          trim: null,
          transition: { kind: "crossDissolve", duration: 0.5 },
        },
      ],
      pacing: "hold the charge, snap the strike, breathe on the aftermath.",
      continuity: "the strike ends where the aftermath begins.",
    },
    [shot("shot:beat-1", 3), shot("shot:beat-2", 4)],
  );
  TestValidator.equals("success", cut.success, true);
  if (cut.success === true) {
    TestValidator.equals("sequence id", cut.sequence.id, "seq-duel");
    TestValidator.equals("fps", cut.sequence.fps, 24);
    TestValidator.equals(
      "order",
      cut.sequence.shots.map(
        (entry: IAutoMovieSequenceEntry): string => entry.shot,
      ),
      ["shot:beat-1", "shot:beat-2", "shot:beat-1"],
    );
    TestValidator.predicate("runtime", nclose(cut.runtime, 7.5, 1e-12));
  }

  const duplicate = AutoMovieEngineFilm.cutSequence(
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
  TestValidator.equals("duplicate fails", duplicate.success, false);
  TestValidator.predicate(
    "duplicate id",
    duplicate.success === false &&
      hasViolation(duplicate, "type", "$shots[1].id"),
  );

  const empty = shot("shot:zero", 0);
  const zero = AutoMovieEngineFilm.cutSequence(
    {
      sequence: { id: "seq-bad-shot-duration", name: "bad source shots" },
      fps: 24,
      entries: [
        { shot: "shot:ok", trim: null, transition: null },
        { shot: "shot:zero", trim: null, transition: null },
      ],
      pacing: "n/a",
      continuity: "n/a",
    },
    [shot("shot:ok", 1), empty],
  );
  TestValidator.equals("zero duration fails", zero.success, false);
  TestValidator.predicate(
    "zero duration path",
    zero.success === false && hasViolation(zero, "range", "$shots[1].duration"),
  );

  const nothing = AutoMovieEngineFilm.cutSequence(
    {
      sequence: { id: "seq-empty", name: "nothing" },
      fps: 0,
      entries: [],
      pacing: "n/a",
      continuity: "n/a",
    },
    [],
  );
  TestValidator.equals("empty fails", nothing.success, false);
  TestValidator.predicate(
    "fps",
    nothing.success === false && hasViolation(nothing, "range", "$input.fps"),
  );
  TestValidator.predicate(
    "entries",
    nothing.success === false &&
      hasViolation(nothing, "type", "$input.entries"),
  );
}

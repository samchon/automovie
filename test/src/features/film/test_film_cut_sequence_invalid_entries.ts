import { cutSequence } from "@automovie/engine";
import { type IAutoMovieConstraintViolation, type IAutoMovieShot } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation, namedFacts, nclose } from "../internal/predicates";

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

/**
 * Assembly reports independent entry faults together and refuses transition overlaps that cannot fit their neighbours.
 *
 * Scenarios:
 *
 * 1. A transition on the first entry → `type` (nothing to transition from).
 * 2. An entry referencing the never-performed `shot:ghost` → `type`.
 * 3. A trim of duration 0 → `range` on its `trim.duration`.
 * 4. A trim `[2, 4]` poking 1 s past the 3-second shot → `range` on `trim` with
 *    overshoot 1.
 * 5. A 0-second transition → `range` on its `transition.duration`.
 * 6. A 2-second fade over a 1-second played span → `range` with overshoot 1.
 * 7. A 2-second dissolve out of a 1-second previous entry yields `range` on its
 *    `transition.duration`.
 * 8. Adjacent transitions whose durations overlap inside the middle entry yield
 *    `range` on the second transition's duration.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls cutSequence on malformed entries and two additional overlap edits, requiring field-specific kinds and paths and one-second excesses for trim and incoming-span overflow. These checks catch skipped independent faults, unchecked outgoing spans and nested transition overlap.
 * @evidence contracts/testing.md#independent-expectations The literal three-second source and authored spans determine the expected bounds: trim [2, 4] exceeds by one, and a two-second transition exceeds a one-second played span by one. Adjacent two-second overlaps cannot both fit a three-second middle entry. Scalar excesses use nclose and no product timeline computes the oracle.
 * @evidence contracts/testing.md#distinguishing-cases Owns all eight numbered entry decisions, including a missing shot, zero durations, positive overflows, outgoing-span overflow and overlapping adjacent transitions; valid edits and nonfinite operands have separate assembly tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_cut_sequence_invalid_entries entry owns its three portable cutSequence calls and every literal edit case, observing returned violations without installing a consumer, compiling native code or starting a host.
 */
export function test_film_cut_sequence_invalid_entries(): void {
  const cut: ReturnType<typeof cutSequence> = cutSequence(
    {
      sequence: { id: "seq-bad", name: "the mess" },
      fps: 24,
      entries: [
        {
          shot: "shot:beat-1",
          trim: null,
          transition: { kind: "crossDissolve", duration: 0.5 },
        },
        { shot: "shot:ghost", trim: null, transition: null },
        {
          shot: "shot:beat-1",
          trim: { start: 0, duration: 0 },
          transition: null,
        },
        {
          shot: "shot:beat-1",
          trim: { start: 2, duration: 2 },
          transition: null,
        },
        {
          shot: "shot:beat-1",
          trim: { start: 0, duration: 1 },
          transition: { kind: "fade", duration: 0 },
        },
        {
          shot: "shot:beat-1",
          trim: { start: 0, duration: 1 },
          transition: { kind: "fade", duration: 2 },
        },
      ],
      pacing: "n/a",
      continuity: "n/a",
    },
    [SHOT],
  );
  TestValidator.equals("fails", cut.success, false);
  if (cut.success !== false) return;
  TestValidator.predicate(
    "first-entry transition rejected",
    hasViolation(cut, "type", "$input.entries[0].transition"),
  );
  TestValidator.predicate(
    "unbuilt shot rejected",
    hasViolation(cut, "type", "$input.entries[1].shot"),
  );
  TestValidator.predicate(
    "zero trim rejected",
    hasViolation(cut, "range", "$input.entries[2].trim.duration"),
  );
  TestValidator.predicate(
    "out-of-shot trim rejected with overshoot",
    cut.violations.some(
      (v: IAutoMovieConstraintViolation): boolean =>
        v.kind === "range" &&
        v.path === "$input.entries[3].trim" &&
        v.overshoot !== undefined && nclose(v.overshoot, 1),
    ),
  );
  TestValidator.predicate(
    "zero transition rejected",
    hasViolation(cut, "range", "$input.entries[4].transition.duration"),
  );
  TestValidator.predicate(
    "overlong transition rejected with overshoot",
    cut.violations.some(
      (v: IAutoMovieConstraintViolation): boolean =>
        v.kind === "range" &&
        v.path === "$input.entries[5].transition.duration" &&
        v.overshoot !== undefined && nclose(v.overshoot, 1),
    ),
  );

  const overPrevious: ReturnType<typeof cutSequence> = cutSequence(
    {
      sequence: { id: "seq-bad-prev", name: "the early dissolve" },
      fps: 24,
      entries: [
        {
          shot: "shot:beat-1",
          trim: { start: 0, duration: 1 },
          transition: null,
        },
        {
          shot: "shot:beat-1",
          trim: null,
          transition: { kind: "crossDissolve", duration: 2 },
        },
      ],
      pacing: "n/a",
      continuity: "n/a",
    },
    [SHOT],
  );
  TestValidator.equals(
    "transition longer than outgoing span fails",
    overPrevious.success,
    false,
  );
  TestValidator.equals(
    "overlong outgoing transition rejected",
    namedFacts([
      ["refused", (): boolean => overPrevious.success === false],
      [
        "violated",
        (): boolean =>
          overPrevious.success === false &&
          hasViolation(
            overPrevious,
            "range",
            "$input.entries[1].transition.duration",
          ),
      ],
    ]),
    { refused: true, violated: true },
  );

  const overlappingAdjacent: ReturnType<typeof cutSequence> = cutSequence(
    {
      sequence: { id: "seq-bad-overlap", name: "the nested dissolve" },
      fps: 24,
      entries: [
        { shot: "shot:beat-1", trim: null, transition: null },
        {
          shot: "shot:beat-1",
          trim: null,
          transition: { kind: "crossDissolve", duration: 2 },
        },
        {
          shot: "shot:beat-1",
          trim: null,
          transition: { kind: "crossDissolve", duration: 2 },
        },
      ],
      pacing: "n/a",
      continuity: "n/a",
    },
    [SHOT],
  );
  TestValidator.equals(
    "adjacent transition overlap fails",
    overlappingAdjacent.success,
    false,
  );
  TestValidator.equals(
    "nested transition overlap rejected",
    namedFacts([
      ["refused", (): boolean => overlappingAdjacent.success === false],
      [
        "violated",
        (): boolean =>
          overlappingAdjacent.success === false &&
          hasViolation(
            overlappingAdjacent,
            "range",
            "$input.entries[2].transition.duration",
          ),
      ],
    ]),
    { refused: true, violated: true },
  );
}

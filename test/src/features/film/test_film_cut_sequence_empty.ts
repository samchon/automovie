import { cutSequence } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * Pins the film-level gates of the ASSEMBLE consumer: a film needs at least one
 * shot and a positive frame rate: an empty cut at 0 fps is not a short film, it
 * is nothing.
 *
 * Scenarios:
 *
 * 1. `fps: 0` and `entries: []` in one write → a `range` violation on `$input.fps`
 *    and a `type` violation on `$input.entries`.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls cutSequence with zero frame rate and no entries and requires both range and type findings on their respective fields, catching a gate that returns success or reports only one independent cause.
 * @evidence contracts/testing.md#independent-expectations A film's positive finite frame rate and nonempty cut contract independently exclude zero and an empty list; the expected violation kinds and paths identify each failed field without reading a generated sequence.
 * @evidence contracts/testing.md#distinguishing-cases Owns the simultaneous zero-rate and empty-entry boundary with no source shots; valid nonempty assembly, nonfinite timing and malformed individual entries have separate cutSequence tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_cut_sequence_empty entry owns its single in-process gate call and lazily evaluates shared namedFacts without registering cases or starting a real host.
 */
export function test_film_cut_sequence_empty(): void {
  const cut: ReturnType<typeof cutSequence> = cutSequence(
    {
      sequence: { id: "seq-empty", name: "nothing" },
      fps: 0,
      entries: [],
      pacing: "n/a",
      continuity: "n/a",
    },
    [],
  );
  TestValidator.equals("fails", cut.success, false);
  TestValidator.equals(
    "zero fps rejected",
    namedFacts([
      ["refused", (): boolean => cut.success === false],
      [
        "violated",
        (): boolean =>
          cut.success === false && hasViolation(cut, "range", "$input.fps"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "empty cut rejected",
    namedFacts([
      ["refused", (): boolean => cut.success === false],
      [
        "violated",
        (): boolean =>
          cut.success === false && hasViolation(cut, "type", "$input.entries"),
      ],
    ]),
    { refused: true, violated: true },
  );
}

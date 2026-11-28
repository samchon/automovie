import { AutoMovieEngineViolationCollector } from "@automovie/engine";
import {
  validateBlockingClock
} from "../../../../../packages/engine/src/film/internal/validateBlockingClock";
import { TestValidator } from "@nestia/e2e";

/**
 * The chosen blocking clock names exactly one script beat and has positive
 * duration.
 *
 * Scenarios:
 *
 * 1. A beat with a positive duration and one declaration is admitted.
 * 2. Duplicates identify the first declaration, the selection must exist, and zero
 *    seconds reports at the clock's duration. Findings remain ordered.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify the single positive blocking clock and the refused duplicate, missing-selection and zero-duration forms with ordered findings.
 * @evidence contracts/development/testing.md#behavioral-verification The test calls the clock validator with authored beats and clock options and compares the returned findings, including their source and first declaration.
 * @evidence contracts/development/testing.md#independent-expectations One declared beat with positive duration satisfies identity and range prerequisites. The second duplicate declaration is detectable from input order, and a missing selected ID and duration zero independently violate their prerequisites.
 */
export function test_engine_film_validate_blocking_clock(): void {
  const out: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  validateBlockingClock(out, [{ id: "hold" }], { beat: "hold", duration: 2 });
  TestValidator.equals("positive clock", out.items, []);
  validateBlockingClock(out, [{ id: "hold" }, { id: "hold" }, { id: "hold" }], {
    beat: "missing",
    duration: 0,
  });
  TestValidator.equals(
    "independent source fields",
    out.items.map(({ kind, path }) => [kind, path]),
    [
      ["type", "$script.beats[1].id"],
      ["type", "$script.beats[2].id"],
      ["type", "$input.beat"],
      ["range", "$input.duration"],
    ],
  );
  TestValidator.predicate(
    "later duplicates name the original row",
    out.items[1]?.expected.includes("$script.beats[0].id") === true,
  );
}

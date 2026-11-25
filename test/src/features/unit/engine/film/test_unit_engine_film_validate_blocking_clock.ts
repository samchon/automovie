import { ViolationCollector } from "@automovie/engine";
import { validateBlockingClock } from "@automovie/engine/internal";
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
 */
export function test_unit_engine_film_validate_blocking_clock(): void {
  const out: ViolationCollector = new ViolationCollector();
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

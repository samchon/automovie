import { AutoMovieEngineViolationCollector, AutoMovieEngineValidation } from "@automovie/engine";
import { collectDeclaredIds } from "@automovie/engine/internal";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `collectDeclaredIds` gathers the declared ids and reports each repeat at the
 * record that repeats it; `validateDeclaredReferences` reports each reference
 * that resolves to no declared id and each repeated reference, at its index.
 * The two are the declare-then-refer pair every built record uses.
 *
 * Scenarios:
 *
 * 1. Records `a, b, a` declare {a, b} and report the second `a` at `[2].id`.
 * 2. References `a, x, a` against {a, b} report `x` unresolved at `[1]` and the
 *    second `a` duplicated at `[2]`.
 */
export function test_engine_validation_declared_ids(): void {
  const read = (collector: AutoMovieEngineViolationCollector): string[][] =>
    collector.items.map((item: IAutoMovieConstraintViolation): string[] => [
      item.path,
      item.expected,
    ]);
  const declared: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  const ids: Set<string> = collectDeclaredIds(
    [{ id: "a" }, { id: "b" }, { id: "a" }],
    "$input.rooms",
    "room",
    declared,
  );
  TestValidator.equals(
    "declared ids and the repeat",
    { ids: [...ids], findings: read(declared) },
    {
      ids: ["a", "b"],
      findings: [["$input.rooms[2].id", 'room id "a" must be unique']],
    },
  );
  const referred: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  AutoMovieEngineValidation.validateDeclaredReferences(
    ["a", "x", "a"],
    ids,
    "$input.links",
    "room",
    referred,
  );
  TestValidator.equals("unresolved and repeated references", read(referred), [
    ["$input.links[1]", 'room "x" does not resolve'],
    ["$input.links[2]", 'room "a" is duplicated'],
  ]);
}

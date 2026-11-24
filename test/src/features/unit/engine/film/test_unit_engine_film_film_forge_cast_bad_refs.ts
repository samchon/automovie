import { forgeCast } from "@automovie/engine";
import type { IAutoMovieForgedCast } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { forgeEntry, makeScriptWrite } from "../../../internal/filmFixtures";
import { hasViolation } from "../../../internal/predicates";

/**
 * An incoherent forge plan reports each violated casting join at its field.
 *
 * Scenarios:
 * 1. A stranger and an imported-model cast member cannot receive stand-ins.
 * 2. A generated member's model id must match its node.
 * 3. A repeated entry with imported origin reports both duplicate node and wrong origin.
 */
export function test_unit_engine_film_film_forge_cast_bad_refs(): void {
  const forged: IAutoMovieForgedCast = forgeCast(makeScriptWrite(), {
    entries: [
      forgeEntry("ghost"),
      forgeEntry("knightA"),
      forgeEntry("knightB", { id: "wrong-id" }),
      forgeEntry("knightB", { origin: "imported" }),
    ],
  });
  TestValidator.equals("fails", forged.success, false);
  if (forged.success !== false) return;
  TestValidator.predicate(
    "stranger rejected",
    hasViolation(forged, "type", "$input.entries[0].node"),
  );
  TestValidator.predicate(
    "imported member must not be forged",
    hasViolation(forged, "type", "$input.entries[1].node"),
  );
  TestValidator.predicate(
    "join id mismatch rejected",
    hasViolation(forged, "type", "$input.entries[2].model.id"),
  );
  TestValidator.predicate(
    "duplicate forge rejected",
    hasViolation(forged, "type", "$input.entries[3].node"),
  );
  TestValidator.predicate(
    "non-generated origin rejected",
    hasViolation(forged, "type", "$input.entries[3].model.origin"),
  );
}

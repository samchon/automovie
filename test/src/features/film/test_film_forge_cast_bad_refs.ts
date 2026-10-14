import { TestValidator } from "@nestia/e2e";

import { IAutoMovieForgedCast } from "../../../../packages/engine/src/film/IAutoMovieForgedCast";
import { forgeCast } from "../../../../packages/engine/src/film/forgeCast";
import { forgeEntry, makeScriptWrite } from "../internal/filmFixtures";
import { hasViolation } from "../internal/predicates";

/**
 * An incoherent forge plan reports each violated casting join at its field.
 *
 * Scenarios:
 * 1. A stranger and an imported-model cast member cannot receive stand-ins.
 * 2. A generated member's model id must match its node.
 * 3. A repeated entry with imported origin reports both duplicate node and wrong origin.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls forgeCast once with four incoherent entries and asserts five located violations, detecting fail-fast loss, an imported-member overwrite or an invalid model-to-cast join.
 * @evidence contracts/testing.md#independent-expectations The authored script imports knightA and requires a generated knightB; ghost is undeclared, wrong-id differs from knightB and the second knightB entry duplicates the first. Those input positions determine the literal diagnostic paths.
 * @evidence contracts/testing.md#distinguishing-cases Collects stranger, imported member, wrong model id, duplicate node and wrong origin in one result; valid singleton joins, missing bodies and malformed rig graphs have separate forge tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable function owns this portable forge case and imports its source directly; existing factories construct data only and no renderer, process or asset loader runs.
 */
export function test_film_forge_cast_bad_refs(): void {
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

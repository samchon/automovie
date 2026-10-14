import { IAutoMovieForgeEntry } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieForgedCast, forgeCast } from "@automovie/engine";

import { forgeEntry, makeScriptWrite } from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * Forge rejects a boneless stand-in while retaining located model findings.
 *
 * Scenarios:
 * 1. A generated knightB with null skeleton reports its skeleton field.
 * 2. Its part's undeclared material reports the corresponding entry model path in the same result.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls forgeCast on one two-defect entry and checks both skeleton and remapped material violations, catching a lost delegated model fault or an unposable accepted performer.
 * @evidence contracts/testing.md#independent-expectations Performers require a skeleton, and no-such-mat is absent from the fixture's material ids. The original part index and forge entry index independently determine the remapped paths; no pose or appearance is measured.
 * @evidence contracts/testing.md#distinguishing-cases Keeps both independent defects together so collecting the performer fault must not suppress model validation. Rigged acceptance and props with no skeleton are owned by cast-valid and forge-prop tests.
 * @evidence contracts/testing.md#execution-ownership The portable synchronous entry owns its named facts; their lazy evaluation stops within each group at a false guard. It calls real forge/model validation over existing data without a host or GPU.
 */
export function test_film_forge_cast_boneless(): void {
  const entry: IAutoMovieForgeEntry = forgeEntry("knightB", { skeleton: null });
  entry.model.parts = [{ ...entry.model.parts[0]!, material: "no-such-mat" }];
  const forged: IAutoMovieForgedCast = forgeCast(makeScriptWrite(), {
    entries: [entry],
  });
  TestValidator.equals("fails", forged.success, false);
  TestValidator.equals(
    "boneless performer rejected",
    namedFacts([
      ["refused", (): boolean => forged.success === false],
      [
        "violated",
        (): boolean =>
          forged.success === false &&
          hasViolation(forged, "type", "$input.entries[0].model.skeleton"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "validateModel finding remapped onto the entry",
    namedFacts([
      ["refused", (): boolean => forged.success === false],
      [
        "violated",
        (): boolean =>
          forged.success === false &&
          hasViolation(
            forged,
            "type",
            "$input.entries[0].model.parts[0].material",
          ),
      ],
    ]),
    { refused: true, violated: true },
  );
}

import { forgeCast } from "@automovie/engine";
import {
  IAutoMovieForgeEntry,
  type IAutoMovieForgedCast,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { forgeEntry, makeScriptWrite } from "../../../internal/filmFixtures";
import { hasViolation, namedFacts } from "../../../internal/predicates";

/**
 * Forge rejects a boneless stand-in while retaining located model findings.
 *
 * Scenarios:
 * 1. A generated knightB with null skeleton reports its skeleton field.
 * 2. Its part's undeclared material reports the corresponding entry model path in the same result.
 */
export function test_unit_engine_film_film_forge_cast_boneless(): void {
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

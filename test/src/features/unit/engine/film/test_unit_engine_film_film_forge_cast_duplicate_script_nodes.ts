import { forgeCast } from "@automovie/engine";
import type { IAutoMovieForgedCast } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { forgeEntry, makeScriptWrite } from "../../../internal/filmFixtures";
import { hasViolation, namedFacts } from "../../../internal/predicates";

/**
 * A repeated script cast address is refused before an ambiguous forge join is published.
 *
 * Scenarios:
 * 1. Two knightA declarations with imported and generated model references yield a located duplicate-script-node violation.
 */
export function test_unit_engine_film_film_forge_cast_duplicate_script_nodes(): void {
  const forged: IAutoMovieForgedCast = forgeCast(
    makeScriptWrite({
      cast: [
        {
          node: "knightA",
          character: "the imported challenger",
          modelRef: "stickman",
        },
        {
          node: "knightA",
          character: "the generated impostor",
          modelRef: null,
        },
      ],
    }),
    { entries: [forgeEntry("knightA")] },
  );

  TestValidator.equals(
    "duplicate script cast nodes fail",
    forged.success,
    false,
  );
  TestValidator.equals(
    "duplicate script cast node violation",
    namedFacts([
      ["refused", (): boolean => forged.success === false],
      [
        "violated",
        (): boolean =>
          forged.success === false &&
          hasViolation(forged, "type", "$script.cast[1].node"),
      ],
    ]),
    { refused: true, violated: true },
  );
}

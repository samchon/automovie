import { TestValidator } from "@nestia/e2e";

import { IAutoMovieForgedCast, forgeCast } from "@automovie/engine";

import { forgeEntry, makeScriptWrite } from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * A repeated script cast address is refused before an ambiguous forge join is published.
 *
 * Scenarios:
 * 1. Two knightA declarations with imported and generated model references yield a located duplicate-script-node violation.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs forgeCast against conflicting script declarations and checks unsuccessful admission and the second declaration's exact node path, catching a last-declaration overwrite that hides ambiguity.
 * @evidence contracts/testing.md#independent-expectations The script cast contract requires unique node ids regardless of modelRef, so the second knightA declaration is invalid at cast index one. The assertion does not depend on a generated model snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Owns the conflicting duplicate script case; duplicate forge entries, ordinary unique cast acceptance and missing generated entries remain separate cases.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous unit owns this one case and its guarded named facts, using portable engine source and existing factories without installation or external execution.
 */
export function test_film_forge_cast_duplicate_script_nodes(): void {
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

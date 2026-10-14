import { IAutoMovieForgedCast, forgeCast } from "@automovie/engine";
import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite } from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * An empty forge reports only the cast member whose model reference is absent.
 *
 * Scenarios:
 * 1. The empty plan fails at entries with value knightB.
 * 2. The imported knightA is never demanded as an unprovided stand-in.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls forgeCast with an empty plan and checks refusal, entries location, the missing generated member and exclusion of the imported member from reported values, catching silent omissions or overbroad completeness checks.
 * @evidence contracts/testing.md#independent-expectations The authored script sets knightB.modelRef to null and knightA.modelRef to stickman, so only knightB needs a generated entry. Expected ids and the completeness path are contract literals.
 * @evidence contracts/testing.md#distinguishing-cases Pairs missing generated and already imported cast members within one empty-plan boundary; valid generated entries, duplicate entries and broken models have dedicated tests.
 * @evidence contracts/testing.md#execution-ownership This synchronous discoverable entry owns one portable forge case and lazy named facts, which stop at the first false guard. It starts no consumer, browser or rendering process.
 */
export function test_film_forge_cast_missing(): void {
  const forged: IAutoMovieForgedCast = forgeCast(makeScriptWrite(), {
    entries: [],
  });
  TestValidator.equals("fails", forged.success, false);
  TestValidator.equals(
    "names the unforged stand-in member only",
    namedFacts([
      ["forgedSuccess", (): boolean => forged.success === false],
      [
        "hasViolationForgedType",
        (): boolean =>
          forged.success === false &&
          hasViolation(forged, "type", "$input.entries"),
      ],
      [
        "forgedViolationsV",
        (): boolean =>
          forged.success === false &&
          forged.violations.some(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.value === "knightB",
          ),
      ],
      [
        "forgedViolationsV2",
        (): boolean =>
          forged.success === false &&
          forged.violations.every(
            (v: IAutoMovieConstraintViolation): boolean =>
              v.value !== "knightA",
          ),
      ],
    ]),
    {
      forgedSuccess: true,
      hasViolationForgedType: true,
      forgedViolationsV: true,
      forgedViolationsV2: true,
    },
  );
}

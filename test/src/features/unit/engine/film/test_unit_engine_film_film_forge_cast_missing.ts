import { forgeCast } from "@automovie/engine";
import {
  IAutoMovieConstraintViolation,
  type IAutoMovieForgedCast,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite } from "../../../internal/filmFixtures";
import { hasViolation, namedFacts } from "../../../internal/predicates";

/**
 * An empty forge reports only the cast member whose model reference is absent.
 *
 * Scenarios:
 * 1. The empty plan fails at entries with value knightB.
 * 2. The imported knightA is never demanded as an unprovided stand-in.
 */
export function test_unit_engine_film_film_forge_cast_missing(): void {
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

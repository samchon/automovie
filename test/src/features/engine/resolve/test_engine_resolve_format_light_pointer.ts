import { AutoMovieEngineResolve } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `formatLightPointer` writes the RFC 6901 address `/lights/<id>/<property>`,
 * escaping `~` as `~0` and `/` as `~1` in the id.
 *
 * Scenarios:
 *
 * 1. A plain id is written as is.
 * 2. An id with `/` and `~` is escaped, `~` first so a `~1` is not doubled.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the pointer's path and two escapes, with plain and escaped light IDs.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `formatLightPointer` on two literal IDs and compares the exact output for each requested property.
 * @evidence contracts/development/testing.md#independent-expectations A plain candle ID gives /lights/candle/intensity. Applying RFC 6901 to a/b~c yields a~1b~0c and the complete address /lights/a~1b~0c/range.
 */
export function test_engine_resolve_format_light_pointer(): void {
  TestValidator.equals(
    "a plain id",
    AutoMovieEngineResolve.formatLightPointer("candle", "intensity"),
    "/lights/candle/intensity",
  );
  TestValidator.equals(
    "an id with a slash and a tilde",
    AutoMovieEngineResolve.formatLightPointer("a/b~c", "range"),
    "/lights/a~1b~0c/range",
  );
}

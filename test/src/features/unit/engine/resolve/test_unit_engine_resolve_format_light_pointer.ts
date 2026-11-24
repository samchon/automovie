import { formatLightPointer } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `formatLightPointer` writes the RFC 6901 address `/lights/<id>/<property>`,
 * escaping `~` as `~0` and `/` as `~1` in the id.
 *
 * Scenarios:
 *
 * 1. A plain id is written as is.
 * 2. An id with `/` and `~` is escaped, `~` first so a `~1` is not doubled.
 */
export function test_unit_engine_resolve_format_light_pointer(): void {
  TestValidator.equals(
    "a plain id",
    formatLightPointer("candle", "intensity"),
    "/lights/candle/intensity",
  );
  TestValidator.equals(
    "an id with a slash and a tilde",
    formatLightPointer("a/b~c", "range"),
    "/lights/a~1b~0c/range",
  );
}
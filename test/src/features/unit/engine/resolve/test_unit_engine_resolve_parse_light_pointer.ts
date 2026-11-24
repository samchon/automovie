import { parseLightPointer } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `parseLightPointer` reads `/lights/<id>/<property>` and returns null for every
 * other shape, decoding `~1` to `/` and `~0` to `~`.
 *
 * Scenarios:
 *
 * 1. A canonical address gives its light and property.
 * 2. An escaped id decodes.
 * 3. A wrong segment count, root, property, empty id or noncanonical escape
 *    gives null.
 */
export function test_unit_engine_resolve_parse_light_pointer(): void {
  TestValidator.equals(
    "a canonical address",
    parseLightPointer("/lights/lamp/intensity"),
    { light: "lamp", property: "intensity" },
  );
  TestValidator.equals(
    "an escaped id",
    parseLightPointer("/lights/a~1b~0c/range"),
    { light: "a/b~c", property: "range" },
  );
  TestValidator.predicate(
    "every other shape is null",
    [
      "/lights/lamp",
      "lights/lamp/intensity",
      "/cameras/lamp/intensity",
      "/lights/lamp/temperature",
      "/lights//intensity",
      "/lights/a~2b/intensity",
    ].every(
      (pointer: string): boolean => parseLightPointer(pointer) === null,
    ),
  );
}
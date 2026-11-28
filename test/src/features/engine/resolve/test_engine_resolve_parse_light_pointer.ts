import { AutoMovieEngineResolve } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * Parse canonical light pointers, decoding `~1` to `/` and `~0` to `~`.
 * Refuse the malformed addresses below.
 *
 * Scenarios:
 *
 * 1. A canonical address gives its light and property.
 * 2. An escaped id decodes.
 * 3. A wrong segment count, root, property, empty id or noncanonical escape gives
 *    null.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names canonical and escaped addresses and the malformed path forms the parser rejects.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `parseLightPointer` for two valid addresses and six malformed strings, comparing both valid result fields and null for each invalid input.
 * @evidence contracts/development/testing.md#independent-expectations The plain address names lamp/intensity. RFC 6901 decodes a~1b~0c to a/b~c with property range. Missing segments or leading slash, a different root, an unsupported property, empty ID, and ~2 all produce null.
 */
export function test_engine_resolve_parse_light_pointer(): void {
  TestValidator.equals(
    "a canonical address",
    AutoMovieEngineResolve.parseLightPointer("/lights/lamp/intensity"),
    { light: "lamp", property: "intensity" },
  );
  TestValidator.equals(
    "an escaped id",
    AutoMovieEngineResolve.parseLightPointer("/lights/a~1b~0c/range"),
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
    ].every((pointer: string): boolean => AutoMovieEngineResolve.parseLightPointer(pointer) === null),
  );
}

import { AutoMovieEngineResolve } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `isLightProperty` admits exactly the six animatable light properties.
 *
 * Scenarios:
 *
 * 1. Each of intensity, color, range, coneAngle, position and rotation is one.
 * 2. A name outside the table, and an inherited object key, is not.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the six documented animatable light fields and a rejection for ordinary and inherited unknown keys.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `isLightProperty` on all six allowed names and on temperature and toString, then checks the booleans.
 * @evidence contracts/development/testing.md#independent-expectations The allowlist is intensity, color, range, coneAngle, position, and rotation. Temperature and the inherited object property toString fall outside that list.
 */
export function test_engine_resolve_is_light_property(): void {
  TestValidator.predicate(
    "the six properties",
    ["intensity", "color", "range", "coneAngle", "position", "rotation"].every(
      (name: string): boolean => AutoMovieEngineResolve.isLightProperty(name),
    ),
  );
  TestValidator.predicate(
    "a stranger and an inherited key",
    !AutoMovieEngineResolve.isLightProperty("temperature") && !AutoMovieEngineResolve.isLightProperty("toString"),
  );
}

import { isLightProperty } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `isLightProperty` admits exactly the six animatable light properties.
 *
 * Scenarios:
 *
 * 1. Each of intensity, color, range, coneAngle, position and rotation is one.
 * 2. A name outside the table, and an inherited object key, is not.
 */
export function test_unit_engine_resolve_is_light_property(): void {
  TestValidator.predicate(
    "the six properties",
    ["intensity", "color", "range", "coneAngle", "position", "rotation"].every(
      (name: string): boolean => isLightProperty(name),
    ),
  );
  TestValidator.predicate(
    "a stranger and an inherited key",
    !isLightProperty("temperature") && !isLightProperty("toString"),
  );
}
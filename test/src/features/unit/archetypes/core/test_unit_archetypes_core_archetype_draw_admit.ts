import { createDevice } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * A family dispatcher narrows the saved `model` to the models its selected
 * variant makes, through `ArchetypeDraw.admit`, and refuses the others.
 *
 * Scenarios:
 *
 * 1. A tablet with its own model "wifi" builds a model with parts.
 * 2. A tablet given the camera's model "grIII" is refused.
 * 3. A camera given its own model "grIII" builds a model with parts.
 * 4. A phone, which has no models, ignores a saved model: it builds as it would
 *    without one.
 */
export function test_unit_archetypes_core_archetype_draw_admit(): void {
  TestValidator.predicate(
    "a tablet's own model",
    createDevice({ kind: "tablet", model: "wifi" }).parts.length > 0,
  );
  TestValidator.error("a camera's model on a tablet", (): unknown =>
    createDevice({ kind: "tablet", model: "grIII" }),
  );
  TestValidator.predicate(
    "a camera's own model",
    createDevice({ kind: "camera", model: "grIII" }).parts.length > 0,
  );
  TestValidator.predicate(
    "a phone ignores a saved model",
    createDevice({ kind: "phone", model: "wifi" }).parts.length > 0,
  );
}

import { attributeAutoMovieCompiledShotSource } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

import { materializedShotAttributionInput } from "../internal/materializedShotAttributionInput";
import { shotAcceptanceCompletionBinding } from "../internal/shotAcceptanceCompletionBinding";

/**
 * Legacy source-scope materialization carries no invented graph attribution.
 *
 * Scenarios:
 * 1. A materialized payload with resident sibling edges and no resolved entry
 *    remains a separate equal record without either attribution field.
 */
export const test_production_shot_attribution_legacy_absence = (): void => {
  const value = materializedShotAttributionInput();
  const result = attributeAutoMovieCompiledShotSource({
    value,
    bindings: [shotAcceptanceCompletionBinding()],
    entry: null,
  });
  TestValidator.equals("legacy payload is preserved", result, value);
  TestValidator.predicate(
    "attribution owns a separate record",
    result !== value,
  );
  TestValidator.equals(
    "source owner is absent",
    Object.hasOwn(result, "sourceOwner"),
    false,
  );
  TestValidator.equals(
    "acceptance attribution is absent",
    Object.hasOwn(result, "acceptanceSources"),
    false,
  );
};

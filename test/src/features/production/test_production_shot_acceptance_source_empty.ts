import { attributeAutoMovieCompiledShotSource } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

import { materializedShotAttributionInput } from "../internal/materializedShotAttributionInput";
import { shotAcceptanceCompletionBinding } from "../internal/shotAcceptanceCompletionBinding";

/**
 * Acceptance attribution never invents an export from an empty sibling set.
 *
 * Scenarios:
 *
 * 1. Empty and entry-only graph populations both yield no acceptance siblings.
 */
export const test_production_shot_acceptance_source_empty = (): void => {
  const entry = shotAcceptanceCompletionBinding();
  TestValidator.equals(
    "empty and entry-only populations have no acceptance sibling",
    [
      attributeAutoMovieCompiledShotSource({
        value: materializedShotAttributionInput(),
        bindings: [],
        entry,
      }).acceptanceSources,
      attributeAutoMovieCompiledShotSource({
        value: materializedShotAttributionInput(),
        bindings: [entry],
        entry,
      }).acceptanceSources,
    ],
    [[], []],
  );
};

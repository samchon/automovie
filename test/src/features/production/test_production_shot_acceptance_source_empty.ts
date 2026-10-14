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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual attribution with each binding population and requires an empty acceptanceSources array for both results.
 * @evidence contracts/testing.md#independent-expectations The two literal empty arrays express absence of sibling exports independently of the selector output; no digest computation is used as an oracle.
 * @evidence contracts/testing.md#distinguishing-cases An empty population and a population containing only the executed entry separately guard invented siblings and accidental inclusion of the entry itself.
 * @evidence contracts/testing.md#execution-ownership The named synchronous test owns its resident fixtures and performs no source execution or graph authentication; positive sibling attribution belongs to the adjacent completion test.
 */
export function test_production_shot_acceptance_source_empty(): void {
  const entry: ReturnType<typeof shotAcceptanceCompletionBinding> = shotAcceptanceCompletionBinding();
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
}

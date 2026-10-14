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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls real attribution with a null resolved entry, compares the full preserved payload, and asserts distinct outer identity plus own-property absence for both attribution fields.
 * @evidence contracts/testing.md#independent-expectations The original payload supplies the preservation oracle while literal false own-property checks and reference inequality independently express the legacy copy contract.
 * @evidence contracts/testing.md#distinguishing-cases A nonempty binding population alongside null entry demonstrates that available sibling metadata cannot manufacture an authenticated owner; equality alone would not detect returning the original record.
 * @evidence contracts/testing.md#execution-ownership The synchronous named test uses in-memory materialized output and binding metadata without running any source module. It checks the outer shallow-copy contract, not deep detachment of nested payloads.
 */
export function test_production_shot_attribution_legacy_absence(): void {
  const value: ReturnType<typeof materializedShotAttributionInput> = materializedShotAttributionInput();
  const result: ReturnType<typeof attributeAutoMovieCompiledShotSource> = attributeAutoMovieCompiledShotSource({
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
}

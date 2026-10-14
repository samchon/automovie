import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
import { attributeAutoMovieCompiledShotSource } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

import { materializedShotAttributionInput } from "../internal/materializedShotAttributionInput";
import { shotAcceptanceCompletionBinding } from "../internal/shotAcceptanceCompletionBinding";

/**
 * A sibling cannot borrow a completed shot's acceptance attribution.
 *
 * Scenarios:
 *
 * 1. Draft, unenforced, other-branch, other-target-path, and other-anchor
 *    siblings remain outside the exact shot's attribution.
 *
 * @evidence contracts/testing.md#behavioral-verification Attributes a materialized shot against adjacent acceptance bindings and requires an empty acceptanceSources list, catching attribution borrowed from incomplete or unrelated siblings.
 * @evidence contracts/testing.md#independent-expectations The exact selected shot identity requires completion, enforcement, branch, path and anchor agreement; the literal empty attribution is independent of output and does not validate all positive attribution fields.
 * @evidence contracts/testing.md#distinguishing-cases Separately changes stage, enforcement, branch, target path and anchor of sibling bindings; positive materialized-shot attribution is owned by its adjacent attribution tests.
 * @evidence contracts/testing.md#execution-ownership This named portable unit entry owns its resident shot and binding array through the actual attribution function and shared typed fixtures; no renderer, browser or generated consumer is started.
 */
export function test_production_shot_acceptance_source_refusals(): void {
  const entry: IAutoMovieProductionEvidenceSourceOwnerBinding = shotAcceptanceCompletionBinding();
  const sibling: IAutoMovieProductionEvidenceSourceOwnerBinding = shotAcceptanceCompletionBinding({
    exportName: "doorClearance",
  });
  TestValidator.equals(
    "unrelated and incomplete siblings receive no attribution",
    attributeAutoMovieCompiledShotSource({
      value: materializedShotAttributionInput(),
      entry,
      bindings: [
        { ...sibling, stage: "draft", },
        { ...sibling, enforced: false },
        { ...sibling, branch: "modelSources" },
        {
          ...sibling,
          targetPath: "docs/final/screenplays/001-entry/002-closing.md",
        },
        { ...sibling, targetAnchor: "door-closes" },
      ],
    }).acceptanceSources,
    [],
  );
}

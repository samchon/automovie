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
 */
export const test_production_shot_acceptance_source_refusals = (): void => {
  const entry = shotAcceptanceCompletionBinding();
  const sibling = shotAcceptanceCompletionBinding({
    exportName: "doorClearance",
  });
  TestValidator.equals(
    "unrelated and incomplete siblings receive no attribution",
    attributeAutoMovieCompiledShotSource({
      value: materializedShotAttributionInput(),
      entry,
      bindings: [
        { ...sibling, stage: "draft", reviewed: true },
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
};

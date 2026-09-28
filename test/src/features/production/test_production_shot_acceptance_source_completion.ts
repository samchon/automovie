import { attributeAutoMovieCompiledShotSource } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

import { materializedShotAttributionInput } from "../internal/materializedShotAttributionInput";
import { shotAcceptanceCompletionBinding } from "../internal/shotAcceptanceCompletionBinding";

/**
 * Completed siblings of one exact shot retain their own source attribution.
 *
 * Scenarios:
 *
 * 1. Completed evidence and compatible review siblings with a different
 *    module or export retain their own digests and input order without review
 *    metadata, while the executed export itself is excluded.
 */
export const test_production_shot_acceptance_source_completion = (): void => {
  const entry = shotAcceptanceCompletionBinding();
  const sameModule = shotAcceptanceCompletionBinding({
    exportName: "doorClearance",
  });
  const otherModule = shotAcceptanceCompletionBinding({
    sourcePath: "src/shots/acceptance.ts",
    stage: "review",
    sourceDigest: `sha256:${"2".repeat(64)}`,
  });
  const target = "docs/final/screenplays/001-entry/001-opening.md#door-opens";
  const value = materializedShotAttributionInput();
  const result = attributeAutoMovieCompiledShotSource({
    value,
    bindings: [entry, sameModule, otherModule],
    entry,
  });
  TestValidator.equals(
    "completed siblings retain exact attribution and independent digests",
    result,
    {
      ...value,
      sourceOwner: {
        branch: "shots",
        path: entry.sourcePath,
        export: "opening",
        digest: entry.sourceDigest,
        target,
      },
      acceptanceSources: [
        {
          path: sameModule.sourcePath,
          export: "doorClearance",
          digest: entry.sourceDigest,
          target,
        },
        {
          path: otherModule.sourcePath,
          export: "opening",
          digest: otherModule.sourceDigest,
          target,
        },
      ],
    },
  );
  TestValidator.equals(
    "input attribution remains absent",
    [value.sourceOwner, value.acceptanceSources],
    [undefined, undefined],
  );
};

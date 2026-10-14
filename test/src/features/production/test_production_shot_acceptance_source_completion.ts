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
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes actual materialized-shot attribution and compares the full source owner and ordered acceptance sibling records, then checks that the input still lacks both attribution fields.
 * @evidence contracts/testing.md#independent-expectations Expected branch, export, target and sibling order are explicit; supplied synthetic digests are checked as attribution values, not independently authenticated source-byte hashes.
 * @evidence contracts/testing.md#distinguishing-cases Keeps the executed entry beside a same-module different export and a different-module review sibling, requiring entry exclusion and each sibling's own digest without leaking stage metadata.
 * @evidence contracts/testing.md#execution-ownership This synchronous named unit uses resident typed graph bindings and materialized output; it starts no source exports, renderer or graph resolver and presumes the supplied entry was already authenticated.
 */
export function test_production_shot_acceptance_source_completion(): void {
  const entry: ReturnType<typeof shotAcceptanceCompletionBinding> = shotAcceptanceCompletionBinding();
  const sameModule: ReturnType<typeof shotAcceptanceCompletionBinding> = shotAcceptanceCompletionBinding({
    exportName: "doorClearance",
  });
  const otherModule: ReturnType<typeof shotAcceptanceCompletionBinding> = shotAcceptanceCompletionBinding({
    sourcePath: "src/shots/acceptance.ts",
    stage: "review",
    sourceDigest: `sha256:${"2".repeat(64)}`,
  });
  const target: string = "docs/final/screenplays/001-entry/001-opening.md#door-opens";
  const value: ReturnType<typeof materializedShotAttributionInput> = materializedShotAttributionInput();
  const result: ReturnType<typeof attributeAutoMovieCompiledShotSource> = attributeAutoMovieCompiledShotSource({
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
}

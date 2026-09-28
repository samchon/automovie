import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
import { resolveAutoMovieSourceOwnerBinding } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";

/**
 * Executed source exports resolve through one exact graph-selected owner edge.
 *
 * Scenarios:
 *
 * 1. Exact path, export, owner, digest, and enforced completion resolve together.
 * 2. Missing, ambiguous, swapped-owner, stale-source, and incomplete edges
 *    fail with distinct reasons.
 * 3. A path alias and a same-named export from another branch cannot borrow the
 *    completed edge.
 */
export const test_production_source_owner_binding = (): void => {
  const binding: IAutoMovieProductionEvidenceSourceOwnerBinding = {
    branch: "spaceSources",
    stage: "review",
    enforced: true,
    relationship: "lineage",
    sourcePath: "src/spaces/hall.ts",
    exportName: "hall",
    symbolKind: "property",
    sourceDigest:
      "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    targetPath: "docs/spaces/hall.md",
    targetAnchor: "hall",
    reviewed: true,
  };
  const resolve = (
    overrides: Partial<
      Parameters<typeof resolveAutoMovieSourceOwnerBinding>[0]
    > = {},
  ) =>
    resolveAutoMovieSourceOwnerBinding({
      bindings: [binding],
      branch: binding.branch,
      sourcePath: binding.sourcePath,
      exportName: binding.exportName,
      owner: `${binding.targetPath}#${binding.targetAnchor}`,
      sourceDigest: binding.sourceDigest,
      requireReviewed: true,
      ...overrides,
    });
  const adjacent = {
    ...binding,
    targetAnchor: "annex",
  };

  TestValidator.equals(
    "source owner binding admits exactly one current completed edge",
    namedFacts([
      ["exactEdgeResolves", () => resolve().success],
      [
        "shotEntryUsesSelectedOwnerWithoutRuntimeClaim",
        () => resolve({ owner: undefined }).success,
      ],
      [
        "missingEdgeIsDistinct",
        () => resolve({ bindings: [] }).reason === "missing",
      ],
      [
        "missingCarrierFailsWithoutThrowing",
        () => resolve({ bindings: undefined }).reason === "missing",
      ],
      [
        "ambiguousEdgeIsDistinct",
        () => resolve({ bindings: [binding, binding] }).reason === "ambiguous",
      ],
      [
        "runtimeOwnerCannotDisambiguateSeveralTargets",
        () => resolve({ bindings: [binding, adjacent] }).reason === "ambiguous",
      ],
      [
        "swappedOwnerIsDistinct",
        () =>
          resolve({ owner: "docs/spaces/annex.md#annex" }).reason === "owner",
      ],
      [
        "staleSourceIsDistinct",
        () => resolve({ sourceDigest: "sha256:changed" }).reason === "digest",
      ],
      [
        "incompleteEdgeBlocksAdmission",
        () =>
          resolve({ bindings: [{ ...binding, stage: "draft" }] }).reason ===
          "review",
      ],
      [
        "evidenceStageCompletesWithoutCompanionReview",
        () =>
          resolve({
            bindings: [{ ...binding, reviewed: false, stage: "evidence" }],
          }).success,
      ],
      [
        "pathAliasCannotBorrowEdge",
        () =>
          resolve({ sourcePath: "src/spaces/./hall.ts" }).reason === "missing",
      ],
      [
        "otherBranchCannotBorrowEdge",
        () => resolve({ branch: "modelSources" }).reason === "missing",
      ],
    ]),
    {
      exactEdgeResolves: true,
      shotEntryUsesSelectedOwnerWithoutRuntimeClaim: true,
      missingEdgeIsDistinct: true,
      missingCarrierFailsWithoutThrowing: true,
      ambiguousEdgeIsDistinct: true,
      runtimeOwnerCannotDisambiguateSeveralTargets: true,
      swappedOwnerIsDistinct: true,
      staleSourceIsDistinct: true,
      incompleteEdgeBlocksAdmission: true,
      evidenceStageCompletesWithoutCompanionReview: true,
      pathAliasCannotBorrowEdge: true,
      otherBranchCannotBorrowEdge: true,
    },
  );
};

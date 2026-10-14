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
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves an executed export to an exact graph-selected source owner and asserts success or distinct missing, ambiguous, owner, digest and review reasons, catching borrowed or stale execution identity.
 * @evidence contracts/testing.md#independent-expectations Literal boolean facts and refusal categories derive from unique completed enforced ownership and exact source identity; supplied digest strings test matching rather than independently verifying source bytes.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty and absent carriers, duplicate and adjacent targets, swapped owner, stale digest, unfinished and evidence stages, path aliases and another branch; source acquisition owns actual byte observations.
 * @evidence contracts/testing.md#execution-ownership This named portable unit entry owns every namedFacts callback and invokes the actual resolver on resident bindings without installing or starting a production host.
 */
export function test_production_source_owner_binding(): void {
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
  };
  const resolve: (overrides?: Partial<Parameters<typeof resolveAutoMovieSourceOwnerBinding>[0]>) => { success: false; binding: null; reason: "missing" | "ambiguous" | "owner" | "digest" | "review"; message: string; } | { success: true; binding: IAutoMovieProductionEvidenceSourceOwnerBinding; reason: null; message: null; } = (
    overrides: Partial<
      Parameters<typeof resolveAutoMovieSourceOwnerBinding>[0]
    > = {},
  ): { success: false; binding: null; reason: "missing" | "ambiguous" | "owner" | "digest" | "review"; message: string; } | { success: true; binding: IAutoMovieProductionEvidenceSourceOwnerBinding; reason: null; message: null; } =>
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
  const adjacent: { targetAnchor: string; branch: string; stage: string; enforced: boolean; relationship: "lineage"; sourcePath: string; exportName: string; symbolKind: "function" | "property" | "type"; sourceDigest: string; targetPath: string; } = {
    ...binding,
    targetAnchor: "annex",
  };

  TestValidator.equals(
    "source owner binding admits exactly one current completed edge",
    namedFacts([
      ["exactEdgeResolves", (): boolean => resolve().success],
      [
        "shotEntryUsesSelectedOwnerWithoutRuntimeClaim",
        (): boolean => resolve({ owner: undefined }).success,
      ],
      [
        "missingEdgeIsDistinct",
        (): boolean => resolve({ bindings: [] }).reason === "missing",
      ],
      [
        "missingCarrierFailsWithoutThrowing",
        (): boolean => resolve({ bindings: undefined }).reason === "missing",
      ],
      [
        "ambiguousEdgeIsDistinct",
        (): boolean => resolve({ bindings: [binding, binding] }).reason === "ambiguous",
      ],
      [
        "runtimeOwnerCannotDisambiguateSeveralTargets",
        (): boolean => resolve({ bindings: [binding, adjacent] }).reason === "ambiguous",
      ],
      [
        "swappedOwnerIsDistinct",
        (): boolean =>
          resolve({ owner: "docs/spaces/annex.md#annex" }).reason === "owner",
      ],
      [
        "staleSourceIsDistinct",
        (): boolean => resolve({ sourceDigest: "sha256:changed" }).reason === "digest",
      ],
      [
        "incompleteEdgeBlocksAdmission",
        (): boolean =>
          resolve({ bindings: [{ ...binding, stage: "draft" }] }).reason ===
          "review",
      ],
      [
        "evidenceStageCompletesWithoutCompanionReview",
        (): boolean =>
          resolve({
            bindings: [{ ...binding, stage: "evidence" }],
          }).success,
      ],
      [
        "pathAliasCannotBorrowEdge",
        (): boolean =>
          resolve({ sourcePath: "src/spaces/./hall.ts" }).reason === "missing",
      ],
      [
        "otherBranchCannotBorrowEdge",
        (): boolean => resolve({ branch: "modelSources" }).reason === "missing",
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
}

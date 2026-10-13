import {
  createAutoMovieScreenplayNaturalnessClaims,
  createBlankAutoMovieProductionEvidence,
} from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";

/**
 *
 * Final screenplay claims preserve construction identity at each host depth
 * while placing audience-language checklists only on authored heading units.
 *
 * Scenarios:
 * 1. Every stage emits file/H2/H3/H4 lineage; only evidence and review enable
 *    claims without requiring companion rows in either completed stage.
 * 2. Complete and first-pilot populations select matching construction/final
 *    directories; a disabled construction branch retains its full denominator.
 * 3. File lineage has no naturalness checklist; each heading independently
 *    answers the common, story, and selected-language naturalness families.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `createAutoMovieScreenplayNaturalnessClaims` for two population scopes, two construction states and four final stages, and asserts the claim depths, final host globs, disabled flag, the same-depth construction lineage reference with its uniqueness policy, and which naturalness checklists follow it; it catches a missing or reordered depth, final claims enabled at draft or disabled at evidence or review, a first-pilot scope that narrows a disabled construction branch, lineage bound across depths, and a whole-file claim burdened with heading checklists.
 * @evidence contracts/testing.md#independent-expectations Expectations restate the documented final-pass contract: four host depths from file to H4, claims active only at evidence and review, the pilot partition group used only while construction is active, one-to-one same-depth lineage, and the three naturalness families on headings alone; the glob and file paths are the shipped docs layout, so a deliberate rename of that layout must change this test.
 * @evidence contracts/testing.md#distinguishing-cases Every combination of complete and first-pilot scope, disabled and reviewed construction, and disabled, draft, evidence and review final stage, with the file depth as the negative for checklists; population counting of final hosts belongs to `test_evidence_final_screenplay_population`, and the naturalness reference builder to `test_evidence_authored_contract_applicability`.
 */
export const test_evidence_final_screenplay_claims = (): void => {
  const blank = createBlankAutoMovieProductionEvidence(
    "/production",
    "english",
  );
  const depths = ["file", "h2", "h3", "h4"] as const;
  for (const scope of [
    { mode: "complete-production" },
    { mode: "first-pilot", partitionGroup: "001-first" },
  ] as const)
    for (const construction of ["disabled", "review"] as const)
      for (const stage of [
        "disabled",
        "draft",
        "evidence",
        "review",
      ] as const) {
        const graph = {
          ...blank,
          populationScope: scope,
          screenplays: construction,
          naturalness: { screenplays: stage },
        };
        const group =
          scope.mode === "first-pilot" && construction !== "disabled"
            ? "001-first"
            : "*";
        const constructionFiles = [`screenplays/${group}/???-*.md`];
        const claims = createAutoMovieScreenplayNaturalnessClaims(graph);
        TestValidator.equals(
          "one lineage claim per host depth",
          claims.map(({ branch, claim }) => ({ branch, symbol: claim.symbol })),
          depths.map((symbol) => ({
            branch: "screenplayNaturalness" as const,
            symbol,
          })),
        );
        for (const [index, { claim }] of claims.entries()) {
          TestValidator.equals(
            "final hosts",
            {
              type: claim.type,
              root: claim.root,
              files: claim.files,
              disabled: claim.disabled,
            },
            {
              type: "markdown",
              root: "docs",
              files: [`final/screenplays/${group}/???-*.md`],
              disabled: stage === "disabled" || stage === "draft",
            },
          );
          const references = Array.isArray(claim.reference)
            ? claim.reference
            : [claim.reference];
          TestValidator.equals(
            "same-depth one-to-one construction lineage",
            references[0],
            {
              type: "markdown",
              root: "docs",
              files: constructionFiles,
              symbol: depths[index]!,
              noEvidenceExclude: true,
              uniqueEvidence: true,
              singleEvidencePerSymbol: true,
              requireReview: false,
            },
          );
          TestValidator.equals(
            "only headings answer all naturalness families",
            references.slice(1),
            claim.symbol === "file"
              ? []
              : [
                  "naturalness/core/common.md",
                  "naturalness/story/screenplays.md",
                  "language/naturalness/screenplays.md",
                ].map((file) => ({
                  type: "markdown",
                  root: "docs",
                  files: [file],
                  symbol: "h2",
                  checklist: true,
                  noEvidenceExclude: true,
                  requireReview: false,
                })),
          );
        }
      }
};

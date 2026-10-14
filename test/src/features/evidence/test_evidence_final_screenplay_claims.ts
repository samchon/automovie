import {
  type IAutoMovieEvidenceConfigProps,
  createAutoMovieScreenplayNaturalnessClaims,
  createBlankAutoMovieProductionEvidence,
} from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";
import { type ITtscEvidenceGraphMarkdownReference, type ITtscEvidenceGraphReference } from "@ttsc/evidence";

/**
 * Final screenplay claims preserve construction identity at each host depth
 * while placing audience-language checklists only on authored heading units.
 *
 * Scenarios:
 *
 * 1. Every stage emits file/H2/H3/H4 lineage; only evidence and review enable
 *    claims without requiring companion rows in either completed stage.
 * 2. Complete and first-pilot populations select matching construction/final
 *    directories; a disabled construction branch retains its full denominator.
 * 3. File lineage has no naturalness checklist; each heading independently
 *    answers the common, story, and selected-language naturalness families.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls createAutoMovieScreenplayNaturalnessClaims and inspects its returned native claim policies, catching a missing host depth, incorrectly activated stage, mismatched construction counterpart or checklist attached to the file rather than heading units.
 * @evidence contracts/testing.md#independent-expectations Literal file and heading depths, complete versus selected-pilot paths, unique same-depth lineage flags and three required checklist routes express the final-screenplay graph contract independently of builder helpers. This observes generated policy records, without claiming resident Markdown answers or native evaluator execution.
 * @evidence contracts/testing.md#distinguishing-cases Crosses complete and first-pilot scopes with disabled and review construction and all four expression stages; compares file lineage against H2, H3 and H4 checklist duties. Physical counterpart and heading-identity admission belong to test_evidence_final_screenplay_population.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_evidence_final_screenplay_claims entry owns all sixteen graph declarations and their returned records in-process, using the blank declaration factory without installing a consumer, reading a filesystem or starting a parser host.
 */
export function test_evidence_final_screenplay_claims(): void {
  const blank: IAutoMovieEvidenceConfigProps = createBlankAutoMovieProductionEvidence(
    "/production",
    "english",
  );
  const depths: readonly ["file", "h2", "h3", "h4"] = ["file", "h2", "h3", "h4"];
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
        const graph: IAutoMovieEvidenceConfigProps = {
          ...blank,
          populationScope: scope,
          screenplays: construction,
          naturalness: { screenplays: stage },
        };
        const group: string =
          scope.mode === "first-pilot" && construction !== "disabled"
            ? "001-first"
            : "*";
        const constructionFiles: string[] = [`screenplays/${group}/???-*.md`];
        const claims: ReturnType<typeof createAutoMovieScreenplayNaturalnessClaims> = createAutoMovieScreenplayNaturalnessClaims(graph);
        TestValidator.equals(
          "one lineage claim per host depth",
          claims.map(({ branch, claim }: typeof claims[number]): { branch: typeof claims[number]["branch"]; symbol: typeof claims[number]["claim"]["symbol"] } => ({ branch, symbol: claim.symbol })),
          depths.map((symbol: typeof depths[number]): { branch: "screenplayNaturalness"; symbol: typeof depths[number] } => ({
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
          const references: ITtscEvidenceGraphReference[] = Array.isArray(claim.reference)
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
                ].map((file: string): ITtscEvidenceGraphMarkdownReference => ({
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
}

import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";
import type { IAutoMovieEvidenceBranchClaim } from "./IAutoMovieEvidenceBranchClaim";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import type { ITtscEvidenceGraphReference } from "@ttsc/evidence";
import { DOCS } from "./DOCS";
import { MARKDOWN } from "./MARKDOWN";
import { authoredPopulationFiles } from "./authoredPopulationFiles";
import { branchClaims } from "./branchClaims";
import { createAutoMovieScreenplayNaturalnessReferences } from "./createAutoMovieScreenplayNaturalnessReferences";
import { finalScreenplayPopulationFiles } from "./finalScreenplayPopulationFiles";
import { requiresEvidence } from "./requiresEvidence";
import { revisionStage } from "./revisionStage";

/** Exact construction-screenplay counterpart for one final screenplay unit. */
function screenplayRevisionLineage(graph: IAutoMovieEvidenceConfigProps, symbol: "file" | "h2" | "h3" | "h4", review: boolean): ITtscEvidenceGraphReference {
  return ({
  type: "markdown",
  root: DOCS,
  files: authoredPopulationFiles(graph, "screenplays"),
  symbol,
  noEvidenceExclude: true,
  uniqueEvidence: true,
  singleEvidencePerSymbol: true,
  requireReview: review,
});
}

/**
 * Assemble final screenplay lineage and audience-language checklist claims.
 *
 * The graph factory uses this same pure assembly after validating stages and physical hosts, so file identity and unit-level expression remain distinct.
 *
 * @evidence contracts/common.md#principled-implementation Final screenplay files and canonical H2/H3/H4 units retain unique construction lineage and answer the audience-language naturalness checklists.
 * @evidence contracts/common.md#clear-and-simple-design Expression revision has its own branch while the same pure builder serves compiler graph and manifest projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Evidence and review activate structural duties equally; native review freshness remains false and no lexical score is produced.
 * @evidence contracts/common.md#meaningful-documentation The builder assumes stage and physical counterpart admission are performed by the graph factory.
 * @evidence contracts/performance.md#efficient-algorithms Output size follows the fixed screenplay depths and scope selectors; no Markdown bytes are read during pure assembly.
 * @evidence contracts/performance.md#reuse-equivalent-work One final selector array is reused across claims within the call; construction selector and reference records are rebuilt.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned claims and arrays; shared selectors within that result are not deeply frozen.
 */
export function createAutoMovieScreenplayNaturalnessClaims(graph: IAutoMovieEvidenceConfigProps): IAutoMovieEvidenceBranchClaim[] {
  const stage: AutoMovieEvidenceStage = revisionStage(graph);
  const review: boolean = false;
  const files: string[] = finalScreenplayPopulationFiles(graph);
  return [
    ...branchClaims("screenplayNaturalness", {
      name: "final screenplay files preserve their construction screenplay lineage",
      type: "markdown",
      root: DOCS,
      files,
      symbol: "file",
      disabled: !requiresEvidence(stage),
      reference: screenplayRevisionLineage(graph, "file", review),
    }),
    ...MARKDOWN.screenplays.headings.flatMap((depth: 2 | 3 | 4): IAutoMovieEvidenceBranchClaim[] =>
      branchClaims("screenplayNaturalness", {
        name: `final screenplay H${depth} units preserve construction identity and answer naturalness checklists`,
        type: "markdown",
        root: DOCS,
        files,
        symbol: `h${depth}` as "h2" | "h3" | "h4",
        disabled: !requiresEvidence(stage),
        reference: [
          screenplayRevisionLineage(
            graph,
            `h${depth}` as "h2" | "h3" | "h4",
            review,
          ),
          ...createAutoMovieScreenplayNaturalnessReferences(),
        ],
      }),
    ),
  ];
}

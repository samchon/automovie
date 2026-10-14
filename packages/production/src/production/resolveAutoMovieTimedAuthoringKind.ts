import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import type { IAutoMovieTimedAuthoringKind } from "./IAutoMovieTimedAuthoringKind";

/**
 * Resolve timed ownership from the graph-selected kind before project opening.
 *
 * Library returns null for the separate library coordinator. A supplied but
 * unselected declaration refuses; absent evidence alone retains legacy-film.
 *
 * @evidence contracts/common.md#principled-implementation A closed kind decision selects brief/film obligations, library dispatch or explicit unselected refusal; only undefined evidence enters the documented legacy compatibility mode.
 * @evidence contracts/common.md#clear-and-simple-design Project opening and timed attempt coordination consume one kind owner rather than guessing from files or repeated graph checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Library never masquerades as timed film and a present unselected graph cannot fall back to legacy; no resident output or directory spelling chooses the owner branch.
 * @evidence contracts/common.md#meaningful-documentation States dispatch-null, unselected refusal and absent-evidence legacy effects.
 * @evidence contracts/performance.md#efficient-algorithms One manifest-kind read and constant-size branch/allocation cost do not traverse graph owners, source text or output files.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The current supplied declaration is resolved directly each time and no cached mode survives an authoring-kind edit.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The small decision transfers to the caller with no retained evidence reference; refusal creates one Error and no project handle or task is opened.
 */
export function resolveAutoMovieTimedAuthoringKind(evidence: IAutoMovieProductionEvidence | undefined): IAutoMovieTimedAuthoringKind | null {
  const kind: IAutoMovieProductionEvidence["manifest"]["kind"] | null = evidence?.manifest.kind ?? null;
  if (evidence !== undefined && kind === null)
    throw new Error(
      "Select film, brief, or library in lint.config.ts before deriving, building, or linting a production.",
    );
  if (kind === "library") return null;
  if (kind === "brief")
    return {
      kind,
      ownerBranch: "briefs",
      screenplayRequired: false,
      evidenceBound: true,
    };
  return kind === "film"
    ? {
        kind,
        ownerBranch: "screenplays",
        screenplayRequired: true,
        evidenceBound: true,
      }
    : {
        kind: "legacy-film",
        ownerBranch: "screenplays",
        screenplayRequired: true,
        evidenceBound: false,
      };
}

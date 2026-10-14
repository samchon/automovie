/**
 * Timed compilation ownership selected from the declared production kind.
 *
 * Briefs skip the film screenplay ladder and use the briefs graph branch.
 * Films require it. Legacy-film exists only for callers without evidence.
 *
 * @evidence contracts/common.md#principled-implementation One resolved mode carries the graph owner branch and film-only obligation alongside whether current evidence selected it, so the coordinator and review stage act on the same declared kind.
 * @evidence contracts/common.md#clear-and-simple-design The resolver produces one small decision consumed by project opening, source compilation and review rather than rediscovering mode from resident artifacts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Legacy fallback is explicit and evidence-unbound; stale compiled film files cannot select film obligations for an authored brief.
 * @evidence contracts/common.md#meaningful-documentation States brief/film branch selection, screenplay obligation and absent-evidence compatibility meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The resolved data type executes no graph scan or compilation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The mode is a current declaration result and defines no cross-project cached answer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Four scalar fields belong to the owning build attempt without handles or scheduled work.
 */
export interface IAutoMovieTimedAuthoringKind {
  /** Selected timed-production shape, including the legacy fallback. */
  kind: "brief" | "film" | "legacy-film";
  /** Graph branch that owns the timed source document. */
  ownerBranch: "briefs" | "screenplays";
  /** Whether the film-only screenplay ladder must run. */
  screenplayRequired: boolean;
  /** Whether the selection came from current graph evidence. */
  evidenceBound: boolean;
}

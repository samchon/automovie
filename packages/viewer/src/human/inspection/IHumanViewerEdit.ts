/**
 * The last source edit that reached a build, as `/health` reports it.  The latest published source batch identifies changed files, observation time and moved domains. It is source-freshness context rather than a global causal event journal.
 *
 * @evidence contracts/common.md#principled-implementation Reports the most recent published source batch with repository-relative changed paths, wall-clock publication time and digest domains that actually moved.
 * @evidence contracts/common.md#clear-and-simple-design Keeps source-freshness context separate from capture first-frame timing and numerical build duration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One latest batch is not a complete causal event journal; empty moved domains do not prove a rendered frame is current.
 * @evidence contracts/common.md#meaningful-documentation Documents ISO publication time and browser/face/body/person domain labels without assigning anatomy or geometry meaning to source paths.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape performs no recomputation; revision owners traverse source graphs/hash bytes and the source owner projects changed paths.
 * @evidence contracts/performance.md#reuse-equivalent-work Latest edit context is reused for health while source invalidation recomputes actual domain identities; equal file names alone do not establish equal bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The source owner retains one latest batch whose path array scales with that batch, without historical event accumulation in this record.
 *
 * @author Samchon
 */
export interface IHumanViewerEdit {
  /** Edited files, relative to the repository root. */
  files: string[];

  /** ISO time the edit was published. */
  at: string;

  /** Revision domains the edit moved (`browser`, `face`, `body`, `person`). */
  moved: string[];
}

/**
 * The last source edit that reached a build, as `/health` reports it.
 *
 * The latest published source batch identifies changed files, observation time and moved domains. It is source-freshness context rather than a global causal event journal.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the edited files, the time and the build domains it moved.
 *
 * @evidence contracts/common.md#principled-implementation Edited paths, publication time and moved revision domains identify the source event a serving update follows.
 * @evidence contracts/common.md#clear-and-simple-design The record carries one edit batch rather than separate unrelated revision and timestamp histories.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Moved domains are the digest owner's observed changes rather than guesses from filename prefixes.
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

/**
 * The last source edit that reached a build, as `/health` reports it.
 *
 * The latest published source batch identifies changed files, observation time and moved domains. It is source-freshness context rather than a global causal event journal.
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

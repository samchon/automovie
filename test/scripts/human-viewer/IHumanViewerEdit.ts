/**
 * The last source edit that reached a build, as `/health` reports it.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the edited files, the time and the build domains it moved.
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

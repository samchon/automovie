/**
 * The revision domains an edit moved.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the moved domains.
 * @author Samchon
 */
export interface IHumanViewerMovedDomains {
  /** Domains whose digest changed (`browser`, `face`, `body`, `person`). */
  moved: string[];
}

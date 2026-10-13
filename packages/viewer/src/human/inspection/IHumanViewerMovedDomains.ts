/**
 * The revision domains an edit moved.
 *
 * @author Samchon
 */
export interface IHumanViewerMovedDomains {
  /** Domains whose digest changed (`browser`, `face`, `body`, `person`). */
  moved: string[];
}

/**
 * The revision domains an edit moved.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the moved domains.
 *
 * @evidence contracts/common.md#principled-implementation The digest owner reports which independent revision domains changed for one input batch.
 * @evidence contracts/common.md#clear-and-simple-design One moved-domain list is the watcher result without duplicating full digest state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Domains are reported from actual revision comparison rather than a hardcoded file-to-domain heuristic.
 *
 * @author Samchon
 */
export interface IHumanViewerMovedDomains {
  /** Domains whose digest changed (`browser`, `face`, `body`, `person`). */
  moved: string[];
}

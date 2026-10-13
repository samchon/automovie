/**
 * The revision domains an edit moved.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the moved domains.
 *
 * @evidence contracts/common.md#principled-implementation The digest owner reports which independent revision domains changed for one input batch.
 * @evidence contracts/common.md#clear-and-simple-design One moved-domain list is the watcher result without duplicating full digest state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Domains are reported from actual revision comparison rather than a hardcoded file-to-domain heuristic.
 *
 * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity The digest owner reports which independent revision domains changed for one input batch.
 * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Domains are reported from actual revision comparison rather than a hardcoded file-to-domain heuristic.
 *
 * @author Samchon
 */
export interface IHumanViewerMovedDomains {
  /**
   * Domains whose digest changed (`browser`, `face`, `body`, `person`).
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Reports actual changed source digest domains instead of deciding invalidation from filename similarity.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Reports actual changed source digest domains instead of deciding invalidation from filename similarity.
   */
  moved: string[];
}

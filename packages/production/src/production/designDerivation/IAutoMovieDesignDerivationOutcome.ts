/**
 * The observed created, updated or unchanged state of one successfully processed target.
 *
 * @evidence contracts/common.md#principled-implementation Run reports unchanged after canonical equality, otherwise created when the target was absent from supplied residents and updated when it was present, following accepted store output.
 * @evidence contracts/common.md#clear-and-simple-design Per-target outcomes retain original plan order while the manifest separately uses canonical target order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These states describe supplied inventory and accepted callback results, not independently inspected filesystem changes or a rollback-capable transaction.
 * @evidence contracts/common.md#meaningful-documentation Defines target/path and the exact resident-presence/equality meaning of created, updated and unchanged.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The type erases; comparison, parsing and actual store callbacks remain run's processing cost.
 * @evidence contracts/performance.md#reuse-equivalent-work An unchanged outcome comes from current canonical value equality, not a reused state label from an earlier run.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Successful run callers retain one small outcome per entry; later refusal can leave earlier store effects without a complete outcome array being returned.
 *
 * @author Samchon
 */
export interface IAutoMovieDesignDerivationOutcome {
  /** Stable logical target identity. */
  target: string;

  /** Canonical project-relative path of the published record. */
  recordPath: string;

  /** Whether the resident record was created, replaced, or already current. */
  state: "created" | "unchanged" | "updated";
}

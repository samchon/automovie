import { IAutoMovieLegacyImportPlan } from "./IAutoMovieLegacyImportPlan";

/**
 * Result of atomically applying or re-applying one legacy import plan.
 *
 * @evidence contracts/common.md#principled-implementation AutoMovieLegacyImporter publishes a staged state directory under root and revision leases, returning applied after publication or unchanged only when the persisted state and current legacy snapshot reproduce the same fingerprint.
 * @evidence contracts/common.md#clear-and-simple-design A status and the exact persisted plan report the successful effect; collisions and incomplete or different imports throw before any success result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unchanged is proved from bytes and plan identity rather than the presence of an automovie directory; import persists conservative drafts and provenance without claiming buildable source.
 * @evidence contracts/common.md#meaningful-documentation Defines the two successful states and ownership of the exact persisted plan; a failure has no output record.
 * @author Samchon
 */
export interface IAutoMovieLegacyImportApplyOutput {
  /** Whether state was created or the identical plan was already applied. */
  status: "applied" | "unchanged";

  /** Exact plan persisted by the import. */
  plan: IAutoMovieLegacyImportPlan;
}

import type { IAutoMovieRepaintAttemptClaim, AutoMovieRepaintClaimSettlement } from "./repaintAttemptClaim";

/**
 * Persist one request claim and its optional terminal settlement.
 *
 * @evidence contracts/common.md#principled-implementation Keeps the admitted attempt claim beside its settlement, with null until settled; project claim acquisition/settlement reopen and guard the same stored generation before updating it.
 * @evidence contracts/common.md#clear-and-simple-design A stored record separates claim ownership from terminal outcome without introducing a second current-owner index.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The carrier does not invent expiry, retry authority or a successful settlement; admission and execution-policy checks remain with claim operations.
 * @evidence contracts/common.md#meaningful-documentation Defines claim and null settlement meaning; this shape alone does not prove the file or lease is current.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record chooses no lease or retry algorithm; acquisition and settlement own the filesystem work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Stored claim identity is not a cached execution result or permission for another attempt.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Project storage owns the record and reopened references; this type acquires no lease descriptor or task.
 * @author Samchon
 */
export interface IAutoMovieProductionProjectStoredRepaintClaim {
  /** Exact claim accepted for this request generation. */
  claim: IAutoMovieRepaintAttemptClaim;

  /** Terminal result, or null while this claim remains unsettled. */
  settlement: AutoMovieRepaintClaimSettlement | null;
}

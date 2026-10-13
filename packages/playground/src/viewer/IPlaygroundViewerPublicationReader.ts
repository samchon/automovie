/**
 * Effects for reading the source receipt around the producer's publication lock. The held receipt and refreshed bytes belong to the source owner; this interface neither creates a lock nor guarantees an atomic filesystem snapshot.
 *
 * @evidence contracts/common.md#principled-implementation Separate current/locked/refresh operations let the reader refuse locked candidates and replace a receipt that observed an intermediate locked membership after release.
 * @evidence contracts/common.md#clear-and-simple-design Four injected effects keep disk/source ownership outside the publication guard and preserve the retaining host's independent displayed page.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lock absence is not content/admission validity or atomic IO proof, and refresh failures remain owner errors rather than a fabricated unlocked receipt.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes held receipt, publication exclusion and filesystem atomicity limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface chooses no membership scan, digest or locking algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Receipt reuse/invalidation belongs to the concrete reader/source owners.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This effect schema acquires no filesystem watcher, receipt cache or renderer handle.
 *
 * @author Samchon
 */
export interface IPlaygroundViewerPublicationReader<T> {
  /**
   * Borrow the currently held source receipt without mutating it.
   *
   * @evidence contracts/common.md#principled-implementation The guard reads the source owner's actual receipt instead of recomputing or assigning its state.
   * @evidence contracts/common.md#clear-and-simple-design Read-only access separates receipt retention from refresh effects.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A held receipt is not proof that publication is unlocked or source contents are current.
   * @evidence contracts/common.md#meaningful-documentation The member states borrowed held data and no mutation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The type selects no lookup/copy algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It declares no freshness key or cache strategy itself.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Receipt retention and external references remain source/caller-owned.
   */
  current: () => T;

  /**
   * Observe whether the producer's publication lock currently exists.
   *
   * @evidence contracts/common.md#principled-implementation Actual lock presence guards admission around the producer's supported publication transaction.
   * @evidence contracts/common.md#clear-and-simple-design One predicate keeps publication state independent from receipt contents.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A false observation does not promise atomic subsequent reads or healthy source data.
   * @evidence contracts/common.md#meaningful-documentation The member defines call-time lock observation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The type implements no filesystem existence operation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It asserts no lock-result reuse across calls.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Lock acquisition/release belongs to the producer, not this observer.
   */
  locked: () => boolean;

  /**
   * Reread owned source membership/bytes and update its retained receipt; failures propagate.
   *
   * @evidence contracts/common.md#principled-implementation Rereading after lock release prevents an intermediate locked membership from becoming the admitted receipt.
   * @evidence contracts/common.md#clear-and-simple-design The source owner performs IO while the publication guard decides when it is needed.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed IO is not silently replaced by a fabricated success or guessed bytes.
   * @evidence contracts/common.md#meaningful-documentation The member states refreshed dimensions, retention effect and failure propagation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Source scans/digests are implementation-owned.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Refresh invalidation/reuse is not implemented by this signature.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Watchers, IO and receipt storage belong to the source implementation.
   */
  refresh: () => void;

  /** The receipt input key that records the lock, `"missing"` when absent. */
  lockInput: string;
}

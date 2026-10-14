import type { IAutoMovieModel } from "@automovie/interface";

/**
 * Borrowed model and cooperative scheduling hooks for a contact observation. Current callers supply an admitted static bone-partitioned skin; the engine still skips non-mesh parts if another model is passed. Model geometry and placement must remain unchanged across awaited yields.
 *
 * @evidence contracts/common.md#principled-implementation One model supplies actual placed skin, with host yield and request-version predicates controlling observation supersession between completed work units.
 * @evidence contracts/common.md#clear-and-simple-design Contact computation owns traversal, while host scheduling and newer-request identity enter through explicit callbacks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The source model is not replaced by expected contact counts, and supersession is separate from a healthy-geometry verdict.
 * @evidence contracts/common.md#meaningful-documentation The prose gives immutable borrowed-model and static skin premises; members explain cooperative yielding and version checks.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This props record executes no contact traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Repeated part placement is owned by the reader and engine, not the schema.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type owns no model buffer or pending task lifetime.
 *
 * @author Samchon
 */
export interface IReadConnectedBodyContactsProps {
  /** The posed skin partitioned into one part per bone segment. */
  model: IAutoMovieModel;

  /** Millisecond yield threshold checked after a complete part or pair; one synchronous unit may exceed it. */
  sliceMs: number;

  /**
   * Await a host scheduling boundary so a queued request can run; rejection aborts the contact read.
   *
   * @evidence contracts/common.md#principled-implementation The reader awaits this hook after its elapsed threshold, then evaluates the request-version predicate.
   * @evidence contracts/common.md#clear-and-simple-design The caller owns the event-loop mechanism while the reader owns traversal checkpoints.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback must genuinely yield to the host; resolving without host scheduling is not claimed to service worker messages.
   * @evidence contracts/common.md#meaningful-documentation The prose specifies awaiting and rejection behavior.
   * @evidence contracts/performance.md#efficient-algorithms Host scheduling cost is callback-defined and occurs once per elapsed checkpoint.
   * @evidence contracts/performance.md#reuse-equivalent-work Each yield is an effectful checkpoint and is not shared as a cached computation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The read awaits the returned task, while the callback owns host handles; no timeout or cancellation protocol is specified.
   */
  yieldThread: () => Promise<unknown>;

  /**
   * Return whether a newer transaction makes this observation obsolete. The runtime compares its captured request ordinal with the latest received ordinal; callback exceptions propagate.
   *
   * @evidence contracts/common.md#principled-implementation A current transaction-identity predicate decides whether partial contact results are discarded as null.
   * @evidence contracts/common.md#clear-and-simple-design Request sequencing stays with the runtime rather than being inferred from geometry equality.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Supersession does not certify geometry or replace a failed contact query with an empty successful result.
   * @evidence contracts/common.md#meaningful-documentation The prose explains request-version authority and exception propagation.
   * @evidence contracts/performance.md#efficient-algorithms The normal runtime callback compares two ordinals in constant work; other implementations own their predicate cost.
   * @evidence contracts/performance.md#reuse-equivalent-work The predicate is read at each checkpoint because request identity can change while the operation yields.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The reader retains the callback only for the pending call; it creates no subscription or background watcher.
   */
  superseded: () => boolean;
}

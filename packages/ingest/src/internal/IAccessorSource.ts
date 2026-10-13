

/**
 * One inspector call's admitted accessor metadata and borrowed resident buffers.
 *
 * @evidence contracts/common.md#principled-implementation Three aligned inventories preserve glTF index references after structure and payload closure checks.
 * @evidence contracts/common.md#clear-and-simple-design Accessor metadata, views and payload references share one call-local reader input instead of unrelated argument arrays.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Resident buffers are borrowed rather than copied, and callers must not mutate them during synchronous inspection.
 * @evidence contracts/common.md#meaningful-documentation Member comments identify index ordering, admitted offsets and borrowed payload lifetime.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The reader-input type executes no accessor decoding or payload-range traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type carries already admitted inventories reused by motion and skin readers without owning computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This input record owns no payload allocation or handle; the synchronous inspector bounds reference lifetime.
 * @author Samchon
 */
export interface IAccessorSource {
  /** Admitted glTF accessor records in source index order. */
  accessors: unknown[];

  /** Admitted byte-view records whose indices resolve inside the payload inventory. */
  bufferViews: unknown[];

  /** Buffers borrowed by readers from the inspector, indexed by declared glTF buffers; data-URI arrays belong to that call and sidecar/BIN bytes remain borrowed from its caller. */
  payloads: Uint8Array[];
}

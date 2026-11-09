/**
 * One inspector call's admitted accessor metadata and borrowed resident buffers.
 *
 * @evidence contracts/development/design.md#principled-representation Three aligned inventories preserve glTF index references after structure and payload closure checks.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Accessor metadata, views and payload references share one call-local reader input instead of unrelated argument arrays.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Resident buffers are borrowed rather than copied, and callers must not mutate them during synchronous inspection.
 * @evidence contracts/development/common.md#meaningful-documentation Member comments identify index ordering, admitted offsets and borrowed payload lifetime.
 */
export interface IAccessorSource {
  /** Admitted glTF accessor records in source index order. */
  accessors: unknown[];

  /** Admitted byte-view records whose indices resolve inside the payload inventory. */
  bufferViews: unknown[];

  /** Buffers borrowed by readers from the inspector, indexed by declared glTF buffers; data-URI arrays belong to that call and sidecar/BIN bytes remain borrowed from its caller. */
  payloads: Uint8Array[];
}

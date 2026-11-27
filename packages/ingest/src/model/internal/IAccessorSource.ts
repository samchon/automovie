/*
 * One inspector call's admitted accessor metadata and borrowed resident
 * buffers.
 */
export interface IAccessorSource {
  /*
   * Admitted glTF accessor records in source index order.
   */
  accessors: unknown[];

  /*
   * Admitted byte-view records whose indices resolve inside the payload
   * inventory.
   */
  bufferViews: unknown[];

  /*
   * Buffers borrowed by readers from the inspector, indexed by declared glTF
   * buffers; data-URI arrays belong to that call and sidecar/BIN bytes remain
   * borrowed from its caller.
   */
  payloads: Uint8Array[];
}

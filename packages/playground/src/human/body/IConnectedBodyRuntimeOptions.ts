/**
 * Options of `createConnectedBodyRuntime`.
 *
 * Contact readings and the arms-down solve hold the worker thread for at most
 * `sliceMs` before yielding through `yieldThread`.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Bounds how long one contact reading holds the worker so preview edits stay responsive.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Keeps time slicing with the resident runtime rather than the document.
 * @author Samchon
 */
export interface IConnectedBodyRuntimeOptions {
  /** Longest stretch a contact reading holds the thread, milliseconds. */
  sliceMs?: number;

  /** Hand the thread back; a macrotask by default so queued messages run. */
  yieldThread?: () => Promise<unknown>;
}

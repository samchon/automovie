/**
 * Caller-selected immutable typed head/body definitions for one person editor.
 * These URLs are asset inputs, separate from the numerical person document.
 * The normal generation consumer checks their identity, schema and geometry.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Names the body definition shared by the editor and its workers.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Keeps selected source definitions separate from authored numerical controls.
 * @author Samchon
 */
export interface IConnectedPersonSourceUrls {
  /** URL of the existing typed head partition view, including its generation id. */
  head: string;

  /** URL of its paired typed body view; no personal vertices enter the document. */
  body: string;
}

/**
 * Caller-selected immutable typed head/body definitions for one person editor.
 * These URLs are asset inputs, separate from the numerical person document.
 * The normal generation consumer checks their identity, schema and geometry.
 *
 * @author Samchon
 */
export interface IConnectedPersonSourceUrls {
  /** URL of the existing typed head partition view, including its generation id. */
  head: string;

  /** URL of its paired typed body view; no personal vertices enter the document. */
  body: string;
}

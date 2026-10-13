/**
 * A worker request for one numerical preview of a body document.
 *
 * `measure` asks for surface crossings and `anatomy` for the humeral head
 * reading; the reply's buffers belong to this transaction.
 *
 * @author Samchon
 */
export interface IConnectedBodyPreviewRequest {
  /**
   * Request kind.
   *
   */
  operation: "preview";

  /**
   * Serialized document to evaluate.
   *
   */
  document: string;

  /**
   * Whether surface crossings are read for this preview.
   *
   */
  measure: boolean;

  /**
   * Whether the humeral head reading is produced.
   *
   */
  anatomy?: boolean;
}

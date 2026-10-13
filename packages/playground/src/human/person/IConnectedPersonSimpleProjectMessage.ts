/**
 * Project simple values from the exact current person rather than a standard
 * head paired with its body.
 */
export interface IConnectedPersonSimpleProjectMessage {
  /** Transport request identity. */
  id: number;

  /** Projection operation. */
  kind: "projectPersonSimple";

  /** Current whole-person document text. */
  document: string;
}

/** One immutable source input's relative locator and exact raw byte authority.
 * Legacy receipts may omit size; new publications always record it.
 * @author Samchon
 */
export interface IHumanHeadSourceInputEntry {
  /** Resolved relative to the owning source-inputs.json directory. */
  path: string;

  /** Lowercase SHA-256 of consumed bytes, before JSON decoding. */
  sha256: string;

  /** Exact raw size when recorded by the original authority. */
  bytes?: number;
}

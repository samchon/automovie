/**
 * A basis digest participating in a person key.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the digest.
 * @author Samchon
 */
export interface IHumanViewerPersonKeyDigest {
  /** Hex SHA-256 of the basis or packet bytes. */
  digest: string;
}

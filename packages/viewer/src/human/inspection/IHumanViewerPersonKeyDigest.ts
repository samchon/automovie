/**
 * A basis digest participating in a person key.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the digest.
 *
 * @evidence contracts/common.md#principled-implementation The digest is a file-byte SHA-256 witness participating in Person cache identity.
 * @evidence contracts/common.md#clear-and-simple-design Only the byte digest needed by key composition is projected.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A basis filename or packet id cannot replace its content digest for cache authority.
 *
 * @author Samchon
 */
export interface IHumanViewerPersonKeyDigest {
  /** Hex SHA-256 of the basis or packet bytes. */
  digest: string;
}

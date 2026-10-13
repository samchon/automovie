/**
 * The identity a basis opens with and the SHA-256 of its bytes.
 *
 * @evidence contracts/common.md#principled-implementation Pairs the declared identity with the digest that keys numerical generations.
 * @evidence contracts/common.md#meaningful-documentation Names both members.
 *
 * @evidence contracts/common.md#clear-and-simple-design One record pairs the declared id with the file-byte digest used by cache authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The digest describes observed basis bytes; a matching display name cannot replace that witness.
 *
 * @author Samchon
 */
export interface IHumanViewerBasisIdentity {
  /** The basis `id`. */
  id: string;

  /** Hex SHA-256 of the basis file bytes. */
  digest: string;
}

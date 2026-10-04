/**
 * The identity a basis opens with and the SHA-256 of its bytes.
 *
 * @evidence contracts/common.md#principled-implementation Pairs the declared identity with the digest that keys numerical generations.
 * @evidence contracts/common.md#meaningful-documentation Names both members.
 * @author Samchon
 */
export interface IHumanViewerBasisIdentity {
  /** The basis `id`. */
  id: string;

  /** Hex SHA-256 of the basis file bytes. */
  digest: string;
}

/**
 * The identity a basis opens with and the SHA-256 of its bytes.
 *
 * @author Samchon
 */
export interface IHumanViewerBasisIdentity {
  /** The basis `id`. */
  id: string;

  /** Hex SHA-256 of the basis file bytes. */
  digest: string;
}

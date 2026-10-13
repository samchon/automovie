/**
 * The identity a basis opens with and the SHA-256 of its bytes.
 *
 * @evidence contracts/common.md#principled-implementation Pairs the declared identity with the digest that keys numerical generations.
 * @evidence contracts/common.md#meaningful-documentation Names both members.
 *
 * @evidence contracts/common.md#clear-and-simple-design One record pairs the declared id with the file-byte digest used by cache authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The digest describes observed basis bytes; a matching display name cannot replace that witness.
 *
 * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Pairs the declared identity with the digest that keys numerical generations.
 * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest The digest describes observed basis bytes; a matching display name cannot replace that witness.
 *
 * @author Samchon
 */
export interface IHumanViewerBasisIdentity {
  /**
   * The basis `id`.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Preserves the basis identity declared inside its bytes rather than inferring it from a file name.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Preserves the basis identity declared inside its bytes rather than inferring it from a file name.
   */
  id: string;

  /**
   * Hex SHA-256 of the basis file bytes.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Supplies the exact basis-byte SHA-256 used in numerical cache and generation authority.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Supplies the exact basis-byte SHA-256 used in numerical cache and generation authority.
   */
  digest: string;
}

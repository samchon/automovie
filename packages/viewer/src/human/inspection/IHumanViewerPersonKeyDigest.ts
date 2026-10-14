/**
 * A basis digest participating in a person key.
 *
 * @evidence contracts/common.md#principled-implementation Names the full byte digest of a basis/view or candidate packet participating in a person's canonical key tuple.
 * @evidence contracts/common.md#clear-and-simple-design One field lets published pair and single packet callers share the key owner without wrapper-specific hashing behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A digest identifies bytes rather than physiological admission or authenticated provenance; the plain string type does not enforce hex shape.
 * @evidence contracts/common.md#meaningful-documentation Documents SHA-256 byte meaning and basis/packet role instead of treating display identity as numerical authority.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record hashes nothing; source/sidecar readers hash bytes and humanViewerPersonKey serializes the resulting tuple.
 * @evidence contracts/performance.md#reuse-equivalent-work Same packet digest may participate for both sides while paired views supply separate digests; full document/runtime authorities are still required.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A retained digest string owns no asset buffer or native descriptor; basis readers and catalogue owners retain their own populations.
 *
 * @author Samchon
 */
export interface IHumanViewerPersonKeyDigest {
  /** Hex SHA-256 of the basis or packet bytes. */
  digest: string;
}

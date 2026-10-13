/**
 * The identities read from a large JSON packet without parsing it.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the packet id and the member ids.
 *
 * @evidence contracts/common.md#principled-implementation The record projects packet and immediate member identities found by the streaming structural scan.
 * @evidence contracts/common.md#clear-and-simple-design Only top-level id-bearing members enter the identity map; packet interpretation stays with its owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Member ids are read from packet content and are never inferred from its filename.
 *
 * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure The record projects packet and immediate member identities found by the streaming structural scan.
 * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Member ids are read from packet content and are never inferred from its filename.
 *
 * @author Samchon
 */
export interface IHumanViewerPacketIdentities {
  /**
   * The packet's top-level `id`.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Retains the top-level identity actually read from the packet's structural content.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Retains the top-level identity actually read from the packet's structural content.
   */
  id: string;

  /**
   * For each top-level member whose value is an object opening with an `id` string, that id.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Maps only actual id-bearing top-level object members without inferring identities from file names.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Maps only actual id-bearing top-level object members without inferring identities from file names.
   */
  members: Record<string, string>;
}

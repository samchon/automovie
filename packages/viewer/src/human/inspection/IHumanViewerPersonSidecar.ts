/**
 * What the viewer reads from a person candidate packet
 * `<name>.person.json.gz`: its own identity and the identities of the face
 * and body bases it carries. The rest of the packet belongs to the Person
 * owner's generation type and is admitted where it is built.
 *
 * @evidence contracts/common.md#principled-implementation Exposes the two basis identities a person document must name, read from the packet itself.
 * @evidence contracts/common.md#meaningful-documentation States what is read and who admits the rest.
 *
 * @evidence contracts/common.md#clear-and-simple-design Packet id and two enclosed basis ids are the only facts the catalogue needs from a Person packet.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The enclosed face and body identities are read from packet contents, not manufactured from its file name.
 *
 * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Exposes the two basis identities a person document must name, read from the packet itself.
 * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest The enclosed face and body identities are read from packet contents, not manufactured from its file name.
 *
 * @author Samchon
 */
export interface IHumanViewerPersonSidecar {
  /**
   * The packet `id`.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Keeps the Person packet's declared identity from its actual bytes.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Keeps the Person packet's declared identity from its actual bytes.
   */
  id: string;

  /**
   * `id` of the face basis inside the packet.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Carries the id of the enclosed Face basis rather than a name-derived guess.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Carries the id of the enclosed Face basis rather than a name-derived guess.
   */
  face: string;

  /**
   * `id` of the body basis inside the packet.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Carries the id of the enclosed Body basis rather than an assumed published default.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Carries the id of the enclosed Body basis rather than an assumed published default.
   */
  body: string;
}

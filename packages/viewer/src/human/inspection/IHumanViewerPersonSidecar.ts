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
 * @author Samchon
 */
export interface IHumanViewerPersonSidecar {
  /** The packet `id`. */
  id: string;

  /** `id` of the face basis inside the packet. */
  face: string;

  /** `id` of the body basis inside the packet. */
  body: string;
}

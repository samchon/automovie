/**
 * What the viewer reads from a person candidate packet
 * `<name>.person.json.gz`: its own identity and the identities of the face
 * and body bases it carries. The rest of the packet belongs to the Person
 * owner's generation type and is admitted where it is built.
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

/**
 * What the catalogue needs of the published person generation to build the
 * standard people on it: the view basis ids their documents name and the
 * digests of both view files for their cache keys.
 *
 * @evidence contracts/common.md#principled-implementation Names the basis ids read from the views themselves and keys the people by both files' bytes.
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 * @author Samchon
 */
export interface IHumanViewerPublishedGeneration {
  /** `face.id` of the head view, the face basis the standard people name. */
  face: string;

  /** `body.id` of the body view, the body basis the standard people name. */
  body: string;

  /** Hex SHA-256 of the head view file. */
  headDigest: string;

  /** Hex SHA-256 of the body view file. */
  bodyDigest: string;
}

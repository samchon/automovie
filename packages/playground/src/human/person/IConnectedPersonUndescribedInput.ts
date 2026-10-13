/**
 * A family of person-document inputs whose owner publishes no range
 * descriptor the page can read: its document paths, the unit the document
 * type states, and where the person screen edits it.
 *
 * @author Samchon
 */
export interface IConnectedPersonUndescribedInput {
  /** The document paths of the family, with `{a,b}` alternatives and `*` members. */
  paths: string;

  /** The unit the document type states for these values. */
  unit: string;

  /** The section of the person screen that edits them. */
  edited: string;
}

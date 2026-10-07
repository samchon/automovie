/**
 * A family of person-document inputs whose owner publishes no range
 * descriptor the page can read: its document paths, the unit the document
 * type states, and where the person screen edits it.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Records an input family the editor reaches without an owner-published range.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Says in which section of the screen the family is edited.
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

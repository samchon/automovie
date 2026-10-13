/**
 * What the catalogue reads of a published face subject: its id and display name. The rest is face document JSON admitted by the face owner when built.
 *
 * @evidence contracts/common.md#principled-implementation Catalogue composition reads only a subject identity and optional display name; the face owner admits the remaining document.
 * @evidence contracts/common.md#clear-and-simple-design A minimal projection avoids duplicating the complete face-document schema in catalogue code.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing optional display name is preserved rather than used to fabricate anatomical authoring data.
 * @evidence contracts/common.md#meaningful-documentation States the catalogue's identity/name boundary and the face owner's separate JSON admission.
 * @author Samchon
 */
export interface IHumanViewerSubjectDocument {
  /** Subject id. */
  id: string;

  /** Display name, when the subject has one. */
  name?: string;
}

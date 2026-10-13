/**
 * What the catalogue reads of a published face subject: its id and display name. The rest is face document JSON admitted by the face owner when built.
 *
 * @evidence contracts/common.md#principled-implementation Catalogue composition reads only a subject identity and optional display name; the face owner admits the remaining document.
 * @evidence contracts/common.md#clear-and-simple-design A minimal projection avoids duplicating the complete face-document schema in catalogue code.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing optional display name is preserved rather than used to fabricate anatomical authoring data.
 * @evidence contracts/common.md#meaningful-documentation States the catalogue's identity/name boundary and the face owner's separate JSON admission.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Catalogue composition reads only a subject identity and optional display name; the face owner admits the remaining document.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document A minimal projection avoids duplicating the complete face-document schema in catalogue code.
 * @author Samchon
 */
export interface IHumanViewerSubjectDocument {
  /**
   * Subject id.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Subject id. Catalogue composition reads only a subject identity and optional display name; the face owner admits the remaining document.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Subject id. A minimal projection avoids duplicating the complete face-document schema in catalogue code.
   */
  id: string;

  /**
   * Display name, when the subject has one.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Display name, when the subject has one. Catalogue composition reads only a subject identity and optional display name; the face owner admits the remaining document.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Display name, when the subject has one. A minimal projection avoids duplicating the complete face-document schema in catalogue code.
   */
  name?: string;
}

/**
 * What the catalogue reads of a published face subject: its id and display name. The rest is face document JSON admitted by the face owner when built.
 *
 * @author Samchon
 */
export interface IHumanViewerSubjectDocument {
  /** Subject id. */
  id: string;

  /** Display name, when the subject has one. */
  name?: string;
}

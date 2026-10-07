/**
 * What the catalogue reads of a published face subject: its id and display
 * name. The rest is face document JSON admitted by the face owner when built.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the members the catalogue reads.
 * @author Samchon
 */
export interface IHumanViewerSubjectDocument {
  /** Subject id. */
  id: string;

  /** Display name, when the subject has one. */
  name?: string;
}

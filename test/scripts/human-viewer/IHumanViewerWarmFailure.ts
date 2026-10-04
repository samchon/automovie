/**
 * One document a warm pass could not draw, with the reason.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the document and the reason.
 * @author Samchon
 */
export interface IHumanViewerWarmFailure {
  /** Document id. */
  id: string;

  /** Why its capture failed. */
  reason: string;
}

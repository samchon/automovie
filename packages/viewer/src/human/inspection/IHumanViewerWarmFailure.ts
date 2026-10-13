/**
 * One document a warm pass could not draw, with the reason.
 *
 * @author Samchon
 */
export interface IHumanViewerWarmFailure {
  /** Document id. */
  id: string;

  /** Why its capture failed. */
  reason: string;
}

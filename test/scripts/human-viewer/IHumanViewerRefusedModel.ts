/**
 * A document the numerical builder refused during a capture run.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the document and the refusal.
 * @author Samchon
 */
export interface IHumanViewerRefusedModel {
  /** Document id. */
  model: string;

  /** The builder's refusal. */
  reason: string;
}

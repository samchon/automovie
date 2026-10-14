/**
 * Read a person measurement on a person's final skin at rest. The registered measurement is named by its body channel and evaluated on the parsed complete person through the worker's paired one-skin evaluator. Replies carry metres or a named request-correlated refusal, not editor admission.
 *
 * @evidence contracts/common.md#principled-implementation The discriminant and registered channel select the complete-person instrument on final rest skin while id correlates numerical success or refusal.
 * @evidence contracts/common.md#clear-and-simple-design The message carries complete document context and measurement identity while worker parsing/evaluation and panel state remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A body-only proxy does not replace the whole-person reading, and requested measurement cannot itself certify clinical or editor validity.
 * @evidence contracts/common.md#meaningful-documentation The comment states registered-channel identity, paired one-skin provenance, rest state, metre result and correlated refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The request schema chooses no parse, rest construction or instrument algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request correlation defines no numerical-cache identity across document or channel changes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Worker requests and compiled generation lifetime remain transport-owned rather than acquired by this type.
 *
 * @author Samchon
 */
export interface IConnectedPersonReadMessage {
  /** Correlates the reply. */
  id: number;

  /** The request kind. */
  kind: "readPersonMeasurement";

  /** Serialized person document. */
  document: string;

  /** Body channel that names the person measurement. */
  channel: string;
}

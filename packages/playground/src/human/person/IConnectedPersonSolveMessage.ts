/**
 * Solve a person measurement along its body channel for a target.
 *
 * Targets are metres and trials read the complete person's final rest skin within paired head/body support. The returned candidate changes that one channel, preserves other authored fields and labels requested-target source-sample membership separately from feasibility or clinical validity.
 *
 * @evidence contracts/common.md#principled-implementation Registered measurement/channel identity, complete person context and metre target select the paired one-channel rest-skin inverse with request-correlated outcomes.
 * @evidence contracts/common.md#clear-and-simple-design Transport describes the target while the worker owns bracketing/readback and the panel owns current candidate admission/history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing head endpoint drivers and unreachable targets refuse, other channels do not hide a miss and outside-source-sample is not a personal feasibility clamp.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies metre units, complete rest skin, paired support, preserved authored fields and distinct sample classification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The request implements no inverse iteration, rest construction or source-sample algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Correlation declares no reusable solve equivalence across document, channel or target changes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The message owns no worker queue, compiled generation or prepared renderer frame.
 *
 * @author Samchon
 */
export interface IConnectedPersonSolveMessage {
  /** Correlates the reply. */
  id: number;

  /** The request kind. */
  kind: "solvePersonMeasurement";

  /** Serialized person document. */
  document: string;

  /** Body channel that names the person measurement. */
  channel: string;

  /** Target value, metres. */
  targetMetres: number;
}

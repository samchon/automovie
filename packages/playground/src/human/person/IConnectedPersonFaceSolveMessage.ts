/**
 * Solve one face measurement target onto the channels the measurement lists. The worker resolves this registered measurement, evaluates candidate weights on complete person constructions, replaces its recorded target and returns a candidate document with readings. The editor separately submits that candidate under current intent authority.
 *
 * @evidence contracts/common.md#principled-implementation The request carries complete person context, registered measurement identity and a target in the registry unit for the worker's own-channel inverse.
 * @evidence contracts/common.md#clear-and-simple-design The schema separates numerical candidate production from the editor's complete-document transaction and history admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unknown measurement or unreadable candidate is refused by the numerical owner rather than guessed from its name or committed by the request.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies registered channels, complete-person evaluation, target replacement, reading output and separate editor intent admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This request type implements no target bracketing, generation compilation or construction algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The message declares correlation rather than cached inverse equivalence across documents and targets.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Request settlement and resident generation lifetime belong to its transport and numerical worker.
 *
 * @author Samchon
 */
export interface IConnectedPersonFaceSolveMessage {
  /** Correlates the reply. */
  id: number;

  /** The request kind. */
  kind: "solveFaceMeasurement";

  /** Serialized person document. */
  document: string;

  /** Registered face measurement name. */
  measurement: string;

  /** Requested value in the measurement's unit. */
  target: number;
}

import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * What the measurement worker returns for a solved head: the person with its head channels set, every head measurement remeasured on it, and the departure from the standard head the solve chose. Departure is the Euclidean norm of channel weights multiplied by their signed endpoint RMS displacement scales. It ignores interactions between channel displacements and is not an independent measurement of total composed skin movement. Numerical candidate completion still precedes the panel's admission and history decision.
 *
 * @evidence contracts/common.md#principled-implementation Solved complete document and final rest-skin readings accompany the numerical owner's endpoint-scale departure objective in metres.
 * @evidence contracts/common.md#clear-and-simple-design This result transports the numerical candidate and its reporting values while the panel owns current intent, publication and history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The departure objective is identified as an independent-channel proxy, not composed-skin readback or clinical validity, and a return does not certify editor admission.
 * @evidence contracts/common.md#meaningful-documentation The comment explains signed endpoint RMS scales, norm construction, ignored cross-effects and the separate admission boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The output type chooses no solve, remeasurement or displacement-scale algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Returned values describe one candidate without implementing cross-request numerical reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Serialized document and scalar records own no resident worker or GPU frame.
 *
 * @author Samchon
 */
export interface IConnectedPersonHeadSolution {
  /** The person with the solve's head channels set. */
  document: IAutoMovieHumanPersonDocument;

  /** Every head measurement remeasured on the solved person, metres, by name. */
  readings: Record<string, number>;

  /** Independent-channel endpoint RMS departure norm in metres; channel interaction terms are omitted. */
  departureMetres: number;
}

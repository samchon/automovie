import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * What the measurement worker returns for a solved head: the person with its
 * head channels set, every head measurement remeasured on it, and the
 * departure from the standard head the solve chose.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Returns the solved person and what its head actually measures.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Reports the remeasured values and the departure separately from the targets.
 * @author Samchon
 */
export interface IConnectedPersonHeadSolution {
  /** The person with the solve's head channels set. */
  document: IAutoMovieHumanPersonDocument;

  /** Every head measurement remeasured on the solved person, metres, by name. */
  readings: Record<string, number>;

  /** The solved channels' departure from the standard head, metres of skin. */
  departureMetres: number;
}

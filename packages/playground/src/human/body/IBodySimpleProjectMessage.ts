import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "@automovie/human";

/**
 * Project a detailed shape onto the simple tier.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Requests the projection of a detailed shape back onto the simple tier the user reads.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Carries the detailed shape the worker projects onto the simple parameters.
 * @author Samchon
 */
export interface IBodySimpleProjectMessage {
  /** Correlates the reply. */
  id: number;

  /** Request discriminant. */
  kind: "project";

  /** The detailed channel weights to project. */
  shape: Record<string, number>;

  /** Anatomical measurements the builder solves into the weights, if any. */
  anatomy?: IAutoMovieHumanBodyAnatomicalMeasurements;
}

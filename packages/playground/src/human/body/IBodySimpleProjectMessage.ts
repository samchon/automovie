import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "@automovie/human";

/**
 * Project a detailed shape onto the simple tier.
 *
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

import type { IAutoMovieHumanBodySimpleShapeSiri } from "./IAutoMovieHumanBodySimpleShapeSiri";

/**
 * The simple tier's mass model: Siri's density equation and the body fat
 * fraction band the model is trusted over.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeMass {
  /** Siri's density equation. */
  siri: IAutoMovieHumanBodySimpleShapeSiri;

  /** The trusted body fat fraction band, `[low, high]`. */
  fatFraction: [number, number];
}

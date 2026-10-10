import type { IAutoMovieHumanPersonHeadShapeFieldSource } from "./IAutoMovieHumanPersonHeadShapeFieldSource";

/**
 * Numerical authoring registration produced by one shared head generation.
 * The descriptor identity binds the sampled fields to that generation;
 * availability never follows a nearby coordinate or an asset name.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadShapeSource {
  /** Shared skin/part generation that emitted these endpoint records. */
  generation: string;

  /** Actual source traits supported by that generation, with unique IDs. */
  fields: IAutoMovieHumanPersonHeadShapeFieldSource[];
}

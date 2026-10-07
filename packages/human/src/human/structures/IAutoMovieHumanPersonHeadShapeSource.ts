import type { IAutoMovieHumanPersonHeadShapeFieldSource } from "./IAutoMovieHumanPersonHeadShapeFieldSource";

/**
 * Numerical authoring registration produced by one shared head generation.
 * The descriptor identity binds the sampled fields to that generation;
 * availability never follows a nearby coordinate or an asset name.
 *
 * @evidence contracts/common.md#principled-implementation Generation identity and source-owned field records bind requests to the actual shared-root endpoint population.
 * @evidence contracts/common.md#clear-and-simple-design One generation identity and its ordered trait records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omission declares no support; the resolver cannot infer a field from old source coordinates.
 * @evidence contracts/common.md#meaningful-documentation States source-generation ownership and unavailable registration semantics.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The individual source field registration owns its geometric and clinical qualification.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadShapeSource {
  /** Shared skin/part generation that emitted these endpoint records. */
  generation: string;

  /** Actual source traits supported by that generation, with unique IDs. */
  fields: IAutoMovieHumanPersonHeadShapeFieldSource[];
}

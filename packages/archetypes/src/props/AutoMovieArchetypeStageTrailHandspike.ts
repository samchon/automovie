import { type AutoMovieArchetype } from "../core/index";
import { type LongImplementDraw } from "./LongImplementDraw";
import { createStageTrailHandspike as createStageTrailHandspikeImplementation } from "./internal/createStageTrailHandspike";

/** Public operations for Auto Movie Archetype Stage Trail Handspike. */
export namespace AutoMovieArchetypeStageTrailHandspike {
  /**
   * Inert handspike display prop with a shaft hold and an end marker.
   *
   * @param params The optional scene ID and any fixed free dimension in metres or
   *   kilograms.
   * @param seed The seed for the recorded recipe. Without a seed, the draw uses
   *   the original defaults.
   * @returns The model with its named contact frames in model space.
   * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
   *   outside its admitted recipe.
   */
  export function create(params?: Pick<LongImplementDraw.IParams, "id" | "length" | "mass">, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageTrailHandspike.Affordance,
  AutoMovieArchetypeStageTrailHandspike.Dimension
> {
    return createStageTrailHandspikeImplementation(params, seed);
  }

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "shaft";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass";}

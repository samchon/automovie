import { type AutoMovieArchetype } from "../core/index";
import { type LongImplementDraw } from "./internal/LongImplementDraw";
import { createStageAtlatl as createStageAtlatlImplementation } from "./internal/createStageAtlatl";

/** Public operations for Auto Movie Archetype Stage Atlatl. */
export namespace AutoMovieArchetypeStageAtlatl {
  /**
   * Inert atlatl prop with its original display grip and end locator.
   *
   * @param params The optional scene ID and any fixed free dimension in metres or
   *   kilograms.
   * @param seed The seed for the recorded recipe. Without a seed, the draw uses
   *   the original defaults.
   * @returns The model with its named contact frames in model space.
   * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
   *   outside its admitted recipe.
   */
  export function create(params?: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "width" | "spurSetback" | "gripSetback" | "mass"
  >, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageAtlatl.Affordance,
  AutoMovieArchetypeStageAtlatl.Dimension
> {
    return createStageAtlatlImplementation(params, seed);
  }

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "grip" | "spur";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "gripSetback"
    | "launchSpeed"
    | "length"
    | "mass"
    | "spurSetback"
    | "width";}

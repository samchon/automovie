import { type AutoMovieArchetype } from "../core/index";
import { type WornPropDraw } from "./internal/WornPropDraw";
import { createWatch as createWatchImplementation } from "./internal/createWatch";

/** Public operations for Auto Movie Archetype Watch. */
export namespace AutoMovieArchetypeWatch {
  /**
   * Wristwatch resting dial up with a straight band.
   *
   * The band runs along model Z. The dial's 12 o'clock lies toward model `-Z`, so
   * `face` reads with model `-Z` as its top.
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
    WornPropDraw.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeWatch.Affordance, AutoMovieArchetypeWatch.Dimension> {
    return createWatchImplementation(params, seed);
  }

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "hold" | "wear";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";}

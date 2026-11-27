import { type AutoMovieArchetype } from "../core/index";
import { type GroomingPropDraw } from "./internal/GroomingPropDraw";
import { createToothbrush as createToothbrushImplementation } from "./internal/createToothbrush";

/** Public operations for Auto Movie Archetype Toothbrush. */
export namespace AutoMovieArchetypeToothbrush {
  /**
   * Toothbrush with a handle and a +Y bristle face near its far end.
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
    GroomingPropDraw.IParams,
    "id" | "length" | "width" | "mass"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeToothbrush.Affordance, AutoMovieArchetypeToothbrush.Dimension> {
    return createToothbrushImplementation(params, seed);
  }

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "grip";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "width";}

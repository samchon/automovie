import { type AutoMovieArchetype } from "../core/index";
import { type GroomingPropDraw } from "./GroomingPropDraw";
import { createComb as createCombImplementation } from "./internal/createComb";

/** Public operations for Auto Movie Archetype Comb. */
export namespace AutoMovieArchetypeComb {
  /**
   * Pocket comb with a sideways spine grip and a working edge along the teeth.
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
    "id" | "length" | "width" | "mass" | "thickness"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeComb.Affordance, AutoMovieArchetypeComb.Dimension> {
    return createCombImplementation(params, seed);
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
  export type Dimension = "length" | "mass" | "thickness" | "width";}

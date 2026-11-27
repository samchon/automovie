import { type AutoMovieArchetype } from "../core/index";
import { type GroomingPropDraw } from "./internal/GroomingPropDraw";
import { createLipstick as createLipstickImplementation } from "./internal/createLipstick";

/** Public operations for Auto Movie Archetype Lipstick. */
export namespace AutoMovieArchetypeLipstick {
  /**
   * Lipstick case with a precision grip and an exposed tip along +Z.
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
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeLipstick.Affordance, AutoMovieArchetypeLipstick.Dimension> {
    return createLipstickImplementation(params, seed);
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

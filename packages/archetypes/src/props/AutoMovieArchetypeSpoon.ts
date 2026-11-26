import { type AutoMovieArchetype } from "../core/index";
import { type HandToolDraw } from "./HandToolDraw";
import { createSpoon as createSpoonImplementation } from "./internal/createSpoon";

/** Public operations for Auto Movie Archetype Spoon. */
export namespace AutoMovieArchetypeSpoon {
  /**
   * Spoon with a pinch grip and an bowl facing +Z in its tool frame.
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
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeSpoon.Affordance, AutoMovieArchetypeSpoon.Dimension> {
    return createSpoonImplementation(params, seed);
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
  export type Dimension = "gripDiameter" | "length" | "mass";}

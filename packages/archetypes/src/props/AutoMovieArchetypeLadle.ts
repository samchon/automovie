import { type AutoMovieArchetype } from "../core/index";
import { type HandToolDraw } from "./HandToolDraw";
import { createLadle as createLadleImplementation } from "./internal/createLadle";

/** Public operations for Auto Movie Archetype Ladle. */
export namespace AutoMovieArchetypeLadle {
  /**
   * Ladle with a pinch grip and a bowl facing +Z.
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
    "id" | "length" | "gripDiameter" | "mass" | "bowl"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeLadle.Affordance, AutoMovieArchetypeLadle.Dimension> {
    return createLadleImplementation(params, seed);
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
  export type Dimension = "bowl" | "gripDiameter" | "length" | "mass";}

import { type AutoMovieArchetype } from "../core/index";
import { type WornPropDraw } from "./WornPropDraw";
import { createHat as createHatImplementation } from "./internal/createHat";

/** Public operations for Auto Movie Archetype Hat. */
export namespace AutoMovieArchetypeHat {
  /**
   * Hat with a brim pinch and a crown socket.
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
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeHat.Affordance, AutoMovieArchetypeHat.Dimension> {
    return createHatImplementation(params, seed);
  }

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "hold" | "wear";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";}

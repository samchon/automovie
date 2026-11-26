import { type AutoMovieArchetype } from "../core/index";
import { type LongImplementDraw } from "./LongImplementDraw";
import { createShovel as createShovelImplementation } from "./internal/createShovel";

/** Public operations for Auto Movie Archetype Shovel. */
export namespace AutoMovieArchetypeShovel {
  /**
   * Shovel resting on its blade edge with a two-hand shaft and top D grip.
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
    "id" | "length" | "shaftDiameter" | "mass"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeShovel.Affordance, AutoMovieArchetypeShovel.Dimension> {
    return createShovelImplementation(params, seed);
  }

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "grip" | "shaft";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "shaftDiameter";}

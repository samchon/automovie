import { type AutoMovieArchetype } from "../core/index";
import { type SmokingPropDraw } from "./SmokingPropDraw";
import { createCigarette as createCigaretteImplementation } from "./internal/createCigarette";

/** Public operations for Auto Movie Archetype Cigarette. */
export namespace AutoMovieArchetypeCigarette {
  /**
   * Inert cigarette proxy with a pinch, filter contact and lit-end locator.
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
    SmokingPropDraw.IParams,
    "id" | "length" | "diameter" | "filter" | "mass"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeCigarette.Affordance, AutoMovieArchetypeCigarette.Dimension> {
    return createCigaretteImplementation(params, seed);
  }

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "flame" | "grip" | "mouth";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "filter" | "length" | "mass";}

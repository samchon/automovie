import { type AutoMovieArchetype } from "../core/index";
import { type GroomingPropDraw } from "./internal/GroomingPropDraw";
import { createTissue as createTissueImplementation } from "./internal/createTissue";

/** Public operations for Auto Movie Archetype Tissue. */
export namespace AutoMovieArchetypeTissue {
  /**
   * Flat tissue sheet with a centered pinch and a wiping surface above it.
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
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeTissue.Affordance, AutoMovieArchetypeTissue.Dimension> {
    return createTissueImplementation(params, seed);
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

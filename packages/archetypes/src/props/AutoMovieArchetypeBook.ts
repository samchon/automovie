import { type AutoMovieArchetype } from "../core/index";
import { type StationeryDraw } from "./StationeryDraw";
import { createBook as createBookImplementation } from "./internal/createBook";

/** Public operations for Auto Movie Archetype Book. */
export namespace AutoMovieArchetypeBook {
  /**
   * Book with a spine grip, a hinged cover and a separately turning leaf.
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
    StationeryDraw.IParams,
    "id" | "width" | "length" | "thickness" | "mass"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeBook.Affordance, AutoMovieArchetypeBook.Dimension> {
    return createBookImplementation(params, seed);
  }

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance =
    | "edge"
    | "face"
    | "grip"
    | "hinge"
    | "page"
    | "page-edge";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "thickness" | "width";}

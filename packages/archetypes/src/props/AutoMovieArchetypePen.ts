import { type AutoMovieArchetype } from "../core/index";
import { type StationeryDraw } from "./internal/StationeryDraw";
import { createPen as createPenImplementation } from "./internal/createPen";

/** Public operations for Auto Movie Archetype Pen. */
export namespace AutoMovieArchetypePen {
  /**
   * Pen with a precision pinch and an axial writing tip along +Z.
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
    "id" | "length" | "thickness" | "mass"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypePen.Affordance, AutoMovieArchetypePen.Dimension> {
    return createPenImplementation(params, seed);
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
  export type Dimension = "length" | "mass" | "thickness";}

import { type AutoMovieArchetype } from "../core/index";
import { type HandToolDraw } from "./internal/HandToolDraw";
import { createHandSaw as createHandSawImplementation } from "./internal/createHandSaw";

/** Public operations for Auto Movie Archetype Hand Saw. */
export namespace AutoMovieArchetypeHandSaw {
  /**
   * Hand saw with a blade ledge and a grip across its heel.
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
    "id" | "length" | "gripDiameter" | "mass" | "blade"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeHandSaw.Affordance, AutoMovieArchetypeHandSaw.Dimension> {
    return createHandSawImplementation(params, seed);
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
  export type Dimension = "blade" | "gripDiameter" | "length" | "mass";}

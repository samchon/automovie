import { type AutoMovieArchetype } from "../core/index";
import { type HandToolDraw } from "./HandToolDraw";
import { createStagePrimingWire as createStagePrimingWireImplementation } from "./internal/createStagePrimingWire";

/** Public operations for Auto Movie Archetype Stage Priming Wire. */
export namespace AutoMovieArchetypeStagePrimingWire {
  /**
   * Inert priming-wire display prop with a ring pinch and a tip locator.
   *
   * @param params The optional scene ID and any fixed free dimension in metres or
   *   kilograms.
   * @param seed The seed for the recorded recipe. Without a seed, the draw uses
   *   the original defaults.
   * @returns The model with its named contact frames in model space.
   * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
   *   outside its admitted recipe.
   */
  export function create(params?: Pick<HandToolDraw.IParams, "id" | "length" | "mass">, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStagePrimingWire.Affordance,
  AutoMovieArchetypeStagePrimingWire.Dimension
> {
    return createStagePrimingWireImplementation(params, seed);
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
  export type Dimension = "length" | "mass";}

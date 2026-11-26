import { type AutoMovieArchetype } from "../core/index";
import { type HandToolDraw } from "./HandToolDraw";
import { createHammer as createHammerImplementation } from "./internal/createHammer";

/** Public operations for Auto Movie Archetype Hammer. */
export namespace AutoMovieArchetypeHammer {
  /**
   * Hammer with a power grip near the butt and a head face toward +Z.
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
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeHammer.Affordance, AutoMovieArchetypeHammer.Dimension> {
    return createHammerImplementation(params, seed);
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

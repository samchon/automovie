import { type AutoMovieArchetype } from "../core/index";
import { type HandToolDraw } from "./internal/HandToolDraw";
import { createScrewdriver as createScrewdriverImplementation } from "./internal/createScrewdriver";

/** Public operations for Auto Movie Archetype Screwdriver. */
export namespace AutoMovieArchetypeScrewdriver {
  /**
   * Screwdriver with a round grip and an axial tip along +Y.
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
  >, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeScrewdriver.Affordance,
  AutoMovieArchetypeScrewdriver.Dimension
> {
    return createScrewdriverImplementation(params, seed);
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

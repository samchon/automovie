import { type AutoMovieArchetype } from "../core/index";
import { type LongImplementDraw } from "./LongImplementDraw";
import { createMop as createMopImplementation } from "./internal/createMop";

/** Public operations for Auto Movie Archetype Mop. */
export namespace AutoMovieArchetypeMop {
  /**
   * Mop with a wide pad and a two-hand shaft. Fixed `upperGrip` and `lowerGrip`
   * handles on the clear shaft take the two hands of a floor stroke.
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
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeMop.Affordance, AutoMovieArchetypeMop.Dimension> {
    return createMopImplementation(params, seed);
  }

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "shaft" | "upperGrip" | "lowerGrip";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "shaftDiameter";}

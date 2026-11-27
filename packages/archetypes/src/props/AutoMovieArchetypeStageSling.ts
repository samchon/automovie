import { type AutoMovieArchetype } from "../core/index";
import { type LongImplementDraw } from "./internal/LongImplementDraw";
import { createStageSling as createStageSlingImplementation } from "./internal/createStageSling";

/** Public operations for Auto Movie Archetype Stage Sling. */
export namespace AutoMovieArchetypeStageSling {
  /**
   * Inert sling prop with its original display pouch and hand contacts.
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
    "id" | "length" | "shaftDiameter" | "pouchLength" | "pouchWidth" | "mass"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeStageSling.Affordance, AutoMovieArchetypeStageSling.Dimension> {
    return createStageSlingImplementation(params, seed);
  }

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "grip" | "pouch" | "release";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "launchSpeed"
    | "length"
    | "mass"
    | "pouchLength"
    | "pouchWidth"
    | "shaftDiameter";}

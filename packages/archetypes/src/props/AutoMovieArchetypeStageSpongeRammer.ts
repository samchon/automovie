import { type AutoMovieArchetype } from "../core/index";
import { type LongImplementDraw } from "./internal/LongImplementDraw";
import { createStageSpongeRammer as createStageSpongeRammerImplementation } from "./internal/createStageSpongeRammer";

/** Public operations for Auto Movie Archetype Stage Sponge Rammer. */
export namespace AutoMovieArchetypeStageSpongeRammer {
  /**
   * Inert sponge-and-rammer prop with visible end markers and a shaft hold.
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
  >, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageSpongeRammer.Affordance,
  AutoMovieArchetypeStageSpongeRammer.Dimension
> {
    return createStageSpongeRammerImplementation(params, seed);
  }

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "shaft" | "tip" | "rammer" | "sponge";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "shaftDiameter";}

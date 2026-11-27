import { type AutoMovieArchetype } from "../core/index";
import { createPlatformBed as createPlatformBedImplementation } from "./internal/createPlatformBed";
import { type AutoMovieArchetypeBed } from "./AutoMovieArchetypeBed";

/** Public operations for Auto Movie Archetype Platform Bed. */
export namespace AutoMovieArchetypePlatformBed {
  /**
   * A single or double household bed with a lying surface and opposed side seats.
   *
   * @param params The optional identifier, the admitted settings and any fixed
   *   dimensions in the inherited units.
   * @param seed Draws remaining dimensions and any model choice. Omit it for the
   *   first model and band midpoints.
   * @returns The generated model and its named local contacts.
   * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
   */
  export function create(params: AutoMovieArchetypePlatformBed.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypePlatformBed.Affordance,
  AutoMovieArchetypePlatformBed.Dimension
> {
    return createPlatformBedImplementation(params, seed);
  }

  /** The `kind` choices this producer admits. */
  export type Kind = "single" | "double";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "height" | "length" | "mass" | "thickness" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "leftSide" | "rightSide" | "surface";

  /** The admitted settings and optional model ID. */
  export interface IParams extends Pick<
    AutoMovieArchetypeBed.IParams,
    "id" | "width" | "length" | "height" | "thickness" | "mass"
  > {
    /** The household bed size. */
    kind: Kind;
  }

  /** Legacy selectors for this construction, in gallery order. */
  export const KINDS: readonly IParams["kind"][] = ["single", "double"];}

import { type AutoMovieArchetype } from "../core/index";
import { createStandingLamp as createStandingLampImplementation } from "./internal/createStandingLamp";
import { type AutoMovieArchetypeLight } from "./AutoMovieArchetypeLight";

/** Public operations for Auto Movie Archetype Standing Lamp. */
export namespace AutoMovieArchetypeStandingLamp {
  /**
   * A freestanding table or floor lamp with a positioned light binding.
   *
   * @param params The optional identifier, the admitted settings and any fixed
   *   dimensions in the inherited units.
   * @param seed Draws remaining dimensions and any model choice. Omit it for the
   *   first model and band midpoints.
   * @returns The generated model and its named local contacts.
   * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
   */
  export function create(params: AutoMovieArchetypeStandingLamp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStandingLamp.Affordance,
  AutoMovieArchetypeStandingLamp.Dimension
> {
    return createStandingLampImplementation(params, seed);
  }

  /** The `kind` choices this producer admits. */
  export type Kind = "tableLamp" | "floorLamp";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "base"
    | "height"
    | "mass"
    | "overall"
    | "shade"
    | "stem";

  /** The contact IDs declared by this producer. */
  export type Affordance = "grip" | "light";

  /** The admitted settings and optional model ID. */
  export interface IParams extends Pick<
    AutoMovieArchetypeLight.IParams,
    "id" | "height" | "shade" | "overall" | "stem" | "base" | "mass"
  > {
    /** The measured table or floor form. */
    kind: Kind;
  }

  /** Legacy selectors for this construction, in gallery order. */
  export const KINDS: readonly IParams["kind"][] = ["tableLamp", "floorLamp"];}

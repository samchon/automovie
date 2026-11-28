import { type AutoMovieArchetype } from "../core/index";
import { createPlatformBed as createPlatformBedImplementation } from "./internal/createPlatformBed";
import { type AutoMovieArchetypeBed } from "./AutoMovieArchetypeBed";

/** Constructs raised single and double beds with a headboard. */
export namespace AutoMovieArchetypePlatformBed {
  /**
   * Build a platform bed with a mattress, base and headboard at `-Z`.
   *
   * @param params Single or double kind, optional ID and fixed dimensions
   *   in its bands. The ID defaults to `bed`.
   * @param seed Numeric seed for omitted values. Without it the mattress
   *   top is 0.51 metres high.
   * @returns The bed with a mattress `surface` and two long-edge seats.
   * @throws {AutoMovieArchetypeRefusal} If a setting is inadmissible.
   */
  export function create(params: AutoMovieArchetypePlatformBed.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypePlatformBed.Affordance,
  AutoMovieArchetypePlatformBed.Dimension
> {
    return createPlatformBedImplementation(params, seed);
  }

  /**
   * Platform size with a 1.90 metre mattress length and width of 0.90 or 1.35 metres.
   */
  export type Kind = "single" | "double";

  /**
   * Mattress width, length, thickness and top height in metres, and empty bed mass in kilograms.
   */
  export type Dimension = "height" | "length" | "mass" | "thickness" | "width";

  /**
   * The mattress `surface`, left-edge seat on `+X` and right-edge seat on `-X`.
   */
  export type Affordance = "leftSide" | "rightSide" | "surface";

  /** Required bed size and optional scene ID and fixed band dimensions. */
  export interface IParams extends Pick<
    AutoMovieArchetypeBed.IParams,
    "id" | "width" | "length" | "height" | "thickness" | "mass"
  > {
    /** Selects the single or double platform width and mass interval. */
    kind: Kind;
  }

  /** Platform size selectors admitted by `create`. */
  export const KINDS: readonly IParams["kind"][] = ["single", "double"];}

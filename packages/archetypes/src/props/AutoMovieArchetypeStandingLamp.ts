import { type AutoMovieArchetype } from "../core/index";
import { createStandingLamp as createStandingLampImplementation } from "./internal/createStandingLamp";
import { type AutoMovieArchetypeLight } from "./AutoMovieArchetypeLight";

/**
 * Constructs a freestanding table or floor lamp with a socket inside its shade.
 */
export namespace AutoMovieArchetypeStandingLamp {
  /**
   * Build a round base at Y zero, an upright stem and a shade.
   *
   * The `light` socket points `+Y` from the top of the stem. The
   * `grip` lies halfway up the shade and faces `-X`.
   *
   * @param params Required table or floor kind, optional scene ID and
   *   applicable finite measurements. The ID defaults to `light`.
   * @param seed Numeric seed for omitted values. Seedless overall
   *   heights are 0.41 metres for table and 1.53 metres for floor.
   * @returns The base, stem and shade with grip and emitter socket.
   * @throws {AutoMovieArchetypeRefusal} If a kind or fixed value is inadmissible.
   */
  export function create(params: AutoMovieArchetypeStandingLamp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStandingLamp.Affordance,
  AutoMovieArchetypeStandingLamp.Dimension
> {
    return createStandingLampImplementation(params, seed);
  }

  /** Selects the freestanding table or floor construction and its bands. */
  export type Kind = "tableLamp" | "floorLamp";

  /**
   * Base and shade diameters, shade height, stem height and overall
   * height in metres. Total mass is in kilograms.
   */
  export type Dimension =
    | "base"
    | "height"
    | "mass"
    | "overall"
    | "shade"
    | "stem";

  /** Side shade `grip` and upward `light` at the top of the stem. */
  export type Affordance = "grip" | "light";

  /**
   * Standing form, optional scene ID and finite dimensions within the selected form's bands.
   */
  export interface IParams extends Pick<
    AutoMovieArchetypeLight.IParams,
    "id" | "height" | "shade" | "overall" | "stem" | "base" | "mass"
  > {
    /** Required `tableLamp` or `floorLamp` size and construction. */
    kind: Kind;
  }

  /** The two accepted standing forms in table-then-floor order. */
  export const KINDS: readonly IParams["kind"][] = ["tableLamp", "floorLamp"];}

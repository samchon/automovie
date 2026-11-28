import { type AutoMovieArchetype } from "../core/index";
import { createLantern as createLanternImplementation } from "./internal/createLantern";
import { type AutoMovieArchetypeLight } from "./AutoMovieArchetypeLight";

/**
 * Constructs a hurricane lantern with a fixed raised bail and upward burner socket.
 */
export namespace AutoMovieArchetypeLantern {
  /**
   * Build a hurricane lantern standing at model Y zero with its bail raised.
   *
   * The `grip` and `hook` share the bail wire centre. The upward `light`
   * socket is at the burner below the translucent globe.
   *
   * @param params Optional scene ID and finite base and globe diameters, globe,
   *   body and bail heights, or mass. The ID defaults to `light`.
   * @param seed Numeric seed for omitted values. Omit it for
   *   a 0.3048 metre body and
   *   0.4064 metre raised-bail height.
   * @returns The standing lantern with bail contacts and a fixed burner socket.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: AutoMovieArchetypeLantern.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeLantern.Affordance, AutoMovieArchetypeLantern.Dimension> {
    return createLanternImplementation(params, seed);
  }

  /**
   * Base and globe diameters, globe height, body height and raised-bail height in metres. Mass is in kilograms.
   */
  export type Dimension =
    | "bail"
    | "base"
    | "height"
    | "mass"
    | "overall"
    | "shade";

  /** An upper bail `grip` and `hook`, plus upward `light` at the globe base. */
  export type Affordance = "grip" | "hook" | "light";

  /**
   * Optional ID, finite base and globe diameters, globe, body and bail heights in metres, and mass in kilograms.
   */
  export type IParams = Pick<
    AutoMovieArchetypeLight.IParams,
    "id" | "height" | "shade" | "overall" | "base" | "bail" | "mass"
  >;}

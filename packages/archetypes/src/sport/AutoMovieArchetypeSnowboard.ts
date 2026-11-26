import { type AutoMovieArchetype } from "../core/index";
import { createSnowboard as createSnowboardImplementation } from "./internal/createSnowboard";

/** Public operations for Auto Movie Archetype Snowboard. */
export namespace AutoMovieArchetypeSnowboard {
  /**
   * A coarse snowboard with distinct binding sites and visible raised ends. The
   * nose is along -Z. The waist, length and stance width follow Burton's 154 cm
   * Custom Camber. Adjacent panels share section vertices. Tip widths, thickness
   * and rise are provisional. Bindings are simple contact pads.
   * https://www.burton.com/en-us/products/mens-burton-custom-camber-snowboard-106881
   *
   * @param params Optional scene id and mass in kilograms.
   * @param seed Draws the mass if the author leaves it open.
   * @returns A board with a deck, binding sites and both edge markers.
   */
  export function create(params?: AutoMovieArchetypeSnowboard.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeSnowboard.Affordance, "mass"> {
    return createSnowboardImplementation(params, seed);
  }

  /** Top deck, both binding sites and lower edges at the waist. */
  export type Affordance =
    | "deck"
    | "frontBinding"
    | "rearBinding"
    | "leftEdge"
    | "rightEdge";

  /** Optional scene identity and fixed mass. */
  export interface IParams {
    /** Scene id, unique if a scene has multiple snowboards. */
    id?: string;

    /**
     * Mass in kilograms. Drawn from the documented provisional band when
     * absent.
     */
    mass?: number;
  }}

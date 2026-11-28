import { type AutoMovieArchetype } from "../core/index";
import { createCanoe as createCanoeImplementation } from "./internal/createCanoe";
import { AutoMovieArchetypeBoat } from "./AutoMovieArchetypeBoat";

/** Public operations for Auto Movie Archetype Canoe. */
export namespace AutoMovieArchetypeCanoe {
  /**
   * Build a tandem canoe with two fixed seats facing the bow.
   *
   * The bow points along local `+Z` and the reference waterline is `Y = 0`.
   * `thwart0` is the bow seat and `thwart1` is the stern seat. The selected
   * hull and layup determine the catalogue dimensions and mass. The seats
   * share the selected height above the hull bottom.
   *
   * @param params Optional subject ID, seat height in metres, hull and layup.
   * @param seed Chooses omitted catalogue entries and draws omitted dimensions.
   *   Omit it to use the first available entries and band midpoints.
   * @returns The canoe with fixed seats, floor, gunwale and end contacts.
   * @throws {AutoMovieArchetypeRefusal} For an unknown catalogue choice, a layup
   *   absent from that hull, or a fixed seat height outside its band.
   */
  export function create(params?: AutoMovieArchetypeCanoe.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeCanoe.Affordance, AutoMovieArchetypeCanoe.Dimension> {
    return createCanoeImplementation(params, seed);
  }

  /** The `model` choices this producer admits. */
  export type Model =
    | "prospector16"
    | "discovery169"
    | "spiritII"
    | "minnesotaII";

  /**
   * Shared boat dimension keys. The canoe records beam, depth, end height,
   * length, and seat height in metres, and mass in kilograms.
   */
  export type Dimension = AutoMovieArchetypeBoat.Dimension;

  /**
   * Shared boat contact identifiers. The canoe supplies `bow`, `stern`,
   * `floor`, `gunwale`, `thwart0`, and `thwart1`.
   */
  export type Affordance = AutoMovieArchetypeBoat.Affordance;

  /**
   * Canoe catalogue choices, scene ID, and optional seat height in metres.
   */
  export interface IParams extends Pick<
    AutoMovieArchetypeBoat.IParams,
    "id" | "seatHeight"
  > {
    /**
     * Catalogue hull. Defaults to the first hull when no seed is given.
     */
    model?: Model;
    /**
     * Layup available on the selected hull, defaulting to its first when unseeded.
     */
    layup?: AutoMovieArchetypeBoat.Layup;
  }}

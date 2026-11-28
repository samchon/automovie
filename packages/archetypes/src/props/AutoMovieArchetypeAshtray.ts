import { type AutoMovieArchetype } from "../core/index";
import { createAshtray as createAshtrayImplementation } from "./internal/createAshtray";
import { type AutoMovieArchetypeVessel } from "./AutoMovieArchetypeVessel";

/**
 * Constructs a glass ashtray with a supported inner floor and underside pinch.
 */
export namespace AutoMovieArchetypeAshtray {
  /**
   * Build an open glass ashtray resting at model Y zero.
   *
   * The `rim` and supported `inside` face `+Y`. The `body` pinches
   * across floor thickness from below, toward `-Y`.
   *
   * @param params Optional scene ID and complete glass ashtray model.
   *   The default ID is `vessel`.
   * @param seed Numeric seed for an omitted model. Omit it for `nachtmann`,
   *   0.1 metres wide, 0.03 metres high and 0.258 kilograms.
   * @returns The glass dish with its opening, floor surface and precision hold.
   * @throws {AutoMovieArchetypeRefusal} If the model is unavailable.
   */
  export function create(params?: AutoMovieArchetypeAshtray.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeAshtray.Affordance, AutoMovieArchetypeAshtray.Dimension> {
    return createAshtrayImplementation(params, seed);
  }

  /** Recorded glass ashtray labels `nachtmann` and `harris`. */
  export type Model = "nachtmann" | "harris";

  /**
   * Recorded outside span and rim height in metres, and model mass in kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass";

  /**
   * Upward `rim` and supported `inside`, plus downward precision `body` grip.
   */
  export type Affordance = "body" | "inside" | "rim";

  /** Optional scene ID and one complete glass catalogue model. */
  export interface IParams extends Pick<AutoMovieArchetypeVessel.IParams, "id"> {
    /**
     * Selects `nachtmann` or `harris`. Omit the model and seed for `nachtmann`.
     */
    model?: Model;
  }}

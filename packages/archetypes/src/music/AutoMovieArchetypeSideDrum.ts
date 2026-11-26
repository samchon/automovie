import { type AutoMovieArchetype } from "../core/index";
import { createSideDrum as createSideDrumImplementation } from "./internal/createSideDrum";
import { type createInstrument } from "./createInstrument";

/** Public operations for Auto Movie Archetype Side Drum. */
export namespace AutoMovieArchetypeSideDrum {
  /**
   * A side drum with separate batter-head and carrier contacts.
   *
   * The drum stands on its bottom head. The head surface accepts a stick contact
   * and sling marks the carrier hook.
   *
   * @param params The optional identifier and dimensions fixed within their
   *   recorded bands.
   * @param seed The seed for free dimensions. The band midpoints apply without a
   *   seed.
   * @returns The model with its named contacts in its local frame.
   * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
   *   cannot be realized.
   */
  export function create(params?: AutoMovieArchetypeSideDrum.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeSideDrum.Affordance, AutoMovieArchetypeSideDrum.Dimension> {
    return createSideDrumImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "diameter" | "mass";

  /** The named playing and carrying contacts. */
  export type Affordance = "head" | "sling";

  /** The identifier and dimension overrides for this instrument. */
  export type IParams = Pick<
    createInstrument.IParams,
    "id" | "diameter" | "depth" | "mass"
  >;}
